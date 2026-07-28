"use server";

import { db } from "@/db/client";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// 1. AÇÃO PARA ADICIONAR UM NOVO COLABORADOR
export async function createEmployeeAction(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const employeeCode = formData.get("employeeCode") as string;
  const companyId = formData.get("companyId") as string;
  const activeInput = formData.get("active") as string;

  if (!fullName || !employeeCode || !companyId) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    await db.insert(employees).values({
      fullName: fullName.trim(),
      employeeCode: employeeCode.trim(),
      companyId: companyId,
      active: activeInput === "true",
    });

    // Atualiza os dados no ecrã instantaneamente
    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error: any) {
    // Restrição única baseada no index único de company_id + employee_code
    if (error?.code === "23505") {
      return { error: "Este código de funcionário já existe nesta empresa." };
    }
    return { error: "Ocorreu um erro ao guardar o colaborador." };
  }
}

// 2. AÇÃO PARA ATUALIZAR/EDITAR UM COLABORADOR EXISTENTE
export async function updateEmployeeAction(id: string, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const employeeCode = formData.get("employeeCode") as string;
  const companyId = formData.get("companyId") as string;
  const activeInput = formData.get("active") as string;

  if (!id || !fullName || !employeeCode || !companyId) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    await db
      .update(employees)
      .set({
        fullName: fullName.trim(),
        employeeCode: employeeCode.trim(),
        companyId: companyId,
        active: activeInput === "true",
      })
      .where(eq(employees.id, id));

    // Atualiza os dados no ecrã instantaneamente
    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "23505") {
      return { error: "Este código de funcionário já existe nesta empresa." };
    }
    return { error: "Ocorreu um erro ao atualizar o colaborador." };
  }
}

// 3. AÇÃO PARA APAGAR UM COLABORADOR
export async function deleteEmployeeAction(id: string) {
  if (!id) {
    return { error: "ID inválido do colaborador." };
  }

  try {
    await db.delete(employees).where(eq(employees.id, id));

    // Atualiza os dados no ecrã instantaneamente
    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error) {
    return { error: "Não foi possível apagar o colaborador da base de dados." };
  }
}
