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

  // Verifica se existe uma sessão ativa
  const { data: { user } } = await supabase.auth.getUser();

  // PROTEÇÃO: Se tentar aceder ao dashboard sem estar autenticado, vai para o login
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // RESTRICÇÃO REMOVIDA: Retirámos o redirecionamento automático do login para o dashboard.
  // Agora, mesmo que o utilizador já tenha sessão no Supabase, a rota /login será carregada normalmente.

  return response;
}

export const config = {
  // Executa o middleware apenas nas rotas do dashboard
  matcher: ["/dashboard/:path*"],
};
