"use server";

import { revalidatePath } from "next/cache";
import { fail, num, numOrNull, requireUser, txt, type ActionResult } from "@/lib/actions";
import type { Enums } from "@/lib/database.types";

export type ServicoInput = {
  id?: string;
  nome: string;
  codigo: string;
  categoria: Enums<"servico_categoria"> | "";
  tamanho_backup: string;
  localizacao_pastas: string;
  valor: number;
  tempo_medio_min: number | null;
};

export async function salvarServico(input: ServicoInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireUser();
    if (!txt(input.nome)) return { ok: false, error: "Informe o nome do serviço." };
    const isBackup = input.categoria === "backup_recuperacao";
    const row = {
      nome: input.nome.trim(),
      codigo: txt(input.codigo),
      categoria: input.categoria || null,
      tamanho_backup: isBackup ? txt(input.tamanho_backup) : null,
      localizacao_pastas: isBackup ? txt(input.localizacao_pastas) : null,
      valor: num(input.valor),
      tempo_medio_min: numOrNull(input.tempo_medio_min),
    };
    const query = input.id
      ? supabase.from("cadastro_servicos").update(row).eq("id", input.id).select("id").single()
      : supabase.from("cadastro_servicos").insert(row).select("id").single();
    const { data, error } = await query;
    if (error || !data) return fail(error);
    revalidatePath("/cadastros", "layout");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function excluirServicos(ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("cadastro_servicos").delete().in("id", ids);
    if (error) return fail(error, "Não foi possível excluir agora.");
    revalidatePath("/cadastros", "layout");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export type ProdutoInput = {
  id?: string;
  nome: string;
  codigo: string;
  valor_custo: number | null;
  valor_venda: number;
};

export async function salvarProduto(input: ProdutoInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireUser();
    if (!txt(input.nome)) return { ok: false, error: "Informe o nome do produto." };
    const row = {
      nome: input.nome.trim(),
      codigo: txt(input.codigo),
      valor_custo: numOrNull(input.valor_custo),
      valor_venda: num(input.valor_venda),
    };
    const query = input.id
      ? supabase.from("cadastro_produtos").update(row).eq("id", input.id).select("id").single()
      : supabase.from("cadastro_produtos").insert(row).select("id").single();
    const { data, error } = await query;
    if (error || !data) return fail(error);
    revalidatePath("/cadastros", "layout");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function excluirProdutos(ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("cadastro_produtos").delete().in("id", ids);
    if (error) return fail(error, "Não foi possível excluir agora.");
    revalidatePath("/cadastros", "layout");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
