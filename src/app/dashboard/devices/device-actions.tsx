"use client";

import React, { useState, useTransition } from "react";
import { deleteDeviceAction, updateDeviceAction, DeviceBrand } from "./actions";

interface DeviceActionsProps {
  device: {
    id: string;
    name: string;
    brand: DeviceBrand;
    serialNumber: string;
    siteName: string | null;
    companyId: string;
  };
  companiesList: { id: string; name: string }[];
}

export default function DeviceActions({ device, companiesList }: DeviceActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (confirm(`Deseja mesmo remover o terminal ${device.name}?`)) {
      startTransition(async () => {
        const res = await deleteDeviceAction(device.id);
        if (res?.error) alert(res.error);
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateDeviceAction(device.id, formData);
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

      {/* MODAL DE EDIÇÃO */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Editar Terminal</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">{error}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Nome do Terminal *</label>
                <input required type="text" name="name" defaultValue={device.name} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Marca *</label>
                  <select name="brand" defaultValue={device.brand} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="zkteco">ZKTeco</option>
                    <option value="hikvision">Hikvision</option>
                    <option value="suprema">Suprema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Nº Série *</label>
                  <input required type="text" name="serialNumber" defaultValue={device.serialNumber} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Empresa Proprietária *</label>
                <select required name="companyId" defaultValue={device.companyId} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {companiesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Localização / Estaleiro</label>
                <input type="text" name="siteName" defaultValue={device.siteName || ""} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
