"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, txt, type ActionResult } from "@/lib/actions";
import type { Enums } from "@/lib/database.types";
import { totais, type DocForm } from "@/lib/documento";

function validar(f: DocForm): string | null {
  if (!Number.isInteger(f.numero) || f.numero < 1 || f.numero > 99999) return "O número precisa ficar entre 1 e 99999.";
  if (!f.cliente_id) return "Escolha o cliente do atendimento.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.data)) return "Informe a data de início.";
  if (f.visitas.some((v) => !/^\d{4}-\d{2}-\d{2}$/.test(v.data))) return "Informe a data de cada visita técnica.";
  const itens = [...(f.servicos_ativos ? f.servicos : []), ...(f.produtos_ativos ? f.produtos : [])];
  if (itens.some((i) => !i.descricao.trim())) return "Todo serviço e produto precisa de uma descrição.";
  return null;
}

export async function salvarAtendimento(f: DocForm): Promise<ActionResult<{ id: string; numero: number }>> {
  try {
    const erro = validar(f);
    if (erro) return { ok: false, error: erro };
    const { supabase } = await requireUser();
    const t = totais(f);

    const header = {
      numero: f.numero,
      cliente_id: f.cliente_id,
      relato: txt(f.relato),
      data_inicio: f.data,
      status: f.status,
      distancia_km: f.distancia_km,
      cobrar_visita: f.cobrar_visita,
      valor_visita: f.valor_visita,
      despesas_ativas: f.despesas_ativas,
      despesa_deslocamento: f.despesa_deslocamento,
      despesa_alimentacao: f.despesa_alimentacao,
      despesa_insumos: f.despesa_insumos,
      despesa_outros: f.despesa_outros,
      valor_total: t.total,
      valor_total_manual: f.valor_total_manual,
      data_entrega: f.data_entrega || null,
      recebido: f.recebido,
      data_recebimento: f.recebido ? f.data_recebimento || null : null,
      valor_recebido: f.recebido ? (f.valor_recebido ?? t.total) : null,
      observacoes: txt(f.observacoes),
    };

    const { data: os, error } = f.id
      ? await supabase.from("base_atendimentos").update(header).eq("id", f.id).select("id, numero").single()
      : await supabase.from("base_atendimentos").insert(header).select("id, numero").single();
    if (error || !os) return fail(error);
    const osId = os.id;

    // Itens: substitui todos pelos do formulário.
    const limpar = await Promise.all([
      supabase.from("os_visitas").delete().eq("os_id", osId),
      supabase.from("os_servicos").delete().eq("os_id", osId),
      supabase.from("os_produtos").delete().eq("os_id", osId),
      supabase.from("os_equipamentos").delete().eq("os_id", osId),
    ]);
    const erroLimpar = limpar.find((r) => r.error)?.error;
    if (erroLimpar) return fail(erroLimpar, "A OS foi salva, mas os itens não. Tente salvar de novo.");

    const servicos = f.servicos_ativos ? f.servicos : [];
    const produtos = f.produtos_ativos ? f.produtos : [];
    const equipamentos = new Set(f.equipamentos);
    for (const i of [...servicos, ...produtos]) if (i.equipamento_id) equipamentos.add(i.equipamento_id);

    const inserts = await Promise.all([
      f.visitas.length
        ? supabase.from("os_visitas").insert(
            f.visitas.map((v, ordem) => ({
              os_id: osId,
              data: v.data,
              hora: v.hora || null,
              duracao_min: v.duracao_min,
              ordem,
            })),
          )
        : Promise.resolve({ error: null }),
      servicos.length
        ? supabase.from("os_servicos").insert(
            servicos.map((i, ordem) => ({
              os_id: osId,
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
        ? supabase.from("os_produtos").insert(
            produtos.map((i, ordem) => ({
              os_id: osId,
              produto_id: i.catalogId,
              descricao: i.descricao.trim(),
              quantidade: i.quantidade,
              valor_unitario: i.valor_unitario,
              equipamento_id: i.equipamento_id,
              ordem,
            })),
          )
        : Promise.resolve({ error: null }),
      equipamentos.size
        ? supabase.from("os_equipamentos").insert([...equipamentos].map((equipamento_id) => ({ os_id: osId, equipamento_id })))
        : Promise.resolve({ error: null }),
    ]);
    const erroItens = inserts.find((r) => r.error)?.error;
    if (erroItens) return fail(erroItens, "A OS foi salva, mas algum item não. Confira e salve de novo.");

    revalidatePath("/servicos");
    revalidatePath("/dashboard");
    revalidatePath("/agenda");
    revalidatePath("/clientes");
    return { ok: true, data: { id: osId, numero: os.numero } };
  } catch (e) {
    return fail(e);
  }
}

/** Salva e aplica as regras do botão Finalizar OS (definidas na Fase 1). */
export async function finalizarAtendimento(
  f: DocForm,
): Promise<ActionResult<{ id: string; numero: number; status: Enums<"os_status"> }>> {
  const salvo = await salvarAtendimento(f);
  if (!salvo.ok) return salvo;
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("finalizar_os", { p_os_id: salvo.data.id });
    if (error || !data) return fail(error, "A OS foi salva, mas não foi possível finalizar.");
    revalidatePath("/servicos");
    revalidatePath("/dashboard");
    return { ok: true, data: { ...salvo.data, status: data } };
  } catch (e) {
    return fail(e);
  }
}

export async function alterarStatus(id: string, status: Enums<"os_status">): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("base_atendimentos")
      .update({ status, finalizado_em: status === "finalizado" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return fail(error);
    revalidatePath("/servicos");
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export async function excluirAtendimentos(ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("base_atendimentos").delete().in("id", ids);
    if (error) return fail(error, "Não foi possível excluir agora.");
    revalidatePath("/servicos");
    revalidatePath("/dashboard");
    revalidatePath("/agenda");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
