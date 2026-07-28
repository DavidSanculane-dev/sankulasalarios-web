import { db } from "@/db/client";
import { attendanceEvents, employees, devices, companies } from "@/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import MapModal from "./map-modal";
import ExportButton from "./export-button";


interface PageProps {
  searchParams: Promise<{
    companyId?: string;
    deviceId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function EventsHistoryPage({ searchParams }: PageProps) {
  // 1. Aguarda os parâmetros de pesquisa vindos do URL
  const filters = await searchParams;

  // 2. Carrega listas auxiliares para alimentar os seletores de filtro
  const activeCompanies = await db.select({ id: companies.id, name: companies.name }).from(companies);
  const activeDevices = await db.select({ id: devices.id, name: devices.name }).from(devices);
  
  const allEmployeesList = await db.select({ id: employees.id, fullName: employees.fullName, employeeCode: employees.employeeCode }).from(employees).where(eq(employees.active, true));

  // 3. Constrói as condições de filtro dinâmicas para a query do Drizzle
  const conditions = [];

  if (filters.companyId) {
    conditions.push(eq(attendanceEvents.companyId, filters.companyId));
  }
  if (filters.deviceId) {
    conditions.push(eq(attendanceEvents.deviceId, filters.deviceId));
  }
  if (filters.eventType) {
    conditions.push(eq(attendanceEvents.eventType, filters.eventType as "check_in" | "check_out" | "unknown"));
  }
  if (filters.startDate) {
    conditions.push(gte(attendanceEvents.eventTime, new Date(`${filters.startDate}T00:00:00Z`)));
  }
  if (filters.endDate) {
    conditions.push(lte(attendanceEvents.eventTime, new Date(`${filters.endDate}T23:59:59Z`)));
  }

  // 4. Executa a query principal com os filtros aplicados
  const events = await db
    .select({
      id: attendanceEvents.id,
      eventTime: attendanceEvents.eventTime,
      eventType: attendanceEvents.eventType,
      verifyMethod: attendanceEvents.verifyMethod,
      rawDeviceUserId: attendanceEvents.rawDeviceUserId,
      deviceId: attendanceEvents.deviceId, // <-- ADICIONE ESTA LINHA EXATAMENTE AQUI
      employeeName: employees.fullName,
      deviceName: devices.name,
      deviceBrand: devices.brand,
      companyName: companies.name,
    })
    .from(attendanceEvents)
    .leftJoin(employees, eq(attendanceEvents.employeeId, employees.id))
    .leftJoin(devices, eq(attendanceEvents.deviceId, devices.id))
    .leftJoin(companies, eq(attendanceEvents.companyId, companies.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(attendanceEvents.eventTime))
    .limit(100);

  // 5. Cálculos das métricas rápidas com base no resultado filtrado
  const totalIn = events.filter((e) => e.eventType === "check_in").length;
  const totalOut = events.filter((e) => e.eventType === "check_out").length;
  const unmapped = events.filter((e) => !e.employeeName).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Histórico de Eventos</h1>
          <p className="text-sm text-slate-500">Registo completo e auditoria filtrável de picagens biométricas.</p>
        </div>
        {/* Injeção do Componente Cliente Responsável pelo Download */}
        <ExportButton />
      </div>

      {/* PAINEL DE FILTROS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Empresa</label>
            <select name="companyId" defaultValue={filters.companyId || ""} className="mt-1 block w-full px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todas</option>
              {activeCompanies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Terminal</label>
            <select name="deviceId" defaultValue={filters.deviceId || ""} className="mt-1 block w-full px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos</option>
              {activeDevices.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Operação</label>
            <select name="eventType" defaultValue={filters.eventType || ""} className="mt-1 block w-full px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todas</option>
              <option value="check_in">Entrada (Check-in)</option>
              <option value="check_out">Saída (Check-out)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Data Inicial</label>
            <input type="date" name="startDate" defaultValue={filters.startDate || ""} className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer">
              Filtrar
            </button>
            <a href="/dashboard/events" className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg text-center transition-colors">
              Limpar
            </a>
          </div>
        </form>
      </div>
            {/* Cartões de Métricas Dinâmicas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Entradas Localizadas</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalIn}</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">check_in</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saídas Localizadas</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalOut}</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">check_out</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pendentes de Vínculo</p>
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
                <th className="p-4">Colaborador / Alocação</th>
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
                    Nenhum registo de assiduidade corresponde aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                      {e.employeeName ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{e.employeeName}</span>
                          <span className="text-xxs text-slate-400">{e.companyName}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {/* Substituímos o texto estático pelo Modal interativo */}
                          <MapModal 
                            deviceId={e.deviceId}
                            deviceUserId={e.rawDeviceUserId}
                            deviceName={e.deviceName ?? "Desconhecido"}
                            employeesList={allEmployeesList}
                          />
                          <span className="text-xxs text-slate-400 mt-0.5">{e.companyName || "Sem empresa"}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      {new Date(e.eventTime).toLocaleString("pt-PT", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>

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

                    <td className="p-4 text-slate-500 capitalize whitespace-nowrap">
                      {e.verifyMethod ? e.verifyMethod.replace(/_/g, " ") : "—"}
                    </td>

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
