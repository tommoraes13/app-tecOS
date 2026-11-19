"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, txt, type ActionResult } from "@/lib/actions";
import { onlyDigits } from "@/lib/format";

/** Primeiro acesso de quem foi convidado: guarda nome, negócio e telefone. */
export async function salvarPrimeiroAcesso(input: { nome: string; negocio: string; telefone: string }): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const nome = txt(input.nome);
    const negocio = txt(input.negocio);
    if (!nome || !negocio) return { ok: false, error: "Preencha seu nome e o nome do negócio." };
    const [p, n] = await Promise.all([
      supabase.from("perfil").update({ nome_exibicao: nome.slice(0, 120) }).eq("user_id", user.id),
      supabase
        .from("meu_negocio")
        .update({ nome_fantasia: negocio.slice(0, 120), telefone: onlyDigits(input.telefone).slice(0, 30) || null })
        .eq("user_id", user.id),
    ]);
    if (p.error) return fail(p.error);
    if (n.error) return fail(n.error);
    revalidatePath("/", "layout");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
