import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { devices, syncCursors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ingestEvent } from "@/lib/ingest-event";
import { NormalizedEventSchema } from "@/lib/normalized-event";

/**
 * A Suprema não "empurra" eventos como o ZKTeco - o servidor BioStar 2 fica
 * no site do cliente (rede local) e expõe uma REST API. Este endpoint deve
 * ser chamado periodicamente por um Vercel Cron Job (ver vercel.json) e faz:
 *
 *  1. Login na API local do BioStar 2 (sessão via bs-session-id)
 *  2. Consulta de eventos desde o último cursor de sincronização
 *  3. Normaliza e grava cada evento
 *
 * PRÉ-REQUISITO: o servidor BioStar 2 do cliente tem de estar acessível
 * publicamente (ou via VPN/túnel) a partir da Vercel - o que normalmente
 * significa correr este sync a partir do gateway local (ver README), não
 * diretamente da Vercel, já que o BioStar costuma estar numa rede fechada.
 * Deixa-se aqui como referência de como fazer a chamada à API.
 */

export const dynamic = "force-dynamic";

async function biostarLogin(baseUrl: string, username: string, password: string) {
  const res = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ User: { login_id: username, password } }),
  });

  if (!res.ok) {
    throw new Error(`Falha no login BioStar: ${res.status}`);
  }

  const sessionId = res.headers.get("bs-session-id");
  if (!sessionId) throw new Error("bs-session-id não recebido");
  return sessionId;
}

function mapEventCode(code: number): "check_in" | "check_out" | "unknown" {
  // Os códigos de evento do BioStar variam consoante a configuração de
  // "Event Type" no servidor - CONFIRMA os códigos reais no teu BioStar
  // (Settings > Event Type) antes de assumir estes valores.
  if (code === 4864) return "check_in"; // exemplo: VERIFY_SUCCESS mapeado a check-in
  if (code === 4865) return "check_out";
  return "unknown";
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const baseUrl = process.env.BIOSTAR_BASE_URL!;
  const username = process.env.BIOSTAR_USERNAME!;
  const password = process.env.BIOSTAR_PASSWORD!;

  const sessionId = await biostarLogin(baseUrl, username, password);

  const supremaDevices = await db
    .select()
    .from(devices)
    .where(eq(devices.brand, "suprema"));

  let totalProcessed = 0;

  for (const device of supremaDevices) {
    const [cursor] = await db
      .select()
      .from(syncCursors)
      .where(eq(syncCursors.deviceId, device.id))
      .limit(1);

    const since = cursor?.lastSyncedAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();

    const res = await fetch(`${baseUrl}/api/events/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "bs-session-id": sessionId,
      },
      body: JSON.stringify({
        Query: {
          conditions: [
            { column: "device_id", operator: 0, values: [device.externalRef] },
            { column: "datetime", operator: 3, values: [since.toISOString(), now.toISOString()] },
          ],
          limit: 200,
        },
      }),
    });

    if (!res.ok) {
      console.error(`Falha ao consultar eventos BioStar para device ${device.id}`);
      continue;
    }

    const data = await res.json();
    const rows = data?.EventCollection?.rows ?? [];

    for (const row of rows) {
      try {
        const event = NormalizedEventSchema.parse({
          deviceSerialNumber: device.serialNumber,
          rawDeviceUserId: String(row.user_id?.user_id ?? row.user_id),
          eventTime: new Date(row.datetime),
          eventType: mapEventCode(row.event_type_id?.code ?? -1),
          verifyMethod: "unknown",
          rawPayload: { source: "suprema_biostar2", row },
        });
        await ingestEvent(event);
        totalProcessed++;
      } catch (err) {
        console.error("Falha ao processar evento Suprema:", err);
      }
    }

    await db
      .insert(syncCursors)
      .values({ deviceId: device.id, lastSyncedAt: now })
      .onConflictDoUpdate({
        target: syncCursors.deviceId,
        set: { lastSyncedAt: now },
      });
  }

  return NextResponse.json({ ok: true, totalProcessed });
}
