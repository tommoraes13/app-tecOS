"use server";

import { revalidatePath } from "next/cache";
import { getI18n } from "@/i18n/server";
import { fail, requireUser, type ActionResult } from "@/lib/actions";
import type { Tables } from "@/lib/database.types";
import { carregarPdf, type PdfDados } from "@/lib/pdf/dados";

export type DocDetalhe = PdfDados & {
  id: string;
  clienteId: string | null;
  /** OS: orçamento de origem. Orçamento: OS que ele virou. */
  vinculo: { id: string; numero: number } | null;
};

export type ClienteDetalhe = {
  cliente: Tables<"clientes_resumo">;
  equipamentos: Tables<"base_equipamentos">[];
  atendimentos: Pick<Tables<"base_atendimentos">, "id" | "numero" | "status" | "data_inicio" | "valor_total">[];
  orcamentos: Pick<Tables<"base_orcamentos">, "id" | "numero" | "data" | "valor_total">[];
};

export type EquipamentoDetalhe = {
  equipamento: Tables<"base_equipamentos">;
  cliente: { id: string; nome: string } | null;
  historico: { osId: string; descricao: string; numero: number | null; data: string | null }[];
};

/** Dados da OS ou do orçamento para a janela de visualização (sem campos editáveis). */
export async function carregarDocumento(tipo: "os" | "orcamento", id: string): Promise<ActionResult<DocDetalhe>> {
  try {
    const { supabase } = await requireUser();
    const { t } = await getI18n();
    const [d, vinc] = await Promise.all([
      carregarPdf(supabase, tipo, id, t),
      tipo === "os"
        ? supabase.from("base_atendimentos").select("orcamento_id").eq("id", id).maybeSingle()
        : supabase.from("base_atendimentos").select("id, numero").eq("orcamento_id", id).maybeSingle(),
    ]);
    if (!d) return { ok: false, error: "Documento não encontrado." };
    let vinculo: DocDetalhe["vinculo"] = null;
    if (tipo === "os") {
      const orcId = (vinc.data as { orcamento_id: string | null } | null)?.orcamento_id;
      if (orcId) {
        const { data: o } = await supabase.from("base_orcamentos").select("id, numero").eq("id", orcId).maybeSingle();
        vinculo = o ?? null;
      }
    } else {
      vinculo = (vinc.data as { id: string; numero: number } | null) ?? null;
    }
    return { ok: true, data: { ...d, id, clienteId: d.cliente?.id ?? null, vinculo } };
  } catch (e) {
    return fail(e);
  }
}

export async function carregarCliente(id: string): Promise<ActionResult<ClienteDetalhe>> {
  try {
    const { supabase } = await requireUser();
    const [cl, eq, os, orc] = await Promise.all([
      supabase.from("clientes_resumo").select("*").eq("id", id).maybeSingle(),
      supabase.from("base_equipamentos").select("*").eq("cliente_id", id).order("nome"),
      supabase
        .from("base_atendimentos")
        .select("id, numero, status, data_inicio, valor_total")
        .eq("cliente_id", id)
        .order("data_inicio", { ascending: false })
        .limit(10),
      supabase.from("base_orcamentos").select("id, numero, data, valor_total").eq("cliente_id", id).order("data", { ascending: false }).limit(10),
    ]);
    if (!cl.data) return { ok: false, error: "Cliente não encontrado." };
    return { ok: true, data: { cliente: cl.data, equipamentos: eq.data ?? [], atendimentos: os.data ?? [], orcamentos: orc.data ?? [] } };
  } catch (e) {
    return fail(e);
  }
}

export async function carregarEquipamento(id: string): Promise<ActionResult<EquipamentoDetalhe>> {
  try {
    const { supabase } = await requireUser();
    const { data: e } = await supabase.from("base_equipamentos").select("*").eq("id", id).maybeSingle();
    if (!e) return { ok: false, error: "Equipamento não encontrado." };
    const [cl, itens] = await Promise.all([
      supabase.from("base_clientes").select("id, nome").eq("id", e.cliente_id).maybeSingle(),
      supabase.from("os_servicos").select("descricao, os_id").eq("equipamento_id", id),
    ]);
    const osIds = [...new Set((itens.data ?? []).map((i) => i.os_id))];
    const { data: oss } = osIds.length
      ? await supabase.from("base_atendimentos").select("id, numero, data_inicio").in("id", osIds)
      : { data: [] as { id: string; numero: number; data_inicio: string }[] };
    const byId = new Map((oss ?? []).map((o) => [o.id, o]));
    const historico = (itens.data ?? [])
      .map((i) => ({ osId: i.os_id, descricao: i.descricao, numero: byId.get(i.os_id)?.numero ?? null, data: byId.get(i.os_id)?.data_inicio ?? null }))
      .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
    return { ok: true, data: { equipamento: e, cliente: cl.data ?? null, historico } };
  } catch (err) {
    return fail(err);
  }
}

/** Cria a OS a partir de um orçamento já salvo (uma vez por orçamento). */
export async function transformarOrcamento(id: string): Promise<ActionResult<{ osId: string }>> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("transformar_orcamento_em_os", { p_orcamento_id: id });
    if (error || !data) return fail(error, "Não foi possível criar o atendimento agora.");
    revalidatePath("/orcamentos");
    revalidatePath("/servicos");
    return { ok: true, data: { osId: data } };
  } catch (e) {
    return fail(e);
  }
}
