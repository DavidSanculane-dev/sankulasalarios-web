import { db } from "@/db/client";
import { employees, companies } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import EmployeeModal from "./employee-modal";
import EmployeeActions from "./employee-actions";
import { createClient } from "@/lib/server";

export default async function EmployeesPage() {
  // 1. Valida a sessão do utilizador conectado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userCompanyId = user?.user_metadata?.companyId || "global";
  const isGlobalAdmin = userCompanyId === "global";

  // 2. Carrega os colaboradores com Join (Filtra se for gestor restrito)
  const allEmployees = isGlobalAdmin
    ? await db
        .select({
          id: employees.id,
          fullName: employees.fullName,
          employeeCode: employees.employeeCode,
          active: employees.active,
          companyId: employees.companyId,
          companyName: companies.name,
        })
        .from(employees)
        .leftJoin(companies, eq(employees.companyId, companies.id))
        .orderBy(desc(employees.createdAt))
    : await db
        .select({
          id: employees.id,
          fullName: employees.fullName,
          employeeCode: employees.employeeCode,
          active: employees.active,
          companyId: employees.companyId,
          companyName: companies.name,
        })
        .from(employees)
        .leftJoin(companies, eq(employees.companyId, companies.id))
        .where(eq(employees.companyId, userCompanyId))
        .orderBy(desc(employees.createdAt));

  // 3. Carrega apenas as empresas que o operador tem direito de ver para o modal
  const allCompanies = isGlobalAdmin
    ? await db.select({ id: companies.id, name: companies.name }).from(companies)
    : await db.select({ id: companies.id, name: companies.name }).from(companies).where(eq(companies.id, userCompanyId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
          <p className="text-sm text-slate-500">Base central de trabalhadores ativos e códigos de empresa.</p>
        </div>
        <EmployeeModal companiesList={allCompanies} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <th className="p-4">Nome Completo</th>
              <th className="p-4">Código de Funcionário</th>
              <th className="p-4">Empresa / Alocação</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 text-slate-700">
            {allEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Nenhum colaborador carregado no sistema para esta empresa.
                </td>
              </tr>
            ) : (
              allEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">{emp.fullName}</td>
                  <td className="p-4 font-mono text-xs text-slate-600 tracking-wide">{emp.employeeCode}</td>
                  <td className="p-4 text-slate-600">{emp.companyName ?? "—"}</td>
                  <td className="p-4">
                    {emp.active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <EmployeeActions employee={emp} companiesList={allCompanies} />
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
