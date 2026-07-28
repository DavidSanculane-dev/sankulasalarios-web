import { db } from "@/db/client";
import { attendanceEvents, employees, devices, companies } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import WeeklyChart from "./weekly-chart";
import { createClient } from "@/lib/server";

export default async function DashboardPage() {
  // 1. Valida a identidade e escopo do operador conectado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userCompanyId = user?.user_metadata?.companyId || "global";
  const isGlobalAdmin = userCompanyId === "global";

  // 2. Contagens matemáticas customizadas por escopo (Multi-tenant)
  const employeeCountQuery = isGlobalAdmin 
    ? db.select({ count: sql<number>`count(*)` }).from(employees)
    : db.select({ count: sql<number>`count(*)` }).from(employees).where(eq(employees.companyId, userCompanyId));
    
  const deviceCountQuery = isGlobalAdmin
    ? db.select({ count: sql<number>`count(*)` }).from(devices)
    : db.select({ count: sql<number>`count(*)` }).from(devices).where(eq(devices.companyId, userCompanyId));

  const companyCountQuery = isGlobalAdmin
    ? db.select({ count: sql<number>`count(*)` }).from(companies)
    : db.select({ count: sql<number>`count(*)` }).from(companies).where(eq(companies.id, userCompanyId));

  const eventsCountQuery = isGlobalAdmin
    ? db.select({ count: sql<number>`count(*)` }).from(attendanceEvents)
    : db.select({ count: sql<number>`count(*)` }).from(attendanceEvents).where(eq(attendanceEvents.companyId, userCompanyId));

  const [totalEmployees, totalDevices, totalCompanies, totalEventsToday] = await Promise.all([
    employeeCountQuery.then(res => res[0]),
    deviceCountQuery.then(res => res[0]),
    companyCountQuery.then(res => res[0]),
    eventsCountQuery.then(res => res[0])
  ]);

  // 3. Query da Atividade Recente trancada por empresa
  const recentEvents = await db
    .select({
      id: attendanceEvents.id,
      eventTime: attendanceEvents.eventTime,
      eventType: attendanceEvents.eventType,
      verifyMethod: attendanceEvents.verifyMethod,
      rawDeviceUserId: attendanceEvents.rawDeviceUserId,
      employeeName: employees.fullName,
      deviceName: devices.name,
      deviceBrand: devices.brand,
    })
    .from(attendanceEvents)
    .leftJoin(employees, eq(attendanceEvents.employeeId, employees.id))
    .leftJoin(devices, eq(attendanceEvents.deviceId, devices.id))
    .where(isGlobalAdmin ? undefined : eq(attendanceEvents.companyId, userCompanyId))
    .orderBy(desc(attendanceEvents.eventTime))
    .limit(7);

  // 4. Geração de volumetria simulada adaptável baseada na data atual para o gráfico
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const hoje = new Date();
  
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const dataAlvo = new Date();
    dataAlvo.setDate(hoje.getDate() - (6 - i));
    return {
      label: diasSemana[dataAlvo.getDay()],
      ins: Math.floor(Math.random() * (isGlobalAdmin ? 80 : 25)) + 5,
      outs: Math.floor(Math.random() * (isGlobalAdmin ? 75 : 20)) + 3,
    };
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Painel de Visão Geral</h1>
        <p className="text-sm text-slate-500">
          {isGlobalAdmin 
            ? "Indicadores globais de desempenho acumulados de todas as empresas do ecossistema."
            : "Indicadores operacionais em tempo real e monitorização de acessos da sua empresa."}
        </p>
      </div>

      {/* Grid de Cartões Estatísticos Isolados */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Colaboradores</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalEmployees?.count || 0}</p>
          <span className="text-xs font-medium text-indigo-600">Alocados no seu escopo</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Terminais Vinculados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalDevices?.count || 0}</p>
          <span className="text-xs font-medium text-indigo-600">Relógios biométricos ativos</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Empresas Acessíveis</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalCompanies?.count || 0}</p>
          <span className="text-xs font-medium text-emerald-600">Entidades sob sua gestão</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Picagens Consolidadas</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalEventsToday?.count || 0}</p>
          <span className="text-xs font-medium text-emerald-600">Total de registos históricos</span>
        </div>
      </div>

      {/* Gráfico Dinâmico */}
      <WeeklyChart data={chartData} />

      {/* Atividade Recente */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Atividade Recente</h3>
          <a href="/dashboard/events" className="text-xs font-medium text-indigo-600 hover:underline">Ver Histórico Completo →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <th className="p-4">Colaborador</th>
                <th className="p-4">Operação</th>
                <th className="p-4">Hora da Picagem</th>
                <th className="p-4">Terminal</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-200 text-slate-700">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">Nenhuma atividade registada para a sua organização.</td>
                </tr>
              ) : (
                recentEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 font-medium text-slate-900">
                      {e.employeeName ?? <span className="text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-xs">ID Biométrico: {e.rawDeviceUserId}</span>}
                    </td>
                    <td className="p-4">
                      {e.eventType === "check_in" ? (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Entrada</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Saída</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">{new Date(e.eventTime).toLocaleTimeString("pt-PT")}</td>
                    <td className="p-4 text-slate-500 font-medium">{e.deviceName} <span className="text-[10px] uppercase bg-slate-100 px-1 rounded ml-1">{e.deviceBrand}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
