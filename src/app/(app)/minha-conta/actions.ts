"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, txt, type ActionResult } from "@/lib/actions";

export type PerfilInput = { nome_exibicao: string; moeda: string; fuso: string };

export async function salvarPerfil(input: PerfilInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const moeda = ["BRL", "USD", "EUR"].includes(input.moeda) ? input.moeda : "BRL";
    let fuso = "America/Sao_Paulo";
    try {
      new Intl.DateTimeFormat("pt-BR", { timeZone: input.fuso });
      fuso = input.fuso;
    } catch {
      // fuso inválido: mantém o padrão
    }
    const { error } = await supabase
      .from("perfil")
      .update({ nome_exibicao: txt(input.nome_exibicao), moeda, fuso })
      .eq("user_id", user.id);
    if (error) return fail(error);
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
    if (path && !path.startsWith(`${user.id}/`)) return { ok: false, error: "Arquivo inválido." };
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
