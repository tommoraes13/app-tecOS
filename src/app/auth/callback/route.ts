import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, normalizeLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

/** Destino do link de confirmação de e-mail: troca o código pela sessão. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(`${origin}${next}`);
      // Conta criada com outro idioma escolhido na tela de login: guarda na conta.
      const idioma = normalizeLocale(searchParams.get("idioma"));
      if (idioma && data.user) {
        await supabase.from("perfil").update({ idioma }).eq("user_id", data.user.id);
        res.cookies.set(LOCALE_COOKIE, idioma, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
      }
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
