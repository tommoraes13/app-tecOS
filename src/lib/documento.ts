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

/** Método de precificação (Configurar Precificação, em Meu Negócio). */
export const METODOS = [
  { value: "servico", label: "Valor do Serviço" },
  { value: "servico_visita", label: "Valor do Serviço + Visita Técnica" },
  { value: "hora_visita", label: "Hora Técnica + Visita Técnica" },
  { value: "livre", label: "Livre" },
] as const;
export type Metodo = (typeof METODOS)[number]["value"];
export function metodoValido(v: string | null | undefined): Metodo {
  return METODOS.some((m) => m.value === v) ? (v as Metodo) : "servico_visita";
}
export const metodoComVisita = (m: Metodo) => m === "servico_visita" || m === "hora_visita";

/** Horas cobradas de um serviço pelo tempo médio (arredonda para 15 min; sem tempo = 1 h). */
export function horasDoServico(tempoMin: number | null) {
  if (!tempoMin || tempoMin <= 0) return 1;
  return Math.max(0.25, Math.round((tempoMin / 60) * 4) / 4);
}

export type DocForm = {
  id?: string;
  precificacao: Metodo;
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
  /** preenchida sozinha ao finalizar (base da garantia); não aparece na tela */
  data_entrega: string;
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
  // Hora Técnica: a quantidade já é o número de horas.
  const porHora = f.precificacao === "hora_visita";
  const servicos = f.servicos_ativos
    ? f.servicos.reduce((s, i) => s + (porHora ? i.quantidade * 60 : (i.tempo_min ?? 0) * Math.max(1, Math.round(i.quantidade))), 0)
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
  precificacao: Metodo;
  valor_hora: number;
  valor_visita: number;
  duracao_visita_min: number;
  cobrar_visita: boolean;
  garantia_meses: number;
};

/**
 * Troca o método de precificação do documento: liga/desliga a visita, o total livre
 * e converte os serviços do catálogo entre "valor do serviço" e "horas × valor da hora".
 */
export function aplicarMetodo(f: DocForm, metodo: Metodo, padroes: Padroes, catalogo: CatalogoServico[]): DocForm {
  const precos = new Map(catalogo.map((s) => [s.id, s]));
  const porHora = metodo === "hora_visita";
  const eraHora = f.precificacao === "hora_visita";
  const servicos =
    porHora === eraHora
      ? f.servicos
      : f.servicos.map((i) => {
          const c = i.catalogId ? precos.get(i.catalogId) : undefined;
          if (porHora) return { ...i, quantidade: horasDoServico(c?.tempo_medio_min ?? i.tempo_min), valor_unitario: padroes.valor_hora };
          return { ...i, quantidade: 1, valor_unitario: c ? c.valor : round2(i.quantidade * i.valor_unitario) };
        });
  const visita = metodoComVisita(metodo);
  return {
    ...f,
    precificacao: metodo,
    servicos,
    cobrar_visita: visita,
    valor_visita: visita && !f.valor_visita ? padroes.valor_visita : f.valor_visita,
    valor_total_manual: metodo === "livre",
    valor_total: metodo === "livre" && !f.valor_total_manual ? totais(f).calculado : f.valor_total,
  };
}
