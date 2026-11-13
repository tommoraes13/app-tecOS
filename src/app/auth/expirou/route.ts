import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Saída automática (opção "Sair depois de 24 horas"): encerra a sessão e volta para o login com aviso. */
export async function GET(request: NextRequest) {
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login?expirou=1", request.url));
}
