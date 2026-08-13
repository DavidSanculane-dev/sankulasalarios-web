import { db } from "@/db/client";
import { devices, companies } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import DeviceModal from "./device-modal";
import DeviceActions from "./device-actions";
import { createClient } from "@/lib/server"; // Ajuste o caminho conforme o seu projeto do Supabase SSR
import { redirect } from "next/navigation";

export default async function DevicesPage() {
  // 1. Inicializar o cliente do Supabase para ambiente de servidor
  const supabase = await createClient();

  // 2. Recuperar o utilizador autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se não estiver autenticado, redireciona para o login
  if (!user) {
    redirect("/login");
  }

  // 3. Extrair a Role e o CompanyId dos metadados do utilizador (user_metadata no Supabase)
  const userRole = user.user_metadata?.role as "Administrador" | "Gestor RH" | undefined;
  const currentUserCompanyId = user.user_metadata?.companyId as string | undefined;

  // Segurança básica: impede o acesso se as propriedades críticas não existirem
  if (!userRole) {
    return <div className="p-6 text-red-500">Erro: Nível de acesso (Role) não configurado para este utilizador.</div>;
  }

  if (userRole === "Gestor RH" && !currentUserCompanyId) {
    return <div className="p-6 text-red-500">Erro: O seu utilizador não está vinculado a nenhuma empresa.</div>;
  }

  // 4. Definir Dinamicamente as Condições de Filtro com base na Role
  // Se for Administrador, o filtro é indefinido (traz tudo). Se for Gestor RH, isola pelo companyId.
  const isSuperAdmin = userRole === "Administrador";
  
  const deviceFilter = isSuperAdmin 
    ? undefined 
    : eq(devices.companyId, currentUserCompanyId!);

  const companyFilter = isSuperAdmin 
    ? undefined 
    : eq(companies.id, currentUserCompanyId!);

  // 5. Executar as Queries na Base de Dados com os Filtros Aplicados
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
    .orderBy(desc(devices.createdAt));

  const allCompanies = await db
    .select({ 
      id: companies.id, 
      name: companies.name 
    })
    .from(companies)
    .where(companyFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Terminais Biométricos</h1>
          <p className="text-sm text-slate-500">
            {isSuperAdmin 
              ? "Painel Global: Monitorização de todos os relógios de ponto do ecossistema." 
              : "Estado e ligação física dos relógios de ponto integrados na sua empresa."
            }
          </p>
        </div>
        <DeviceModal companiesList={allCompanies} />
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
