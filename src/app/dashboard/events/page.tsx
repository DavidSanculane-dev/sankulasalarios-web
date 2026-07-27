import { db } from "@/db/client";
import { attendanceEvents, employees, devices } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export default async function EventsHistoryPage() {
  // 1. Executa a query principal para listar os eventos
  const events = await db
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
    .limit(100); // Limite expandido para a página de histórico completo

  // 2. Calcula métricas simples em tempo real para os cartões superiores
  const totalIn = events.filter((e) => e.eventType === "check_in").length;
  const totalOut = events.filter((e) => e.eventType === "check_out").length;
  const unmapped = events.filter((e) => !e.employeeName).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Histórico de Eventos</h1>
          <p className="text-sm text-slate-500">Registo completo de todas as entradas, saídas e comunicações de terminais.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
          Exportar Excel (CSV)
        </button>
      </div>

      {/* Cartões de Métricas Rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Entradas Detetadas</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalIn}</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">check_in</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saídas Detetadas</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalOut}</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">check_out</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pendentes de Mapeamento</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{unmapped}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${unmapped > 0 ? "text-amber-600 bg-amber-50 animate-pulse" : "text-slate-400 bg-slate-50"}`}>
              {unmapped > 0 ? "Requer Atenção" : "Regularizado"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <th className="p-4">Colaborador / Estado</th>
                <th className="p-4">Data / Hora de Registro</th>
                <th className="p-4">Operação</th>
                <th className="p-4">Validação</th>
                <th className="p-4">Terminal Biométrico</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-200 text-slate-700">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum registo de assiduidade encontrado nesta tabela.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Colaborador */}
                    <td className="p-4">
                      {e.employeeName ? (
                        <span className="font-semibold text-slate-900">{e.employeeName}</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-amber-800 font-medium bg-amber-50/60 border border-amber-200 rounded px-2 py-0.5 text-xs w-max">
                            ID Biométrico: {e.rawDeviceUserId}
                          </span>
                          <span className="text-xxs text-slate-400 mt-0.5">Utilizador sem vínculo na tabela employees</span>
                        </div>
                      )}
                    </td>

                    {/* Data / Hora */}
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      {new Date(e.eventTime).toLocaleString("pt-PT", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>

                    {/* Tipo (Badge) */}
                    <td className="p-4">
                      {e.eventType === "check_in" ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Entrada
                        </span>
                      ) : e.eventType === "check_out" ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          Saída
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                          Desconhecido
                        </span>
                      )}
                    </td>

                    {/* Método de Verificação */}
                    <td className="p-4 text-slate-500 capitalize whitespace-nowrap">
                      {e.verifyMethod ? e.verifyMethod.replace(/_/g, " ") : "—"}
                    </td>

                    {/* Dispositivo de Origem */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{e.deviceName ?? "Desconhecido"}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-500 tracking-wider">
                          {e.deviceBrand ?? "N/A"}
                        </span>
                      </div>
                    </td>
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
