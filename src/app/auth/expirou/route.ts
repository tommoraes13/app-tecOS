import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { COOKIE_USO } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";

/** Saída automática (mais de 3 dias sem usar o app): encerra a sessão e volta para o login com aviso. */
export async function GET(request: NextRequest) {
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const res = NextResponse.redirect(new URL("/login?expirou=1", request.url));
  res.cookies.delete(COOKIE_USO);
  return res;
}
