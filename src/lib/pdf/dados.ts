import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Enums, Tables } from "@/lib/database.types";
import { asSpecs, resumoEquipamento } from "@/lib/equipamentos";
import { EQUIPAMENTO_CURTO } from "@/lib/labels";
import { descontoEmReais } from "@/lib/documento";

export type PdfItem = { descricao: string; quantidade: number; valor_unitario: number; equipamento: string | null };

export type PdfDados = {
  tipo: "os" | "orcamento";
  numero: number;
  data: string;
  status: Enums<"os_status"> | null;
  negocio: Tables<"meu_negocio"> | null;
  cliente: Tables<"base_clientes"> | null;
  relato: string | null;
  observacoes: string | null;
  equipamentos: { nome: string; detalhe: string }[];
  visitas: { data: string; hora: string | null; duracao_min: number | null }[];
  servicos: PdfItem[];
  produtos: PdfItem[];
  /** frete cobrado do cliente (as demais despesas são internas e não saem no PDF) */
  frete: number;
  desconto: number;
  descontoPct: number | null;
  garantiaMeses: number | null;
  visita: number | null;
  total: number;
  totalManual: boolean;
  dataEntrega: string | null;
  recebido: { valor: number; data: string | null } | null;
};

type Client = SupabaseClient<Database>;

/** Junta tudo o que o PDF precisa. A leitura passa pelas regras do banco: só o dono acessa. */
/** `t` traduz os nomes fixos (tipo de equipamento, opções) para o idioma do técnico. */
export async function carregarPdf(
  supabase: Client,
  tipo: "os" | "orcamento",
  id: string,
  t: (s: string) => string = (s) => s,
): Promise<PdfDados | null> {
  const { data: negocio } = await supabase.from("meu_negocio").select("*").maybeSingle();

  const header =
    tipo === "os"
      ? (await supabase.from("base_atendimentos").select("*").eq("id", id).maybeSingle()).data
      : (await supabase.from("base_orcamentos").select("*").eq("id", id).maybeSingle()).data;
  if (!header) return null;

  const [cliente, sv, pr, eqLinks, vis] = await Promise.all([
    header.cliente_id
      ? supabase.from("base_clientes").select("*").eq("id", header.cliente_id).maybeSingle()
      : Promise.resolve({ data: null }),
    tipo === "os"
      ? supabase.from("os_servicos").select("descricao, quantidade, valor_unitario, equipamento_id").eq("os_id", id).order("ordem")
      : supabase.from("orc_servicos").select("descricao, quantidade, valor_unitario, equipamento_id").eq("orcamento_id", id).order("ordem"),
    tipo === "os"
      ? supabase.from("os_produtos").select("descricao, quantidade, valor_unitario, equipamento_id").eq("os_id", id).order("ordem")
      : supabase.from("orc_produtos").select("descricao, quantidade, valor_unitario, equipamento_id").eq("orcamento_id", id).order("ordem"),
    tipo === "os"
      ? supabase.from("os_equipamentos").select("equipamento_id").eq("os_id", id)
      : Promise.resolve({ data: [] as { equipamento_id: string }[] }),
    tipo === "os"
      ? supabase.from("os_visitas").select("data, hora, duracao_min").eq("os_id", id).order("ordem")
      : Promise.resolve({ data: [] as { data: string; hora: string | null; duracao_min: number | null }[] }),
  ]);

  const servicosRows = sv.data ?? [];
  const produtosRows = pr.data ?? [];
  const equipIds = new Set<string>((eqLinks.data ?? []).map((e) => e.equipamento_id));
  for (const i of [...servicosRows, ...produtosRows]) if (i.equipamento_id) equipIds.add(i.equipamento_id);
  const { data: equips } = equipIds.size
    ? await supabase.from("base_equipamentos").select("id, nome, tipo, especificacoes").in("id", [...equipIds])
    : { data: [] as Pick<Tables<"base_equipamentos">, "id" | "nome" | "tipo" | "especificacoes">[] };
  const equipNome = new Map((equips ?? []).map((e) => [e.id, e.nome]));

  const toItem = (r: { descricao: string; quantidade: number; valor_unitario: number; equipamento_id: string | null }) => ({
    descricao: r.descricao,
    quantidade: Number(r.quantidade),
    valor_unitario: Number(r.valor_unitario),
    equipamento: r.equipamento_id ? (equipNome.get(r.equipamento_id) ?? null) : null,
  });

  const servicos = servicosRows.map(toItem);
  const produtos = produtosRows.map(toItem);
  const frete = header.despesas_ativas ? Number(header.despesa_frete) : 0;
  const visita = header.cobrar_visita ? Number(header.valor_visita) : 0;
  const subtotal =
    servicos.reduce((a, i) => a + i.quantidade * i.valor_unitario, 0) +
    produtos.reduce((a, i) => a + i.quantidade * i.valor_unitario, 0) +
    visita +
    frete;
  const desconto = descontoEmReais(subtotal, header.desconto_tipo, Number(header.desconto_valor));

  const os = tipo === "os" ? (header as Tables<"base_atendimentos">) : null;
  const orc = tipo === "orcamento" ? (header as Tables<"base_orcamentos">) : null;

  return {
    tipo,
    numero: header.numero,
    data: os ? os.data_inicio : (orc?.data ?? ""),
    status: os ? os.status : null,
    negocio: negocio ?? null,
    cliente: cliente.data ?? null,
    relato: header.relato,
    observacoes: header.observacoes,
    equipamentos: (equips ?? []).map((e) => ({
      nome: e.nome,
      detalhe: [t(EQUIPAMENTO_CURTO[e.tipo]), resumoEquipamento(e.tipo, asSpecs(e.especificacoes), t)].filter(Boolean).join(" · "),
    })),
    visitas: (vis.data ?? []).map((v) => ({ data: v.data, hora: v.hora ? v.hora.slice(0, 5) : null, duracao_min: v.duracao_min })),
    servicos,
    produtos,
    frete,
    desconto,
    descontoPct: header.desconto_tipo === "percentual" && desconto > 0 ? Number(header.desconto_valor) : null,
    garantiaMeses: header.garantia_meses,
    visita: header.cobrar_visita ? header.valor_visita : null,
    total: header.valor_total,
    totalManual: header.valor_total_manual,
    dataEntrega: os?.data_entrega ?? null,
    recebido: os && os.recebido ? { valor: os.valor_recebido ?? os.valor_total, data: os.data_recebimento } : null,
  };
}
