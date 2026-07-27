"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "../login/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Função auxiliar para aplicar as cores com base na rota ativa
  const getLinkClass = (href: string) => {
    const isActive = pathname === href;
    return isActive
      ? "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white transition-colors"
      : "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors";
  };

  // Função auxiliar para mudar a cor do ícone SVG
  const getIconClass = (href: string) => {
    return pathname === href ? "w-5 h-5 text-indigo-200" : "w-5 h-5 text-slate-500";
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR LATERAL */}
      <aside className="flex flex-col w-64 h-full bg-slate-900 border-r border-slate-800 text-slate-300 flex-shrink-0">
        
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <span className="text-lg font-bold text-white tracking-tight">
            sankula<span className="text-indigo-400">Salarios</span>
          </span>
        </div>

        {/* Links de Navegação Dinâmicos */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <p className="px-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-2">
            Monitorização
          </p>
          
          <a href="/dashboard" className={getLinkClass("/dashboard")}>
            <svg className={getIconClass("/dashboard")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 042 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Visão Geral
          </a>
          
          <a href="/dashboard/events" className={getLinkClass("/dashboard/events")}>
            <svg className={getIconClass("/dashboard/events")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Eventos de Assiduidade
          </a>

          <p className="px-2 pt-6 text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-2">
            Configuração
          </p>
          
          <a href="/dashboard/employees" className={getLinkClass("/dashboard/employees")}>
            <svg className={getIconClass("/dashboard/employees")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Colaboradores
          </a>
          
          <a href="/dashboard/devices" className={getLinkClass("/dashboard/devices")}>
            <svg className={getIconClass("/dashboard/devices")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h2m9.813 15.904L15.21 4.41a1 1 0 00-1.836 0L8.187 18.904a1 1 0 001.243 1.243l3.824-1.043a1 1 0 01.523 0l3.824 1.043a1 1 0 001.243-1.243z" />
            </svg>
            Terminais (Biométricos)
          </a>
          
          <a href="/dashboard/companies" className={getLinkClass("/dashboard/companies")}>
            <svg className={getIconClass("/dashboard/companies")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Empresas / Clientes
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-sm">
            DS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">David Sanculane</p>
            <p className="text-[10px] text-slate-400 truncate">Administrador</p>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
          {/* NAVBAR SUPERIOR */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium text-slate-800 dark:text-white">
              SankulaSalarios <span className="mx-2 text-slate-300">/</span> <span className="font-semibold">Consola Central</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status do Cron Sync */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400">Sincronizadores OK</span>
            </div>
            
            {/* Botão Sair corrigido com redirecionamento nativo */}
            <button 
            onClick={async () => {
                await logoutAction();
            }}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-sm font-medium transition-colors cursor-pointer"
            >
            Sair
            </button>
          </div>
        </header>

        {/* CONTEÚDO DINÂMICO */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
          <div className="max-w-7xl w-full mx-auto">
            {children}
          </div>

          {/* RODAPÉ */}
          <footer className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>
              SankulaSalarios desenvolvido com{" "}
              <span className="text-rose-500 animate-pulse" aria-label="coração">❤️</span> por{" "}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30 transition-colors"
              >
                David Sanculane
              </a>
            </p>
          </footer>
        </main>
      </div>

    </div>
  );
}
