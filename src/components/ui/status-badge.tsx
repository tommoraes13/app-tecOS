import { cn } from "@/lib/utils";

export const OS_STATUS = {
  em_andamento: { label: "Em andamento", className: "bg-info-bg text-info" },
  pendente: { label: "Pendente", className: "bg-neutral-bg text-neutral" },
  aguardando_pagamento: { label: "Aguardando Pagamento", className: "bg-warning-bg text-warning" },
  finalizado: { label: "Finalizado", className: "bg-success-bg text-success" },
  retorno: { label: "Retorno", className: "bg-return-bg text-return" },
} as const;

export type OsStatus = keyof typeof OS_STATUS;

/** Badge de status da OS (Design System > StatusBadge). O texto aparece sempre. */
export function StatusBadge({ status, suffix }: { status: OsStatus; suffix?: string }) {
  const s = OS_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap before:size-1.5 before:rounded-full before:bg-current",
        s.className,
      )}
    >
      {s.label}
      {suffix ? ` · ${suffix}` : null}
    </span>
  );
}

/** Etiqueta retangular para categorias (tipo de equipamento, tipo de serviço). */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[22px] items-center rounded-sm bg-neutral-bg px-2 text-xs font-medium text-neutral">
      {children}
    </span>
  );
}
