import { createClient } from "@supabase/supabase-js";
import UserModal from "./user-modal";
import UserActions from "./user-actions"; // Importação do novo componente

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function SystemUsersPage() {
  // Lista as contas registadas no módulo Auth do projeto
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilizadores do Sistema</h1>
          <p className="text-sm text-slate-500">Operadores autorizados a aceder à consola central e auditar os relógios.</p>
        </div>
        <UserModal />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <th className="p-4">Endereço de E-mail</th>
              <th className="p-4">Identificador de Segurança (UID)</th>
              <th className="p-4">Nível (Role)</th>
              <th className="p-4">Último Acesso</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 text-slate-700">
            {error || !users || users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">Nenhum operador de sistema listado.</td>
              </tr>
            ) : (
              users.map((u) => {
                const userRole = (u.user_metadata?.role as string) || "gestor";
                
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{u.email}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">{u.id}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                        {userRole}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("pt-PT") : "Nunca iniciou sessão"}
                    </td>
                    <td className="p-4 text-right">
                      {/* Envia os dados para o componente interativo de Editar/Apagar */}
                      <UserActions user={{ id: u.id, email: u.email, role: userRole }} />
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
