"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeCurrency, normalizeLocale, validTimeZone } from "@/i18n/config";
import { fail, requireUser, txt, type ActionResult } from "@/lib/actions";

export type PerfilInput = { nome_exibicao: string; idioma: string; moeda: string; fuso: string };

export async function salvarPerfil(input: PerfilInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const idioma = normalizeLocale(input.idioma) ?? "pt-BR";
    const { error } = await supabase
      .from("perfil")
      .update({
        nome_exibicao: txt(input.nome_exibicao),
        idioma,
        moeda: normalizeCurrency(input.moeda),
        fuso: validTimeZone(input.fuso),
      })
      .eq("user_id", user.id);
    if (error) return fail(error);
    (await cookies()).set(LOCALE_COOKIE, idioma, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    revalidatePath("/", "layout");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

/** Grava o caminho da foto enviada (o envio do arquivo é feito pelo navegador direto na pasta do usuário). */
export async function salvarFoto(path: string | null): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    // Só aceita o arquivo da própria pasta, com o nome que o app gera.
    if (path && !new RegExp(`^${user.id}/foto-\\d+\\.(jpg|webp)$`).test(path)) return { ok: false, error: "Arquivo inválido." };
    const { data: atual } = await supabase.from("perfil").select("foto_path").eq("user_id", user.id).maybeSingle();
    const { error } = await supabase.from("perfil").update({ foto_path: path }).eq("user_id", user.id);
    if (error) return fail(error);
    if (atual?.foto_path && atual.foto_path !== path) {
      await supabase.storage.from("avatars").remove([atual.foto_path]);
    }
    revalidatePath("/", "layout");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
