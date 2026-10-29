"use server";

import { revalidatePath } from "next/cache";
import { fail, num, numOrNull, requireUser, txt, type ActionResult } from "@/lib/actions";

export type PrecificacaoInput = {
  tipo_precificacao: string;
  valor_visita: number;
  duracao_visita_min: number;
  cobrar_visita: boolean;
  valor_km: number;
};

export async function salvarPrecificacao(input: PrecificacaoInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("meu_negocio")
      .update({
        tipo_precificacao: txt(input.tipo_precificacao),
        valor_visita: num(input.valor_visita),
        duracao_visita_min: Math.max(0, Math.round(num(input.duracao_visita_min, 60))),
        cobrar_visita: Boolean(input.cobrar_visita),
        valor_km: num(input.valor_km),
      })
      .eq("user_id", user.id);
    if (error) return fail(error);
    revalidatePath("/precificacao");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
