/** Status da OS: texto (em português, traduzido na tela com t()) e cores do Design System. */
export const OS_STATUS = {
  em_andamento: { label: "Em andamento", className: "bg-info-bg text-info" },
  pendente: { label: "Pendente", className: "bg-neutral-bg text-neutral" },
  aguardando_pagamento: { label: "Aguardando Pagamento", className: "bg-warning-bg text-warning" },
  finalizado: { label: "Finalizado", className: "bg-success-bg text-success" },
  retorno: { label: "Retorno", className: "bg-return-bg text-return" },
} as const;

export type OsStatus = keyof typeof OS_STATUS;
