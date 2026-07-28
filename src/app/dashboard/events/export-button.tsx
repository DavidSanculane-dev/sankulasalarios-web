"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

export default function ExportButton() {
  const searchParams = useSearchParams();

  const handleExport = () => {
    // Converte os filtros atuais do ecrã numa string de parâmetros de URL
    const queryString = searchParams.toString();
    
    // Dispara o download direcionado para a nossa rota de API
    window.location.href = `/api/events/export?${queryString}`;
  };

  return (
    <button
      onClick={handleExport}
      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <br /><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5l4 4v13a2 2 0 01-2 2z" />
      </svg>
      Exportar Excel (CSV)
    </button>
  );
}
