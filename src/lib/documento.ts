import type { Enums } from "@/lib/database.types";

/** Estado do formulário compartilhado entre Atendimento (OS) e Orçamento. */

export type ItemForm = {
  key: string;
  catalogId: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  equipamento_id: string | null;
  /** tempo médio do catálogo, em minutos (só para sugerir a duração) */
  tempo_min: number | null;
};

export type VisitaForm = {
  key: string;
  data: string;
  hora: string;
  duracao_min: number;
  /** true = a duração acompanha a sugestão (visita padrão + tempo dos serviços) */
  auto: boolean;
};

export type DocForm = {
  id?: string;
  numero: number;
  cliente_id: string | null;
  relato: string;
  data: string;
  status: Enums<"os_status">;
  distancia_km: number | null;
  visitas: VisitaForm[];
  equipamentos: string[];
  servicos_ativos: boolean;
  servicos: ItemForm[];
  produtos_ativos: boolean;
  produtos: ItemForm[];
  cobrar_visita: boolean;
  valor_visita: number;
  despesas_ativas: boolean;
  despesa_deslocamento: number;
  despesa_alimentacao: number;
  despesa_insumos: number;
  despesa_outros: number;
  /** frete é cobrado do cliente e sai no PDF; as outras despesas são só controle interno */
  despesa_frete: number;
  desconto_tipo: "valor" | "percentual";
  /** em reais ou em %, conforme desconto_tipo */
  desconto_valor: number;
  garantia_meses: number | null;
  valor_total: number;
  valor_total_manual: boolean;
  data_entrega: string;
  recebido: boolean;
  data_recebimento: string;
  valor_recebido: number | null;
  observacoes: string;
};

export function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function somaItens(itens: ItemForm[]) {
  return round2(itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0));
}

/**
 * Total cobrado = serviços + produtos + visita + frete − desconto.
 * Deslocamento, alimentação, insumos e outros são custos internos: não entram no total nem no PDF.
 */
export function totais(f: DocForm) {
  const servicos = f.servicos_ativos ? somaItens(f.servicos) : 0;
  const produtos = f.produtos_ativos ? somaItens(f.produtos) : 0;
  const frete = f.despesas_ativas ? round2(f.despesa_frete) : 0;
  const interno = f.despesas_ativas
    ? round2(f.despesa_deslocamento + f.despesa_alimentacao + f.despesa_insumos + f.despesa_outros)
    : 0;
  const visita = f.cobrar_visita ? f.valor_visita : 0;
  const subtotal = round2(servicos + produtos + visita + frete);
  const desconto = descontoEmReais(subtotal, f.desconto_tipo, f.desconto_valor);
  const calculado = round2(subtotal - desconto);
  return {
    servicos,
    produtos,
    frete,
    interno,
    visita,
    subtotal,
    desconto,
    calculado,
    total: f.valor_total_manual ? f.valor_total : calculado,
  };
}

export function descontoEmReais(subtotal: number, tipo: string, valor: number) {
  if (!valor || valor <= 0) return 0;
  const d = tipo === "percentual" ? (subtotal * Math.min(valor, 100)) / 100 : valor;
  return round2(Math.min(d, subtotal));
}

/** Duração sugerida: visita padrão + tempo médio dos serviços × quantidade, arredondada para 30 min. */
export function duracaoSugerida(f: DocForm, duracaoPadrao: number) {
  const servicos = f.servicos_ativos
    ? f.servicos.reduce((s, i) => s + (i.tempo_min ?? 0) * Math.max(1, Math.round(i.quantidade)), 0)
    : 0;
  const total = duracaoPadrao + servicos;
  return Math.max(30, Math.ceil(total / 30) * 30);
}

export const STATUS_OPCOES: { value: Enums<"os_status">; label: string }[] = [
  { value: "em_andamento", label: "Em andamento" },
  { value: "pendente", label: "Pendente" },
  { value: "aguardando_pagamento", label: "Aguardando Pagamento" },
  { value: "finalizado", label: "Finalizado" },
  { value: "retorno", label: "Retorno" },
];

/** Dados de apoio que o formulário recebe do servidor. */
export type ClienteOpcao = { id: string; nome: string; telefone: string; bairro: string | null; cidade: string | null };
export type CatalogoServico = { id: string; nome: string; codigo: string | null; valor: number; tempo_medio_min: number | null };
export type CatalogoProduto = { id: string; nome: string; codigo: string | null; valor_venda: number };
export type Padroes = {
  valor_visita: number;
  duracao_visita_min: number;
  cobrar_visita: boolean;
  garantia_meses: number;
};
