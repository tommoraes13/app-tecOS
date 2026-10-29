"use client";

import { useI18n } from "@/i18n/client";
import { OS_STATUS, type OsStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

export type { OsStatus };

/** Badge de status da OS (Design System > StatusBadge). O texto aparece sempre. */
export function StatusBadge({ status, suffix }: { status: OsStatus; suffix?: string }) {
  const { t } = useI18n();
  const s = OS_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap before:size-1.5 before:rounded-full before:bg-current",
        s.className,
      )}
    >
      {t(s.label)}
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
