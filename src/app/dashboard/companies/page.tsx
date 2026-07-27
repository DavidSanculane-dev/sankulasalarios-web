import { db } from "@/db/client";
import { companies } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function CompaniesPage() {
  const allCompanies = await db.select().from(companies).orderBy(desc(companies.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas / Clientes</h1>
          <p className="text-sm text-slate-500">Entidades jurídicas e filiais configuradas no ecossistema.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
          Nova Empresa
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <th className="p-4">Nome da Empresa</th>
              <th className="p-4">Identificador Único (UUID)</th>
              <th className="p-4">Data de Criação</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 text-slate-700">
            {allCompanies.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">Nenhuma empresa registada.</td>
              </tr>
            ) : (
              allCompanies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="p-4 font-mono text-xs text-slate-500">{c.id}</td>
                  <td className="p-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString("pt-PT")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
