import { NextRequest, NextResponse } from "next/server";
import { ingestEvent } from "@/lib/ingest-event";
import { NormalizedEventSchema } from "@/lib/normalized-event";

export const dynamic = "force-dynamic";

function parseAttendanceLine(line: string) {
  // O padrão ADMS separa os dados estritamente por tabulações (\t)
  const parts = line.trim().split("\t");
  if (parts.length < 2) return null;

  const [pin, timeStr, statusRaw, verifyRaw] = parts;

  // Mapeamento expandido de Status ADMS (ZKTeco)
  // 0, 4 = Entrada / 1, 5 = Saída
  let eventType: "check_in" | "check_out" | "unknown" = "unknown";
  if (statusRaw === "0" || statusRaw === "4") eventType = "check_in";
  if (statusRaw === "1" || statusRaw === "5") eventType = "check_out";

  // Tabela oficial de métodos de verificação (PUSH SDK ZKTeco)
  const verifyMap: Record<string, "fingerprint" | "face" | "card" | "password" | "unknown"> = {
    "0": "password",
    "1": "fingerprint",
    "2": "card",
    "3": "password",
    "4": "fingerprint",
    "15": "face",
    "25": "face" // Reconhecimento facial por luz visível moderna (ex: SpeedFace)
  };

  // Correção da Data: Transforma "2026-07-01 08:30:00" num formato interpretável de forma segura pela Vercel
  // Assumindo a hora local da empresa (ex: Moçambique/Portugal), adicionamos o offset ou tratamos nativamente:
  let safeDate = new Date();
  if (timeStr) {
    const standardizedStr = timeStr.replace(" ", "T");
    // Se a máquina estiver configurada em hora local, adicionamos o fuso horário ou lemos os blocos:
    safeDate = new Date(standardizedStr);
    
    // Fallback de segurança se o parser do Node falhar
    if (isNaN(safeDate.getTime())) {
      const [datePart, timePart] = timeStr.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second] = timePart.split(":").map(Number);
      safeDate = new Date(year, month - 1, day, hour, minute, second);
    }
  }

  return {
    pin,
    eventTime: safeDate,
    eventType,
    verifyMethod: verifyMap[verifyRaw] ?? "unknown",
  };
}

// ---------------------------------------------------------------------------
// GET: Handshake Inicial e Registro do Equipamento
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const sn = req.nextUrl.searchParams.get("SN");
  const table = req.nextUrl.searchParams.get("table");

  if (!sn) {
    return new NextResponse("SN em falta", { status: 400 });
  }

  // Pedido de handshake/opções do leitor (Ocorre quando liga o relógio à rede)
  if (!table) {
    const config = [
      `GET OPTION FROM: ${sn}`,
      "ATTLOGStamp=None",
      "OPERLOGStamp=None",
      "ErrorDelay=30",
      "Delay=10",
      "TransFlag=1111000000",
      "TransInterval=1", // Força o leitor a enviar os dados a cada 1 minuto
      "Realtime=1",      // Ativa envio em tempo real instantâneo após a picagem
      "Encrypt=None",
    ].join("\n");

    return new NextResponse(config, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Fallback genérico para tabelas secundárias de sincronização
  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}

// ---------------------------------------------------------------------------
// POST: Recebimento das Picagens Brutas de Assiduidade
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const sn = req.nextUrl.searchParams.get("SN");
  if (!sn) {
    return new NextResponse("SN em falta", { status: 400 });
  }

  const rawBody = await req.text();
  const lines = rawBody.split("\n").filter((l) => l.trim().length > 0);

  // Executamos o loop de processamento de linhas
  for (const line of lines) {
    // Ignora linhas de controlo operacional do firmware da ZKTeco
    if (line.startsWith("OPLOG") || line.startsWith("USER") || line.startsWith("FACE")) continue;

    const parsed = parseAttendanceLine(line);
    if (!parsed) continue;

    try {
      const event = NormalizedEventSchema.parse({
        deviceSerialNumber: sn, // Mapeia para a sua tabela "devices"
        rawDeviceUserId: parsed.pin, // PIN interno do leitor (vai bater no seu deviceUserMap)
        eventTime: parsed.eventTime,
        eventType: parsed.eventType,
        verifyMethod: parsed.verifyMethod,
        rawPayload: { source: "zkteco_adms", line: line.trim() },
      });

      // Invoca o ingestor centralizado do seu SaaS
      await ingestEvent(event);
    } catch (err) {
      console.error("Falha ao processar linha ADMS da ZKTeco:", line, err);
      // Não abortamos o loop para que uma linha corrompida não bloqueie as restantes picagens do lote
    }
  }

  // 🔴 CORREÇÃO OBRIGATÓRIA DE COMPATIBILIDADE:
  // O firmware da ZKTeco exige estritamente a palavra "OK" isolada em texto simples para limpar a memória do leitor.
  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
