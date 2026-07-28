import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { attendanceEvents, devices, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    // Validação de Segurança básica para garantir que o pedido vem do seu servidor local
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const payload = await request.json();

    // O BioStar 2 envia os eventos dentro de uma estrutura (geralmente um array ou objeto de log)
    // Estrutura padrão Suprema: payload.event_log ou payload.records
    const eventLog = payload.event_log || payload;

    const serialNumber = eventLog.device_id?.toString(); // Nº Série do BioStation 3
    const rawDeviceUserId = eventLog.user_id?.toString(); // ID do funcionário no relógio
    const eventTypeCodeRaw = eventLog.event_type_code; // Código Suprema (ex: 29 = Entrada, 30 = Saída)

    if (!serialNumber || !rawDeviceUserId) {
      return NextResponse.json({ error: "Payload incompleto" }, { status: 400 });
    }

    // 1. Procura o dispositivo na sua base de dados pelo Número de Série do BS3-DB
    const foundDevice = await db
      .select()
      .from(devices)
      .where(eq(devices.serialNumber, serialNumber))
      .limit(1);

    if (foundDevice.length === 0) {
      return NextResponse.json({ error: "Terminal BS3 não cadastrado no sistema" }, { status: 404 });
    }

    const device = foundDevice[0];

    // 2. Mapeamento do tipo de operação (Entrada/Saída) baseado nos códigos Suprema
    // Ajuste estes números conforme as regras de teclas de função configuradas no seu BioStation 3
    let eventType: "check_in" | "check_out" | "unknown" = "unknown";
    if (eventTypeCodeRaw === 29 || eventLog.tna_key === "1") eventType = "check_in";
    if (eventTypeCodeRaw === 30 || eventLog.tna_key === "2") eventType = "check_out";

    // 3. Verifica se este utilizador biométrico já está associado a um funcionário real
    // Procura na sua tabela employees através do ID do relógio (vínculo automático ou retroativo)
    const matchedEmployee = await db
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(
          eq(employees.companyId, device.companyId),
          eq(employees.employeeCode, rawDeviceUserId) // Assumindo que o código interno coincide com o ID biométrico
        )
      )
      .limit(1);

    const employeeId = matchedEmployee.length > 0 ? matchedEmployee[0].id : null;

    // 4. Injeta a picagem em tempo real na sua tabela do Supabase
    await db.insert(attendanceEvents).values({
      companyId: device.companyId,
      deviceId: device.id,
      employeeId: employeeId, // Fica nulo e gera o botão amarelo no painel se não estiver mapeado
      rawDeviceUserId,
      eventTime: eventLog.datetime ? new Date(eventLog.datetime) : new Date(),
      eventType,
      verifyMethod: eventLog.verify_method || "Biometric (Face/Fingerprint)",
      rawPayload: payload,
    });

    // 5. Atualiza o status de "visto por último" do terminal
    await db
      .update(devices)
      .set({ lastSeenAt: new Date() })
      .where(eq(devices.id, device.id));

    return NextResponse.json({ success: true, message: "Evento capturado e gravado com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
