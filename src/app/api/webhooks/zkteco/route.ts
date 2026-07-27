import { NextRequest, NextResponse } from "next/server";
import { ingestEvent } from "@/lib/ingest-event";
import { NormalizedEventSchema } from "@/lib/normalized-event";

/**
 * Protocolo ADMS (ZKTeco / BioTek / ESSL).
 *
 * IMPORTANTE: o corpo NÃO é JSON - é texto simples, linhas separadas por \n,
 * campos separados por \t (tab). O formato exato de cada linha de attlog
 * varia ligeiramente por modelo/firmware - confirma sempre com um dispositivo
 * real ou com a documentação "PUSH SDK" do teu modelo específico.
 *
 * Fluxo típico:
 *  1. GET  /iclock/cdata?SN=xxx&options=all   -> dispositivo regista-se / pede config
 *  2. POST /iclock/cdata?SN=xxx&table=ATTLOG  -> dispositivo envia registos de ponto
 *  3. GET  /iclock/getrequest?SN=xxx          -> dispositivo pergunta se há comandos pendentes
 *
 * O dispositivo espera respostas em TEXTO SIMPLES, não em JSON. Se a resposta
 * não for a esperada, o dispositivo assume falha e reenvia os dados.
 */

// Body chega como texto simples, não precisamos (nem queremos) o parser JSON do Next
export const dynamic = "force-dynamic";

function parseAttendanceLine(line: string) {
  // Formato mais comum: PIN <TAB> timestamp <TAB> status <TAB> verify <TAB> workcode ...
  const parts = line.trim().split("\t");
  if (parts.length < 2) return null;

  const [pin, timeStr, statusRaw, verifyRaw] = parts;

  // status: 0 = check-in, 1 = check-out (convenção comum, mas CONFIRMA no teu dispositivo)
  const eventType =
    statusRaw === "0" ? "check_in" : statusRaw === "1" ? "check_out" : "unknown";

  const verifyMap: Record<string, string> = {
    "0": "password",
    "1": "fingerprint",
    "2": "card",
    "15": "face",
  };

  return {
    pin,
    timeStr,
    eventType: eventType as "check_in" | "check_out" | "unknown",
    verifyMethod: (verifyMap[verifyRaw] ?? "unknown") as
      | "fingerprint"
      | "face"
      | "card"
      | "password"
      | "unknown",
  };
}

export async function GET(req: NextRequest) {
  const sn = req.nextUrl.searchParams.get("SN");
  const table = req.nextUrl.searchParams.get("table");

  if (!sn) {
    return new NextResponse("SN em falta", { status: 400 });
  }

  // Pedido de configuração inicial do dispositivo - resposta mínima que a
  // maioria dos firmwares aceita. Ajusta os valores conforme necessário.
  if (!table) {
    const config = [
      "GET OPTION FROM: " + sn,
      "ATTLOGStamp=None",
      "OPERLOGStamp=None",
      "ErrorDelay=30",
      "Delay=10",
      "TransFlag=1111000000",
      "TransInterval=1",
      "Realtime=1",
      "Encrypt=None",
    ].join("\n");
    return new NextResponse(config, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // /iclock/getrequest - por agora não enviamos comandos pendentes ao dispositivo
  return new NextResponse("OK", { status: 200 });
}

export async function POST(req: NextRequest) {
  const sn = req.nextUrl.searchParams.get("SN");
  if (!sn) {
    return new NextResponse("SN em falta", { status: 400 });
  }

  const rawBody = await req.text();
  const lines = rawBody.split("\n").filter((l) => l.trim().length > 0);

  let processed = 0;
  let failed = 0;

  for (const line of lines) {
    const parsed = parseAttendanceLine(line);
    if (!parsed) continue;

    try {
      const event = NormalizedEventSchema.parse({
        deviceSerialNumber: sn,
        rawDeviceUserId: parsed.pin,
        eventTime: new Date(parsed.timeStr.replace(" ", "T")),
        eventType: parsed.eventType,
        verifyMethod: parsed.verifyMethod,
        rawPayload: { source: "zkteco_adms", line },
      });
      await ingestEvent(event);
      processed++;
    } catch (err) {
      console.error("Falha ao processar linha ADMS:", line, err);
      failed++;
    }
  }

  // O dispositivo espera "OK" (ou o nº de registos aceites) em texto simples
  return new NextResponse(`OK: ${processed} processados, ${failed} falhados`, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
