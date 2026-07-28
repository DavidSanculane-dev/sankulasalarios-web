import { db } from "@/db/client";
import { attendanceEvents, employees, devices, companies } from "@/db/schema";
import { desc, eq, gte, sql } from "drizzle-orm";
import WeeklyChart from "./weekly-chart";

export default async function DashboardPage() {
  // 1. Consultas para os blocos de estatísticas (Contagens Totais)
  const totalEmployees = await db.select({ count: sql<number>`count(*)` }).from(employees);
  const totalDevices = await db.select({ count: sql<number>`count(*)` }).from(devices);
  const totalCompanies = await db.select({ count: sql<number>`count(*)` }).from(companies);
  const totalEventsToday = await db.select({ count: sql<number>`count(*)` }).from(attendanceEvents);

  // 2. Query do Histórico dos últimos 7 eventos para exibição rápida na listagem inferior
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
    .orderBy(desc(attendanceEvents.eventTime))
    .limit(7);

  // 3. Montagem inteligente de dados fictícios indexados por data real para renderizar o gráfico
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const hoje = new Date();
  
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const dataAlvo = new Date();
    dataAlvo.setDate(hoje.getDate() - (6 - i));
    const labelDia = diasSemana[dataAlvo.getDay()];

    // Nota: Em produção, faremos um agrupamento por COUNT() no SQL baseado no dataAlvo.
    // Para renderizar o gráfico imediatamente, injetamos volumetria simulada baseada no índice:
    return {
      label: labelDia,
      ins: Math.floor(Math.random() * 40) + 10,
      outs: Math.floor(Math.random() * 35) + 5,
    };
  });
return (
    <div className="space-y-6">
      {/* Título de Boas-vindas */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Painel de Visão Geral</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Indicadores de desempenho acumulados do ecossistema de relógios de ponto.</p>
      </div>

      {/* Grid de Cartões Estatísticos Reais */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Colaboradores</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{totalEmployees[0]?.count || 0}</p>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Registados na base</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Terminais Monitorizados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{totalDevices[0]?.count || 0}</p>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">ZKTeco, Hikvision, Suprema</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Empresas / Filiais</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{totalCompanies[0]?.count || 0}</p>
          <span className="text-xs font-medium text-emerald-600">Entidades operacionais</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Picagens Registadas</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{totalEventsToday[0]?.count || 0}</p>
          <span className="text-xs font-medium text-emerald-600">Total histórico consolidado</span>
        </div>
      </div>

      {/* Secção do Gráfico Dinâmico */}
      <WeeklyChart data={chartData} />

      {/* Monitorização em Tempo Real (Listagem Rápida) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Atividade Recente</h3>
          <a href="/dashboard/events" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Ver Histórico Completo →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="p-4">Colaborador</th>
                <th className="p-4">Operação</th>
                <th className="p-4">Hora</th>
                <th className="p-4">Terminal</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">Nenhuma picagem capturada até ao momento.</td>
                </tr>
              ) : (
                recentEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      {e.employeeName ?? <span className="text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded text-xs">ID Biométrico: {e.rawDeviceUserId}</span>}
                    </td>
                    <td className="p-4">
                      {e.eventType === "check_in" ? (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">Entrada</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">Saída</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(e.eventTime).toLocaleTimeString("pt-PT")}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">{e.deviceName} <span className="text-xxs uppercase bg-slate-100 dark:bg-slate-800 px-1 rounded ml-1">{e.deviceBrand}</span></td>
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