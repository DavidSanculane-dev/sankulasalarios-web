"use server";

import { db } from "@/db/client";
import { deviceUserMap, attendanceEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMappingAction(formData: FormData) {
  const deviceId = formData.get("deviceId") as string;
  const deviceUserId = formData.get("deviceUserId") as string;
  const employeeId = formData.get("employeeId") as string;

  if (!deviceId || !deviceUserId || !employeeId) {
    return { error: "Todos os campos são obrigatórios para efetuar o vínculo." };
  }

  try {
    // 1. Insere o vínculo oficial na tabela device_user_map
    await db.insert(deviceUserMap).values({
      deviceId,
      deviceUserId,
      employeeId,
    });

    // 2. Atualiza retroativamente todos os eventos antigos deste ID para o funcionário certo
    await db
      .update(attendanceEvents)
      .set({ employeeId })
      .where(
        and(
          eq(attendanceEvents.deviceId, deviceId),
          eq(attendanceEvents.rawDeviceUserId, deviceUserId)
        )
      );

    // 3. Atualiza os ecrãs instantaneamente
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "23505") {
      return { error: "Este ID já se encontra vinculado a um colaborador neste dispositivo." };
    }
    return { error: "Erro crítico ao processar o mapeamento no Postgres." };
  }
}
