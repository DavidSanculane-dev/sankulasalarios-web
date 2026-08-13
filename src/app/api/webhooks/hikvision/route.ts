import { NextRequest, NextResponse } from "next/server";
import busboy from "busboy";
import { Readable } from "node:stream";
import { ingestEvent } from "@/lib/ingest-event";
import { NormalizedEventSchema } from "@/lib/normalized-event";

/**
 * Recebe eventos ISAPI de um terminal Hikvision configurado para "push" via
 * PUT /ISAPI/Event/notification/httpHosts apontando para este endpoint
 * (ex: https://o-teu-dominio.vercel.app/api/webhooks/hikvision).
 *
 * O corpo vem como multipart/mixed: uma parte JSON com o evento (AcsEvent)
 * e, opcionalmente, uma parte binária com uma foto associada ao evento.
 *
 * NOTA: cada terminal só consegue "ver" um IP/porta na tua rede/VPN se
 * estiver na mesma rede local, OU se configurares o dispositivo para apontar
 * diretamente para este URL público. Se o terminal estiver atrás de uma
 * rede sem acesso à internet, precisas do gateway local (ver README) a
 * fazer proxy deste POST para aqui.
 */

export const dynamic = "force-dynamic";

// Mapeia os códigos de verificação do Hikvision (currentVerifyMode) para o nosso enum
function mapVerifyMode(mode: string | undefined): "fingerprint" | "face" | "card" | "password" | "unknown" {
  if (!mode) return "unknown";
  const m = mode.toLowerCase();
  if (m.includes("fp") || m.includes("finger")) return "fingerprint";
  if (m.includes("face")) return "face";
  if (m.includes("card")) return "card";
  if (m.includes("pw") || m.includes("password")) return "password";
  return "unknown";
}

// major/minor: 5/75 e variantes costumam corresponder a check-in/check-out em
// alguns firmwares Hikvision - CONFIRMA os códigos exatos na tua config,
// porque variam por modelo. attendanceStatus, quando presente, é mais fiável.
function mapEventType(attendanceStatus: string | undefined): "check_in" | "check_out" | "unknown" {
  if (!attendanceStatus) return "unknown";
  const s = attendanceStatus.toLowerCase();
  if (s.includes("checkin") || s.includes("check_in") || s === "0") return "check_in";
  if (s.includes("checkout") || s.includes("check_out") || s === "1") return "check_out";
  return "unknown";
}

export async function POST(req: NextRequest) {
  // Exemplo: /api/webhooks/hikvision?token=mota_engil_secure_hash_123
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.HIKVISION_WEBHOOK_SECRET) {
    return new NextResponse("Não Autorizado", { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart")) {
    return new NextResponse("Content-Type multipart/mixed esperado", { status: 400 });
  }

  const bb = busboy({ headers: { "content-type": contentType } });
  const serialNumber =
    req.nextUrl.searchParams.get("SN") ?? req.headers.get("x-device-serial") ?? "";

  let processed = false;
  let errorMsg: string | null = null;

  const done = new Promise<void>((resolve) => {
    bb.on("field", () => {
      /* eventos simples podem chegar como campo de formulário em vez de ficheiro */
    });

    bb.on("file", (_name, file, info) => {
      const chunks: Buffer[] = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", async () => {
        // Só processamos a parte que parece ser JSON (evento), ignoramos imagens
        if (!info.mimeType?.includes("json")) return;

        try {
          const json = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
          // A HikVision pode encapsular como json.AcsEvent ou json.EventNotificationAlert
          const acsEvent = json.AcsEvent ?? json.EventNotificationAlert?.AccessControllerEvent ?? json;
          
          // Procurar o número de série dentro da estrutura padrão do JSON enviado pelo leitor
          const detectedSerial = serialNumber || 
                                 json.EventNotificationAlert?.macAddress || 
                                 acsEvent.deviceID || 
                                 acsEvent.serialNo;

          if (!detectedSerial) {
            throw new Error("Não foi possível detetar o Número de Série (SN) do dispositivo no payload.");
          }

          const event = NormalizedEventSchema.parse({
            deviceSerialNumber: detectedSerial,
            rawDeviceUserId: acsEvent.employeeNoString || acsEvent.cardNo || acsEvent.userType,
            eventTime: new Date(acsEvent.time ?? Date.now()),
            eventType: mapEventType(acsEvent.attendanceStatus),
            verifyMethod: mapVerifyMode(acsEvent.currentVerifyMode),
            rawPayload: { source: "hikvision_isapi", acsEvent },
          });

          await ingestEvent(event);
          processed = true;
        } catch (err) {
          console.error("Falha ao processar evento Hikvision:", err);
          errorMsg = err instanceof Error ? err.message : "erro desconhecido";
        }
      });
    });

    bb.on("finish", () => resolve());
  });

  // Next.js dá-nos o corpo como um ReadableStream web; o busboy precisa de um stream Node
  const nodeStream = Readable.fromWeb(req.body as any);
  nodeStream.pipe(bb);
  await done;

  if (errorMsg) {
    return new NextResponse(`Erro: ${errorMsg}`, { status: 500 });
  }

  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus version="1.0">
  <requestURL>/ISAPI/Event/notification</requestURL>
  <statusCode>1</statusCode>
  <statusString>OK</statusString>
</ResponseStatus>`;

  return new NextResponse(xmlResponse, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}
