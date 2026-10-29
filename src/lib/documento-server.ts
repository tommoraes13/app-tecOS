import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  newKey,
  type CatalogoProduto,
  type CatalogoServico,
  type ClienteOpcao,
  type DocForm,
  type ItemForm,
  type Padroes,
} from "@/lib/documento";
import { todayISO } from "@/lib/format";

type Client = SupabaseClient<Database>;

/** Clientes, catálogos e padrões do Meu Negócio, usados pelos formulários de OS e orçamento. */
export async function carregarApoio(supabase: Client) {
  const [cl, sv, pr, mn, nm] = await Promise.all([
    supabase.from("base_clientes").select("id, nome, telefone, bairro, cidade").order("nome"),
    supabase.from("cadastro_servicos").select("id, nome, codigo, valor, tempo_medio_min").eq("ativo", true).order("nome"),
    supabase.from("cadastro_produtos").select("id, nome, codigo, valor_venda").eq("ativo", true).order("nome"),
    supabase.from("meu_negocio").select("valor_visita, duracao_visita_min, cobrar_visita, garantia_meses_padrao").maybeSingle(),
    supabase.from("numeracao").select("proxima_os, proximo_orcamento").maybeSingle(),
  ]);
  const padroes: Padroes = {
    valor_visita: mn.data?.valor_visita ?? 0,
    duracao_visita_min: mn.data?.duracao_visita_min ?? 60,
    cobrar_visita: mn.data?.cobrar_visita ?? false,
    garantia_meses: mn.data?.garantia_meses_padrao ?? 3,
  };
  return {
    clientes: (cl.data ?? []) as ClienteOpcao[],
    servicos: (sv.data ?? []) as CatalogoServico[],
    produtos: (pr.data ?? []) as CatalogoProduto[],
    padroes,
    proximaOS: nm.data?.proxima_os ?? 1,
    proximoOrcamento: nm.data?.proximo_orcamento ?? 1,
  };
}

export function formularioVazio(numero: number, padroes: Padroes, clienteId: string | null): DocForm {
  return {
    numero,
    cliente_id: clienteId,
    relato: "",
    data: todayISO(),
    status: "em_andamento",
    distancia_km: null,
    visitas: [{ key: newKey(), data: todayISO(), hora: "", duracao_min: padroes.duracao_visita_min, auto: true }],
    equipamentos: [],
    servicos_ativos: false,
    servicos: [],
    produtos_ativos: false,
    produtos: [],
    cobrar_visita: padroes.cobrar_visita,
    valor_visita: padroes.valor_visita,
    despesas_ativas: false,
    despesa_deslocamento: 0,
    despesa_alimentacao: 0,
    despesa_insumos: 0,
    despesa_outros: 0,
    despesa_frete: 0,
    desconto_tipo: "valor",
    desconto_valor: 0,
    garantia_meses: padroes.garantia_meses,
    valor_total: 0,
    valor_total_manual: false,
    data_entrega: "",
    recebido: false,
    data_recebimento: "",
    valor_recebido: null,
    observacoes: "",
  };
}

type ItemRow = {
  servico_id?: string | null;
  produto_id?: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  equipamento_id: string | null;
};

function toItens(rows: ItemRow[] | null, tempos: Map<string, number | null>): ItemForm[] {
  return (rows ?? []).map((r) => {
    const catalogId = r.servico_id ?? r.produto_id ?? null;
    return {
      key: newKey(),
      catalogId,
      descricao: r.descricao,
      quantidade: Number(r.quantidade),
      valor_unitario: Number(r.valor_unitario),
      equipamento_id: r.equipamento_id,
      tempo_min: catalogId ? (tempos.get(catalogId) ?? null) : null,
    };
  });
}

