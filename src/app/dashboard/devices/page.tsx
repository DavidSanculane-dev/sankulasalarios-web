import { db } from "@/db/client";
import { devices, companies } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function DevicesPage() {
  const allDevices = await db
    .select({
      id: devices.id,
      name: devices.name,
      brand: devices.brand,
      serialNumber: devices.serialNumber,
      siteName: devices.siteName,
      lastSeenAt: devices.lastSeenAt,
      companyName: companies.name,
    })
    .from(devices)
    .leftJoin(companies, eq(devices.companyId, companies.id))
    .orderBy(desc(devices.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Terminais Biométricos</h1>
          <p className="text-sm text-slate-500">Estado e ligação física dos relógios de ponto integrados.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
          Vincular Terminal
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <th className="p-4">Terminal</th>
              <th className="p-4">Número de Série</th>
              <th className="p-4">Empresa Associada</th>
              <th className="p-4">Localização (Site)</th>
              <th className="p-4">Último Sinal (Heartbeat)</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 text-slate-700">
            {allDevices.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">Nenhum terminal biométrico monitorizado.</td>
              </tr>
            ) : (
              allDevices.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{d.name}</span>
                      <span className="text-xxs font-medium uppercase text-slate-400 tracking-wider">{d.brand}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-600">{d.serialNumber}</td>
                  <td className="p-4 text-slate-600">{d.companyName ?? "—"}</td>
                  <td className="p-4 text-slate-500">{d.siteName ?? "Geral"}</td>
                  <td className="p-4">
                    {d.lastSeenAt ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {new Date(d.lastSeenAt).toLocaleString("pt-PT")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Nunca contactou
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
