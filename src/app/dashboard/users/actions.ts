"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Inicializa o cliente com privilégios de super-administrador
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Chave mestra secreta de backend
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// 2. AÇÃO PARA ATUALIZAR UM UTILIZADOR EXISTENTE
export async function updateSystemUserAction(id: string, formData: FormData) {
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!id) return { error: "ID de utilizador inválido." };

  try {
    const updateData: any = {
      user_metadata: { role: role || "gestor" }
    };

    // Se o administrador preencher uma nova palavra-passe, atualiza-a
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return { error: "A nova palavra-passe deve conter pelo menos 6 carateres." };
      }
      updateData.password = password;
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao atualizar o utilizador no servidor." };
  }
}

// 3. AÇÃO PARA APAGAR UM UTILIZADOR DO SISTEMA
export async function deleteSystemUserAction(id: string) {
  if (!id) return { error: "ID inválido." };

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { error: "Não foi possível remover o utilizador do sistema." };
  }
}


export async function createSystemUserAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string; // Ex: 'admin' ou 'gestor'

  if (!email || !password) {
    return { error: "E-mail e palavra-passe são campos obrigatórios." };
  }

  if (password.length < 6) {
    return { error: "A palavra-passe deve conter pelo menos 6 carateres." };
  }

  try {
    // Cria o utilizador diretamente no Supabase Auth bypassando confirmações por e-mail
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Confirma o e-mail automaticamente
      user_metadata: { role: role || "gestor", companyId: formData.get("companyId") as string }
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { error: "Erro crítico ao processar o cadastro no servidor." };
  }
}
