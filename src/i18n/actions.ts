"use server";

import { cookies } from "next/headers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, normalizeLocale } from "./config";

/** Guarda o idioma no cookie (vale também antes de entrar) e, se houver login, na conta. */
export async function definirIdioma(valor: string) {
  const locale = normalizeLocale(valor);
  if (!locale) return { ok: false as const };
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  if (!hasSupabaseEnv) return { ok: true as const };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (id) await supabase.from("perfil").update({ idioma: locale }).eq("user_id", id);
  return { ok: true as const };
}
