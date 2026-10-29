/** Status da OS: texto (em português, traduzido na tela com t()) e cores do Design System. */
export const OS_STATUS = {
  em_andamento: { label: "Em andamento", className: "bg-info-bg text-info" },
  pendente: { label: "Pendente", className: "bg-orange-bg text-orange" },
  aguardando_pagamento: { label: "Aguardando Pagamento", className: "bg-warning-bg text-warning" },
  finalizado: { label: "Finalizado", className: "bg-success-bg text-success" },
  retorno: { label: "Retorno", className: "bg-return-bg text-return" },
} as const;

export type OsStatus = keyof typeof OS_STATUS;

/** Cor do valor (R$) conforme o status: recebido em verde, a receber em amarelo/laranja. */
export const VALOR_COR: Record<OsStatus, string> = {
  em_andamento: "text-ink",
  pendente: "text-ink",
  aguardando_pagamento: "text-warning",
  finalizado: "text-success",
  retorno: "text-ink",
};