export async function carregarAtendimento(supabase: Client, id: string, servicos: CatalogoServico[] = []) {
  const { data: os } = await supabase.from("base_atendimentos").select("*").eq("id", id).maybeSingle();
  if (!os) return null;
  const [vis, sv, pr, eq, orc] = await Promise.all([
    supabase.from("os_visitas").select("*").eq("os_id", id).order("ordem"),
    supabase.from("os_servicos").select("*").eq("os_id", id).order("ordem"),
    supabase.from("os_produtos").select("*").eq("os_id", id).order("ordem"),
    supabase.from("os_equipamentos").select("equipamento_id").eq("os_id", id),
    os.orcamento_id
      ? supabase.from("base_orcamentos").select("id, numero").eq("id", os.orcamento_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const tempos = new Map(servicos.map((s) => [s.id, s.tempo_medio_min]));
  const servicosItens = toItens(sv.data, tempos);
  const produtosItens = toItens(pr.data, tempos);

  const form: DocForm = {
    id: os.id,
    numero: os.numero,
    cliente_id: os.cliente_id,
    relato: os.relato ?? "",
    data: os.data_inicio,
    status: os.status,
    distancia_km: os.distancia_km,
    visitas: (vis.data ?? []).map((v) => ({
      key: newKey(),
      data: v.data,
      hora: v.hora ? v.hora.slice(0, 5) : "",
      duracao_min: v.duracao_min ?? 60,
      auto: false,
    })),
    equipamentos: (eq.data ?? []).map((e) => e.equipamento_id),
    servicos_ativos: servicosItens.length > 0,
    servicos: servicosItens,
    produtos_ativos: produtosItens.length > 0,
    produtos: produtosItens,
    cobrar_visita: os.cobrar_visita,
    valor_visita: os.valor_visita,
    despesas_ativas: os.despesas_ativas,
    despesa_deslocamento: os.despesa_deslocamento,
    despesa_alimentacao: os.despesa_alimentacao,
    despesa_insumos: os.despesa_insumos,
    despesa_outros: os.despesa_outros,
    despesa_frete: os.despesa_frete,
    desconto_tipo: os.desconto_tipo === "percentual" ? "percentual" : "valor",
    desconto_valor: os.desconto_valor,
    garantia_meses: os.garantia_meses,
    valor_total: os.valor_total,
    valor_total_manual: os.valor_total_manual,
    data_entrega: os.data_entrega ?? "",
    recebido: os.recebido,
    data_recebimento: os.data_recebimento ?? "",
    valor_recebido: os.valor_recebido,
    observacoes: os.observacoes ?? "",
  };
  if (form.visitas.length === 0) {
    form.visitas = [{ key: newKey(), data: os.data_inicio, hora: "", duracao_min: 60, auto: false }];
  }
  return { form, orcamentoOrigem: orc.data ?? null };
}

export async function carregarOrcamento(
  supabase: Client,
  id: string,
  servicos: CatalogoServico[] = [],
  padroes: Padroes = { valor_visita: 0, duracao_visita_min: 60, cobrar_visita: false, garantia_meses: 3 },
) {
  const { data: orc } = await supabase.from("base_orcamentos").select("*").eq("id", id).maybeSingle();
  if (!orc) return null;
  const [sv, pr, os] = await Promise.all([
    supabase.from("orc_servicos").select("*").eq("orcamento_id", id).order("ordem"),
    supabase.from("orc_produtos").select("*").eq("orcamento_id", id).order("ordem"),
    supabase.from("base_atendimentos").select("id, numero").eq("orcamento_id", id).maybeSingle(),
  ]);
  const tempos = new Map(servicos.map((s) => [s.id, s.tempo_medio_min]));
  const servicosItens = toItens(sv.data, tempos);
  const produtosItens = toItens(pr.data, tempos);
  const vazio = formularioVazio(orc.numero, padroes, orc.cliente_id);
  const form: DocForm = {
    ...vazio,
    id: orc.id,
    relato: orc.relato ?? "",
    data: orc.data,
    servicos_ativos: servicosItens.length > 0,
    servicos: servicosItens,
    produtos_ativos: produtosItens.length > 0,
    produtos: produtosItens,
    cobrar_visita: orc.cobrar_visita,
    valor_visita: orc.valor_visita,
    despesas_ativas: orc.despesas_ativas,
    despesa_deslocamento: orc.despesa_deslocamento,
    despesa_alimentacao: orc.despesa_alimentacao,
    despesa_insumos: orc.despesa_insumos,
    despesa_outros: orc.despesa_outros,
    despesa_frete: orc.despesa_frete,
    desconto_tipo: orc.desconto_tipo === "percentual" ? "percentual" : "valor",
    desconto_valor: orc.desconto_valor,
    garantia_meses: orc.garantia_meses,
    valor_total: orc.valor_total,
    valor_total_manual: orc.valor_total_manual,
    observacoes: orc.observacoes ?? "",
  };
  return { form, osGerada: os.data ?? null };
}

/** Preenche o tempo médio dos serviços do catálogo (usado na duração sugerida). */
export function aplicarTempos(form: DocForm, servicos: CatalogoServico[]): DocForm {
  const tempos = new Map(servicos.map((s) => [s.id, s.tempo_medio_min]));
  return {
    ...form,
    servicos: form.servicos.map((i) => (i.catalogId ? { ...i, tempo_min: tempos.get(i.catalogId) ?? null } : i)),
  };
}
