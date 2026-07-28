import { createClient } from "@supabase/supabase-js";
import { db } from "@/db/client";
import { companies } from "@/db/schema";
import UserModal from "./user-modal";
import UserActions from "./user-actions";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function SystemUsersPage() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  
  // Carrega as empresas existentes na BD
  const allCompanies = await db.select({ id: companies.id, name: companies.name }).from(companies);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilizadores do Sistema</h1>
          <p className="text-sm text-slate-500">Operadores autorizados a aceder à consola central e auditar os relógios.</p>
        </div>
        {/* Passamos a lista para o modal */}
        <UserModal companiesList={allCompanies} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <th className="p-4">Endereço de E-mail</th>
              <th className="p-4">Identificador Único (UID)</th>
              <th className="p-4">Escopo de Acesso</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 text-slate-700">
            {!users || users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">Nenhum utilizador encontrado.</td>
              </tr>
            ) : (
              users.map((u) => {
                const role = u.user_metadata?.role || "gestor";
                const companyId = u.user_metadata?.companyId || "global";
                const mappedCompany = allCompanies.find(c => c.id === companyId)?.name || "Acesso Global";

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{u.email}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">{u.id}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-900 capitalize">{role}</span>
                        <span className="text-xxs text-indigo-600 font-semibold">{mappedCompany}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <UserActions user={{ id: u.id, email: u.email, role }} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
