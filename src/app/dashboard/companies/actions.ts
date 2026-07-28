"use server";

import { db } from "@/db/client";
import { companies } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// AÇÃO PARA APAGAR UMA EMPRESA
export async function deleteCompanyAction(id: string) {
  if (!id) return { error: "ID inválido." };

  try {
    await db.delete(companies).where(eq(companies.id, id));
    revalidatePath("/dashboard/companies");
    return { success: true };
  } catch (error: any) {
    // Se a empresa tiver colaboradores ou terminais vinculados, o Postgres bloqueia a remoção por FK
    if (error?.code === "23503") {
      return { error: "Não pode apagar esta empresa porque existem colaboradores ou terminais vinculados a ela." };
    }
    return { error: "Não foi possível remover a empresa da base de dados." };
  }
}

// AÇÃO PARA EDITAR UMA EMPRESA
export async function updateCompanyAction(id: string, formData: FormData) {
  const name = formData.get("name") as string;

  if (!id || !name || name.trim() === "") {
    return { error: "O nome da empresa é obrigatório." };
  }

  try {
    await db
      .update(companies)
      .set({
        name: name.trim(),
      })
      .where(eq(companies.id, id));

    revalidatePath("/dashboard/companies");
    return { success: true };
  } catch (error) {
    return { error: "Ocorreu um erro ao atualizar os dados da empresa." };
  }
}

export async function createCompanyAction(formData: FormData) {
  const name = formData.get("name") as string;

  if (!name || name.trim() === "") {
    return { error: "O nome da empresa é obrigatório." };
  }

  try {
    await db.insert(companies).values({
      name: name.trim(),
    });

    revalidatePath("/dashboard/companies");
    return { success: true };
  } catch (error) {
    return { error: "Ocorreu um erro ao registar a empresa." };
  }
}
