"use server";

import { db } from "@/db/client";
import { devices } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export type DeviceBrand = "zkteco" | "hikvision" | "suprema";

// AÇÃO PARA APAGAR UM TERMINAL
export async function deleteDeviceAction(id: string) {
  if (!id) return { error: "ID inválido." };

  try {
    await db.delete(devices).where(eq(devices.id, id));
    revalidatePath("/dashboard/devices");
    return { success: true };
  } catch (error) {
    return { error: "Não foi possível remover o terminal biométrico." };
  }
}

// AÇÃO PARA ATUALIZAR UM TERMINAL
export async function updateDeviceAction(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const brand = formData.get("brand") as DeviceBrand;
  const serialNumber = formData.get("serialNumber") as string;
  const companyId = formData.get("companyId") as string;
  const siteName = formData.get("siteName") as string;

  if (!id || !name || !brand || !serialNumber || !companyId) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    await db
      .update(devices)
      .set({
        name: name.trim(),
        brand,
        serialNumber: serialNumber.trim(),
        companyId,
        siteName: siteName ? siteName.trim() : null,
      })
      .where(eq(devices.id, id));

    revalidatePath("/dashboard/devices");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "23505") {
      return { error: "Este número de série já está registado noutro terminal." };
    }
    return { error: "Ocorreu um erro ao atualizar o dispositivo." };
  }
}

export async function createDeviceAction(formData: FormData) {
  const name = formData.get("name") as string;
  const brand = formData.get("brand") as DeviceBrand;
  const serialNumber = formData.get("serialNumber") as string;
  const companyId = formData.get("companyId") as string;
  const siteName = formData.get("siteName") as string;

  if (!name || !brand || !serialNumber || !companyId) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    await db.insert(devices).values({
      name,
      brand,
      serialNumber,
      companyId,
      siteName: siteName || null,
    });

    // Atualiza a tabela no ecrã instantaneamente
    revalidatePath("/dashboard/devices");
    return { success: true };
  } catch (error: any) {
    // Caso o número de série já exista (Unique Index)
    if (error?.code === "23505") {
      return { error: "Este número de série já está registado noutro terminal." };
    }
    return { error: "Ocorreu um erro ao salvar o dispositivo." };
  }
}
