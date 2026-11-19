import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv, supabaseKey, supabaseUrl } from "./env";

const PUBLIC_PATHS = ["/login", "/auth"];

/** Saída automática: quem fica mais de 3 dias sem abrir o app precisa entrar de novo. */
export const COOKIE_USO = "tecdesk_uso";
const LIMITE_SEM_USO_MS = 3 * 24 * 60 * 60 * 1000;

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Renova a sessão a cada requisição e protege as telas do app. */
export async function updateSession(request: NextRequest) {
  // Sem Supabase configurado, deixa navegar para ver o layout.
  if (!hasSupabaseEnv) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims confere o login localmente (chave pública do projeto), sem ir ao servidor de autenticação a cada clique.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? data.claims : null;

  const { pathname } = request.nextUrl;

  if (!user) {
    if (isPublic(pathname)) {
      // Sem login: zera a marca de uso, para o próximo login começar a contar do zero.
      if (request.cookies.has(COOKIE_USO)) response.cookies.delete(COOKIE_USO);
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Logado: mais de 3 dias desde o último uso encerra a sessão.
  if (!pathname.startsWith("/auth/")) {
    const ultimo = Number(request.cookies.get(COOKIE_USO)?.value);
    if (Number.isFinite(ultimo) && ultimo > 0 && Date.now() - ultimo > LIMITE_SEM_USO_MS) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/expirou";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  response.cookies.set(COOKIE_USO, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return response;
}
