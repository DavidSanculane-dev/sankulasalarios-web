import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { attendanceEvents, employees, devices, companies } from "@/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const companyId = searchParams.get("companyId");
    const deviceId = searchParams.get("deviceId");
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];

    if (companyId) conditions.push(eq(attendanceEvents.companyId, companyId));
    if (deviceId) conditions.push(eq(attendanceEvents.deviceId, deviceId));
    if (eventType) conditions.push(eq(attendanceEvents.eventType, eventType as "check_in" | "check_out" | "unknown"));
    if (startDate) conditions.push(gte(attendanceEvents.eventTime, new Date(`${startDate}T00:00:00Z`)));
    if (endDate) conditions.push(lte(attendanceEvents.eventTime, new Date(`${endDate}T23:59:59Z`)));

    // Executa a mesma query do histórico, mas sem limite de 100 linhas para exportar tudo
    const events = await db
      .select({
        eventTime: attendanceEvents.eventTime,
        eventType: attendanceEvents.eventType,
        verifyMethod: attendanceEvents.verifyMethod,
        rawDeviceUserId: attendanceEvents.rawDeviceUserId,
        employeeName: employees.fullName,
        deviceName: devices.name,
        deviceBrand: devices.brand,
        companyName: companies.name,
      })
      .from(attendanceEvents)
      .leftJoin(employees, eq(attendanceEvents.employeeId, employees.id))
      .leftJoin(devices, eq(attendanceEvents.deviceId, devices.id))
      .leftJoin(companies, eq(attendanceEvents.companyId, companies.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(attendanceEvents.eventTime));

    // Cabeçalho do ficheiro CSV (Separado por ponto e vírgula, padrão do Excel em português)
    let csvContent = "Funcionador/ID;Empresa;Data e Hora;Operacao;Validacao;Terminal\n";

    events.forEach((e) => {
      const colaborador = e.employeeName ? e.employeeName : `ID Biometrico: ${e.rawDeviceUserId} (Pendente)`;
      const empresa = e.companyName || "Sem empresa";
      const dataHora = new Date(e.eventTime).toLocaleString("pt-PT");
      const operacao = e.eventType === "check_in" ? "Entrada" : e.eventType === "check_out" ? "Saida" : "Desconhecido";
      const validacao = e.verifyMethod ? e.verifyMethod.replace(/_/g, " ") : "—";
      const terminal = `${e.deviceName || "Desconhecido"} (${e.deviceBrand || "N/A"})`;

      csvContent += `"${colaborador}";"${empresa}";"${dataHora}";"${operacao}";"${validacao}";"${terminal}"\n`;
    });

    // Injeta o BOM (Byte Order Mark) do UTF-8 para o Excel reconhecer os acentos automaticamente
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const csvBuffer = Buffer.concat([bom, Buffer.from(csvContent, "utf-8")]);

    return new NextResponse(csvBuffer, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="espelho_ponto_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao gerar exportação" }, { status: 500 });
  }
}
