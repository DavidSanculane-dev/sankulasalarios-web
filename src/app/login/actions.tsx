"use server";

import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Por favor, preencha todos os campos." };
  }

  const supabase = await createClient();

  // Executa a autenticação no Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Credenciais inválidas. Tente novamente." };
  }

  // Redireciona o utilizador para o painel caso tenha sucesso
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut(); // Limpa a sessão no Supabase
  redirect("/login"); // Força a volta ao login
}
