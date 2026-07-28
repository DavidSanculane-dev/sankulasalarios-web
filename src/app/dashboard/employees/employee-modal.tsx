"use client";

import React, { useState, useTransition } from "react";
import { createEmployeeAction } from "./actions";

interface EmployeeModalProps {
  companiesList: { id: string; name: string }[];
}

export default function EmployeeModal({ companiesList }: EmployeeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createEmployeeAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
      >
        Adicionar Colaborador
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Adicionar Novo Colaborador</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">{error}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Nome Completo *</label>
                <input required type="text" name="fullName" placeholder="Ex: António Manuel Silva" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Código Interno / Nº *</label>
                  <input required type="text" name="employeeCode" placeholder="Ex: ME-4890" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Estado Admissão *</label>
                  <select name="active" className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="true">Ativo (Apto)</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Empresa / Alocação Contratual *</label>
                <select required name="companyId" className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Selecione uma Empresa...</option>
                  {companiesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
                  {isPending ? "A registar..." : "Adicionar Colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
