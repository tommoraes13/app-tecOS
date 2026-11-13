"use server";

import { revalidatePath } from "next/cache";
import { fail, num, requireUser, type ActionResult } from "@/lib/actions";
import { metodoComVisita, metodoValido } from "@/lib/documento";

export type PrecificacaoInput = {
  tipo_precificacao: string;
  valor_hora: number;
  valor_visita: number;
  duracao_visita_min: number;
  valor_km: number;
};

export async function salvarPrecificacao(input: PrecificacaoInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const metodo = metodoValido(input.tipo_precificacao);
    const { error } = await supabase
      .from("meu_negocio")
      .update({
        tipo_precificacao: metodo,
        cobrar_visita: metodoComVisita(metodo),
        valor_hora: num(input.valor_hora),
        valor_visita: num(input.valor_visita),
        duracao_visita_min: Math.max(0, Math.round(num(input.duracao_visita_min, 60))),
        valor_km: num(input.valor_km),
      })
      .eq("user_id", user.id);
    if (error) return fail(error);
    revalidatePath("/meu-negocio/precificacao");
    revalidatePath("/servicos/novo");
    revalidatePath("/orcamentos/novo");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
