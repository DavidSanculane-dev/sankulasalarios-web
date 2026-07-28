"use client";

import React, { useState, useTransition } from "react";
import { deleteEmployeeAction, updateEmployeeAction } from "./actions";

interface EmployeeActionsProps {
  employee: {
    id: string;
    fullName: string;
    employeeCode: string;
    active: boolean;
    companyId: string;
  };
  companiesList: { id: string; name: string }[];
}

export default function EmployeeActions({ employee, companiesList }: EmployeeActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (confirm(`Tem a certeza que deseja apagar o colaborador ${employee.fullName}?`)) {
      startTransition(async () => {
        const res = await deleteEmployeeAction(employee.id);
        if (res?.error) alert(res.error);
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateEmployeeAction(employee.id, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsEditOpen(false);
      }
    });
  };

  return (
    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={() => setIsEditOpen(true)}
        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors cursor-pointer"
      >
        Editar
      </button>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-rose-600 hover:text-rose-900 font-medium text-xs bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded transition-colors cursor-pointer disabled:opacity-50"
      >
        Apagar
      </button>

      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Editar Colaborador</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">{error}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Nome Completo *</label>
                <input required type="text" name="fullName" defaultValue={employee.fullName} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Código Interno *</label>
                  <input required type="text" name="employeeCode" defaultValue={employee.employeeCode} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Estado *</label>
                  <select name="active" defaultValue={employee.active ? "true" : "false"} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Empresa / Alocação *</label>
                <select required name="companyId" defaultValue={employee.companyId} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {companiesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
                  {isPending ? "A salvar..." : "Guardar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
