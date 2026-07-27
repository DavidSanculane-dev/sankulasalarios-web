import { db } from "@/db/client";
import { attendanceEvents, employees, devices } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function DashboardPage() {
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
    .limit(50);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Últimos Eventos de Assiduidade</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Monitorização em tempo real das últimas 50 picagens registadas nos terminais biométricos.
        </p>
      </div>

      {/* Tabela de Monitorização Moderna */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="p-4">Funcionário</th>
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Tipo de Evento</th>
                <th className="p-4">Método de Verificação</th>
                <th className="p-4">Dispositivo de Origem</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum evento de assiduidade encontrado na base de dados.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Nome do Funcionário */}
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      {e.employeeName ?? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                          Não mapeado (ID: {e.rawDeviceUserId})
                        </span>
                      )}
                    </td>
                    
                    {/* Data e Hora */}
                    <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(e.eventTime).toLocaleString("pt-PT", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>
                    
                    {/* Tipo de Evento (Badge colorida) */}
                    <td className="p-4">
                      {e.eventType === "check_in" ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                          Entrada
                        </span>
                      ) : e.eventType === "check_out" ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                          Saída
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Desconhecido
                        </span>
                      )}
                    </td>
                    
                    {/* Método de Verificação */}
                    <td className="p-4 text-slate-500 dark:text-slate-400 capitalize">
                      {e.verifyMethod ? e.verifyMethod.replace("_", " ") : "—"}
                    </td>
                    
                    {/* Dispositivo e Marca */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white font-medium">{e.deviceName}</span>
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 tracking-wider">
                          {e.deviceBrand}
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
