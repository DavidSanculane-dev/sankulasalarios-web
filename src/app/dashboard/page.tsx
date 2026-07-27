import { db } from "@/db/client";
import { attendanceEvents, employees, devices } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// Página server-side simples - lista os últimos 50 eventos de assiduidade,
// com o nome do funcionário (quando já mapeado) e o dispositivo de origem.
// Serve como ponto de partida; substitui por filtros por empresa, datas,
// exportação para folha de pagamento, etc. conforme formos avançando.
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
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-xl font-medium mb-6">sankulaSalarios — últimos eventos</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-gray-300">
            <th className="py-2 pr-4">Funcionário</th>
            <th className="py-2 pr-4">Data/hora</th>
            <th className="py-2 pr-4">Tipo</th>
            <th className="py-2 pr-4">Verificação</th>
            <th className="py-2 pr-4">Dispositivo</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-gray-100">
              <td className="py-2 pr-4">
                {e.employeeName ?? (
                  <span className="text-amber-700">
                    Não mapeado (ID {e.rawDeviceUserId})
                  </span>
                )}
              </td>
              <td className="py-2 pr-4">{new Date(e.eventTime).toLocaleString("pt-PT")}</td>
              <td className="py-2 pr-4">{e.eventType}</td>
              <td className="py-2 pr-4">{e.verifyMethod}</td>
              <td className="py-2 pr-4">
                {e.deviceName} ({e.deviceBrand})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
