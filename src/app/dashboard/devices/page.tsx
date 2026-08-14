import { db } from "@/db/client";
import { devices, companies } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import DeviceModal from "./device-modal";
import DeviceActions from "./device-actions";
import { createClient } from "@/lib/server"; 
import { redirect } from "next/navigation";
import Link from "next/link"; // Importação para o botão de ajuda

export default async function DevicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userRole = user.user_metadata?.role as "admin" | "gestor" | undefined;
  const currentUserCompanyId = user.user_metadata?.companyId as string | undefined;

  if (!userRole) {
    return <div className="p-6 text-red-500">Erro: Nível de acesso (Role) não configurado para este utilizador.</div>;
  }

  if (userRole === "gestor" && (!currentUserCompanyId || currentUserCompanyId.trim() === "")) {
    return <div className="p-6 text-red-500">Erro: O seu utilizador está como Gestor mas não tem nenhuma empresa vinculada no Supabase.</div>;
  }

  const isSuperAdmin = userRole === "admin";
  const isCompanyIdValid = currentUserCompanyId && currentUserCompanyId.trim() !== "";

  const deviceFilter = isSuperAdmin 
    ? undefined 
    : isCompanyIdValid 
      ? eq(devices.companyId, currentUserCompanyId)
      : eq(devices.id, "00000000-0000-0000-0000-000000000000"); 

  const companyFilter = isSuperAdmin 
    ? undefined 
    : isCompanyIdValid 
      ? eq(companies.id, currentUserCompanyId)
      : eq(companies.id, "00000000-0000-0000-0000-000000000000");

  const allDevices = await db
    .select({
      id: devices.id,
      name: devices.name,
      brand: devices.brand,
      serialNumber: devices.serialNumber,
      siteName: devices.siteName,
      lastSeenAt: devices.lastSeenAt,
      companyId: devices.companyId,
      companyName: companies.name,
    })
    .from(devices)
    .leftJoin(companies, eq(devices.companyId, companies.id))
    .where(deviceFilter)
    .orderBy(desc(devices.createdAt))
    .catch((err) => {
      console.error("Erro na query de devices:", err);
      return [];
    });

  const allCompanies = await db
    .select({ 
      id: companies.id, 
      name: companies.name 
    })
    .from(companies)
    .where(companyFilter)
    .catch((err) => {
      console.error("Erro na query de companies:", err);
      return [];
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Terminais Biométricos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isSuperAdmin 
              ? "Painel Global: Monitorização de todos os relógios de ponto do ecossistema." 
              : "Estado e ligação física dos relógios de ponto integrados na sua empresa."
            }
          </p>
        </div>
        
        {/* Bloco de Botões Alinhado */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Link
            href="/dashboard/help/devices"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Como Conectar?
          </Link>

          <DeviceModal companiesList={allCompanies} />
        </div>
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
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 text-slate-700">
            {allDevices.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Nenhum terminal biométrico monitorizado para os filtros atuais.
                </td>
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
                  <td className="p-4 text-right">
                    <DeviceActions device={d} companiesList={allCompanies} />
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

