import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set({ name, value, ...options })
          );
        },
      },
    }
  );

  // 1. Recupera o utilizador autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // 2. PROTEÇÃO DE LOGIN: Se tentar ir ao painel sem sessão, expulsa para o login
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. PROTEÇÃO DE NÍVEL (ROLE): Tranca rotas administrativas para gestores comuns
  if (user) {
    const userRole = user.user_metadata?.role || "gestor";

    // Lista de rotas estritamente administrativas (apenas para admin)
    const isAdminRoute = pathname.startsWith("/dashboard/companies") || pathname.startsWith("/dashboard/users");

    if (userRole !== "admin" && isAdminRoute) {
      // Se for gestor e tentar entrar, é redirecionado de volta para a home do dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  // Executa o filtro de segurança em todo o ecossistema interno
  matcher: ["/dashboard/:path*"],
};
