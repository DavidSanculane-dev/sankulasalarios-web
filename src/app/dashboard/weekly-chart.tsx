"use client";

import React from "react";

interface WeeklyChartProps {
  data: {
    label: string;
    ins: number;
    outs: number;
  }[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  // Encontra o valor máximo para balancear a altura das barras proporcionalmente
  const maxVal = Math.max(...data.flatMap((d) => [d.ins, d.outs]), 1);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Fluxo de Assiduidade Semanal</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Comparativo volumétrico de Entradas vs Saídas nos últimos 7 dias.</p>
      </div>

      {/* Gráfico de Barras Nativo em CSS/Tailwind */}
      <div className="h-64 flex items-end justify-between gap-2 pt-4 px-2 border-b border-slate-200 dark:border-slate-800">
        {data.map((day, idx) => {
          const inHeight = (day.ins / maxVal) * 100;
          const outHeight = (day.outs / maxVal) * 100;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
              <div className="flex items-end gap-1.5 w-full justify-center h-full pb-1">
                {/* Barra de Entradas (Check-in) */}
                <div 
                  style={{ height: `${inHeight || 4}%` }}
                  className="w-4 sm:w-6 bg-indigo-500 hover:bg-indigo-600 rounded-t-sm transition-all duration-300 relative group/bar"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow">
                    Entradas: {day.ins}
                  </div>
                </div>

                {/* Barra de Saídas (Check-out) */}
                <div 
                  style={{ height: `${outHeight || 4}%` }}
                  className="w-4 sm:w-6 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 rounded-t-sm transition-all duration-300 relative group/bar"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow">
                    Saídas: {day.outs}
                  </div>
                </div>
              </div>

              {/* Rótulo do Dia da Semana */}
              <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-2 block truncate max-w-full">
                {day.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legenda do Gráfico */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
          <span>Entradas (Check-in)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-sm"></div>
          <span>Saídas (Check-out)</span>
        </div>
      </div>
    </div>
  );
}
