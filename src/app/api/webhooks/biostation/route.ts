import { NextRequest, NextResponse } from "next/server";
import { ingestEvent } from "@/lib/ingest-event";
import { NormalizedEventSchema } from "@/lib/normalized-event";

export const dynamic = "force-dynamic";

// Mapeia os códigos de verificação nativos da Suprema (BioStar 2) para o seu enum
function mapSupremaVerifyMethod(eventTypeCode: number | undefined): "fingerprint" | "face" | "card" | "password" | "unknown" {
  if (!eventTypeCode) return "unknown";
  // Códigos padrão Suprema BioStar 2
  if (eventTypeCode === 29 || eventTypeCode === 53) return "fingerprint";
  if (eventTypeCode === 30 || eventTypeCode === 54) return "face";
  if (eventTypeCode === 32 || eventTypeCode === 50) return "card";
  if (eventTypeCode === 31) return "password";
  return "unknown";
}

// Na Suprema, o tipo de evento (Entrada/Saída) é determinado pela tecla T&A (tna_key)
function mapSupremaEventType(tnaKey: string | number | undefined): "check_in" | "check_out" | "unknown" {
  if (!tnaKey) return "unknown";
  const key = tnaKey.toString();
  if (key === "1" || key === "IN") return "check_in";
  if (key === "2" || key === "OUT") return "check_out";
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validação de Segurança Baseada no seu CRON_SECRET
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const payload = await request.json();

    // O BioStar 2 pode enviar o log dentro de "event_log", "records" ou diretamente no nó raiz
    const eventLog = payload.event_log || payload.records?.[0] || payload;

    // Na Suprema, o identificador do relógio pode vir como device_id numérico ou string
    const serialNumber = eventLog.device_id?.toString() || payload.device_id?.toString();
    const rawDeviceUserId = eventLog.user_id?.toString() || eventLog.user_id_string;
    const eventTypeCode = Number(eventLog.event_type_code || eventLog.type_code);

    if (!serialNumber || !rawDeviceUserId) {
      // Ignora payloads de sistema (ex: alarmes de porta aberta, sincronizações de tabelas)
      return NextResponse.json({ message: "Payload recebido, mas não contém uma picagem de utilizador válida." }, { status: 200 });
    }

    // 2. NORMALIZAR O EVENTO UTILIZANDO O SEU SCHEMA COMPARTILHADO
    const normalizedEvent = NormalizedEventSchema.parse({
      deviceSerialNumber: serialNumber,
      rawDeviceUserId: rawDeviceUserId,
      eventTime: eventLog.datetime ? new Date(eventLog.datetime) : new Date(),
      eventType: mapSupremaEventType(eventLog.tna_key || eventLog.tnaKey),
      verifyMethod: mapSupremaVerifyMethod(eventTypeCode),
      rawPayload: { source: "suprema_biostar2", raw: payload },
    });

    // 3. INVOCAR O SEU INGESTOR CENTRALIZADO (RESOLVE TENANT, MAPEAMENTO E PING DO DISPOSITIVO)
    // O seu @/lib/ingest-event já faz toda a magia de segurança baseada nas tabelas do Supabase!
    const result = await ingestEvent(normalizedEvent);

    return NextResponse.json({
      success: true,
      message: "Evento da Suprema processado com sucesso!",
      matchedEmployee: result.matched,
      deviceId: result.deviceId
    }, { status: 200 });

  } catch (error: any) {
    console.error("Erro no Webhook BioStar 2 / Suprema:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor" }, { status: 500 });
  }
}
