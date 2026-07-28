"use client";

import React, { useState, useTransition } from "react";
import { createMappingAction } from "./map-actions";

interface MapModalProps {
  deviceId: string;
  deviceUserId: string;
  deviceName: string;
  employeesList: { id: string; fullName: string; employeeCode: string }[];
}

export default function MapModal({ deviceId, deviceUserId, deviceName, employeesList }: MapModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createMappingAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      {/* Botão Gatilho (Substitui o texto estático antigo) */}
      <button
        onClick={() => setIsOpen(true)}
        className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer text-left w-max"
        title="Clique para associar este ID a um funcionário real"
      >
        ⚠️ Vincular ID: {deviceUserId}
      </button>

      {/* Janela Flutuante */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Mapeamento Biométrico</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">{error}</div>}

              {/* Dados Ocultos Controlados enviados ao Servidor */}
              <input type="hidden" name="deviceId" value={deviceId} />
              <input type="hidden" name="deviceUserId" value={deviceUserId} />

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 text-xs text-slate-600">
                <p><strong>Terminal de Origem:</strong> {deviceName}</p>
                <p><strong>Código Bruto do Relógio:</strong> <span className="font-mono bg-white px-1 border rounded font-bold text-slate-900">{deviceUserId}</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Selecione o Colaborador Real *</label>
                <select required name="employeeId" className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Procurar funcionário no sistema...</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xxs text-slate-400">Ao vincular, todas as picagens antigas deste ID serão atualizadas retroativamente para o nome escolhido.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
                  {isPending ? "A processar..." : "Confirmar Vínculo"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
