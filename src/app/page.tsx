"use client";

import React from "react";

export default function LandingPage() {
  // Função que força o browser a abrir a página de login instantaneamente
  const handleNavigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* 1. BARRA DE NAVEGAÇÃO SUPERIOR */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              sankula<span className="text-indigo-600">Salarios</span>
            </span>
          </div>
          
          <div>
            <button 
              onClick={handleNavigateToLogin}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer border-none"
            >
              Entrar no Sistema
            </button>
          </div>
        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL (HERO SECTION) */}
      <main className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="max-w-3xl w-full text-center space-y-8">
          
          {/* Badge Informativa */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mx-auto">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Plataforma Corporativa Centralizada
          </div>

          {/* Título Principal */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Gestão Unificada de Assiduidade <br />
              <span className="text-indigo-600">Multi-Terminal</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Sincronização robusta em tempo real e monitorização centralizada para redes de relógios de ponto das marcas 
              <span className="font-semibold text-slate-800"> ZKTeco, Hikvision e Suprema</span>.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleNavigateToLogin}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all cursor-pointer border-none"
            >
              Começar Agora
            </button>
            <a 
              href="#caracteristicas" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:border-slate-400 rounded-xl transition-all"
            >
              Saber Mais
            </a>
          </div>

          {/* Mini Vitrine de Compatibilidade */}
          <div className="pt-8 border-t border-slate-200/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Hardware Compatible</p>
            <div className="flex items-center justify-center gap-8 text-sm font-bold text-slate-400 tracking-wider">
              <span className="hover:text-slate-600 transition-colors uppercase">ZKTeco</span>
              <span className="hover:text-slate-600 transition-colors uppercase">Hikvision</span>
              <span className="hover:text-slate-600 transition-colors uppercase">Suprema</span>
            </div>
          </div>

        </div>
      </main>

      {/* 3. RODAPÉ */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} sankulaSalarios. Todos os direitos reservados.</p>
          <p>
            Desenvolvido com <span className="text-rose-500">❤️</span> por{" "}
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-medium text-indigo-600 hover:underline"
            >
              David Sanculane
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
}
