"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, txt, type ActionResult } from "@/lib/actions";
import { totais, type DocForm } from "@/lib/documento";

export async function salvarOrcamento(f: DocForm): Promise<ActionResult<{ id: string; numero: number }>> {
  try {
    if (!Number.isInteger(f.numero) || f.numero < 1 || f.numero > 99999)
      return { ok: false, error: "O número precisa ficar entre 1 e 99999." };
    if (!f.cliente_id) return { ok: false, error: "Escolha o cliente do orçamento." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.data)) return { ok: false, error: "Informe a data do orçamento." };
    const servicos = f.servicos_ativos ? f.servicos : [];
    const produtos = f.produtos_ativos ? f.produtos : [];
    if ([...servicos, ...produtos].some((i) => !i.descricao.trim()))
      return { ok: false, error: "Todo serviço e produto precisa de uma descrição." };

    const { supabase } = await requireUser();
    const t = totais(f);
    const header = {
      numero: f.numero,
      cliente_id: f.cliente_id,
      relato: txt(f.relato),
      data: f.data,
      cobrar_visita: f.cobrar_visita,
      valor_visita: f.valor_visita,
      despesas_ativas: f.despesas_ativas,
      despesa_deslocamento: f.despesa_deslocamento,
      despesa_alimentacao: f.despesa_alimentacao,
      despesa_insumos: f.despesa_insumos,
      despesa_outros: f.despesa_outros,
      valor_total: t.total,
      valor_total_manual: f.valor_total_manual,
      observacoes: txt(f.observacoes),
    };

    const { data: orc, error } = f.id
      ? await supabase.from("base_orcamentos").update(header).eq("id", f.id).select("id, numero").single()
      : await supabase.from("base_orcamentos").insert(header).select("id, numero").single();
    if (error || !orc) return fail(error);

    const limpar = await Promise.all([
      supabase.from("orc_servicos").delete().eq("orcamento_id", orc.id),
      supabase.from("orc_produtos").delete().eq("orcamento_id", orc.id),
    ]);
    const erroLimpar = limpar.find((r) => r.error)?.error;
    if (erroLimpar) return fail(erroLimpar, "O orçamento foi salvo, mas os itens não. Tente salvar de novo.");

    const inserts = await Promise.all([
      servicos.length
        ? supabase.from("orc_servicos").insert(
            servicos.map((i, ordem) => ({
              orcamento_id: orc.id,
              servico_id: i.catalogId,
              descricao: i.descricao.trim(),
              quantidade: i.quantidade,
              valor_unitario: i.valor_unitario,
              equipamento_id: i.equipamento_id,
              ordem,
            })),
          )
        : Promise.resolve({ error: null }),
      produtos.length
        ? supabase.from("orc_produtos").insert(
            produtos.map((i, ordem) => ({
              orcamento_id: orc.id,
              produto_id: i.catalogId,
              descricao: i.descricao.trim(),
              quantidade: i.quantidade,
              valor_unitario: i.valor_unitario,
              equipamento_id: i.equipamento_id,
              ordem,
            })),
          )
        : Promise.resolve({ error: null }),
    ]);
    const erroItens = inserts.find((r) => r.error)?.error;
    if (erroItens) return fail(erroItens, "O orçamento foi salvo, mas algum item não. Confira e salve de novo.");

    revalidatePath("/orcamentos");
    revalidatePath("/clientes");
    return { ok: true, data: { id: orc.id, numero: orc.numero } };
  } catch (e) {
    return fail(e);
  }
}

/** Salva o orçamento e cria a OS com os dados dele (uma vez por orçamento). */
export async function transformarEmAtendimento(f: DocForm): Promise<ActionResult<{ osId: string }>> {
  const salvo = await salvarOrcamento(f);
  if (!salvo.ok) return salvo;
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("transformar_orcamento_em_os", { p_orcamento_id: salvo.data.id });
    if (error || !data) return fail(error, "Não foi possível criar o atendimento agora.");
    revalidatePath("/orcamentos");
    revalidatePath("/servicos");
    revalidatePath("/dashboard");
    return { ok: true, data: { osId: data } };
  } catch (e) {
    return fail(e);
  }
}

export async function excluirOrcamentos(ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("base_orcamentos").delete().in("id", ids);
    if (error) return fail(error, "Não foi possível excluir agora.");
    revalidatePath("/orcamentos");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
