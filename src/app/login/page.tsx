"use client";

import React, { useState, useTransition, useEffect } from "react";
import { loginAction } from "./actions";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

   // Força a limpeza de qualquer sessão ativa no browser assim que o ecrã de login abre
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.signOut();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setErrorMessage(result.error);
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Lado Esquerdo: Formulário */}
      <div className="flex flex-col justify-center flex-1 px-8 py-12 sm:px-12 md:flex-none md:w-[480px] bg-white border-r border-slate-200">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full text-indigo-700 bg-indigo-50 border border-indigo-200">
              Módulo de Assiduidade
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              sankula<span className="text-indigo-600">Salarios</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Introduza as suas credenciais para aceder ao painel de controlo corporativo.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                E-mail Corporativo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nome.sobrenome@empresa.com"
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Palavra-passe
                </label>
                <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  Esqueceu-se?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-slate-600">
                Manter sessão iniciada neste dispositivo
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              {isPending ? "A autenticar..." : "Iniciar Sessão"}
            </button>
          </form>
        </div>
      </div>

      {/* Lado Direito: Painel Informativo Fixo */}
      <div className="hidden lg:flex flex-col justify-between flex-1 bg-gradient-to-br from-indigo-950 to-slate-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs tracking-wider font-semibold text-slate-300 uppercase">
            Sincronização Ativa Multi-Terminal
          </span>
        </div>

        <div className="relative max-w-xl">
          <blockquote className="text-3xl font-light leading-snug">
            "Gestão unificada e automatizada de picagens para redes de terminais <span className="font-semibold text-indigo-400">ZKTeco, Hikvision e Suprema</span> num único local."
          </blockquote>
          <div className="mt-6 flex gap-4 text-sm text-slate-400">
            <div>✓ Processamento de Salários</div>
            <div>✓ Logs em Tempo Real</div>
            <div>✓ Resiliência Serverless</div>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} sankulaSalarios. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
