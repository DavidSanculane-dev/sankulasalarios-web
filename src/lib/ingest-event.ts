import { db } from "@/db/client";
import { devices, deviceUserMap, attendanceEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { NormalizedEvent } from "./normalized-event";

/**
 * Recebe um evento já normalizado (independente da marca de origem), resolve
 * o dispositivo pelo número de série, tenta mapear para um funcionário real,
 * e grava o evento. Se o dispositivo não estiver registado, rejeita - assim
 * evitamos lixo de dispositivos não autorizados/desconhecidos na tabela.
 */
export async function ingestEvent(event: NormalizedEvent) {
  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.serialNumber, event.deviceSerialNumber))
    .limit(1);

  if (!device) {
    throw new Error(
      `Dispositivo com número de série "${event.deviceSerialNumber}" não está registado. Regista-o primeiro na tabela devices.`
    );
  }

  // Tenta encontrar o mapeamento para um funcionário real
  const [mapping] = await db
    .select()
    .from(deviceUserMap)
    .where(
      and(
        eq(deviceUserMap.deviceId, device.id),
        eq(deviceUserMap.deviceUserId, event.rawDeviceUserId)
      )
    )
    .limit(1);

 // Grava o evento na base de dados
  const insertPromise = db.insert(attendanceEvents).values({
    companyId: device.companyId,
    employeeId: mapping?.employeeId ?? null,
    deviceId: device.id,
    rawDeviceUserId: event.rawDeviceUserId,
    eventTime: event.eventTime,
    eventType: event.eventType,
    verifyMethod: event.verifyMethod,
    rawPayload: event.rawPayload ?? null,
  });

  // Atualiza o ping do equipamento
  const updatePromise = db
    .update(devices)
    .set({ lastSeenAt: new Date() })
    .where(eq(devices.id, device.id));

  // Executa ambas as queries em simultâneo na base de dados
  await Promise.all([insertPromise, updatePromise]);

  return { matched: !!mapping, deviceId: device.id };
}
