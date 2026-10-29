"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { VisitaAgenda } from "@/lib/agenda";
import { useI18n } from "@/i18n/client";
import { docNumber, duration } from "@/lib/format";

/** Uma visita técnica na lista: dia, horário, cliente, OS e status. */
export function VisitaItem({ v, showDate = true }: { v: VisitaAgenda; showDate?: boolean }) {
  const { t, fmt } = useI18n();
  return (
    <Link href={`/servicos/${v.os_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted">
      {showDate ? (
        <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-surface-muted py-1.5 text-center">
          <span className="text-[15px] leading-5 font-semibold tabular-nums">{Number(v.data.slice(8, 10))}</span>
          <span className="text-[11px] leading-3 text-ink-subtle">{fmt.monthShort(v.data)}</span>
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{v.cliente ?? t("Cliente não definido")}</span>
        <span className="block truncate text-xs text-ink-subtle">
          {[
            v.hora ?? t("Sem horário"),
            v.duracao_min ? duration(v.duracao_min) : null,
            [v.bairro, v.cidade].filter(Boolean).join(", ") || null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block font-mono text-xs text-ink-subtle">{t("OS {n}", { n: docNumber(v.numero) })}</span>
        {showDate ? <span className="block text-xs text-ink-subtle">{fmt.relativeDays(v.data)}</span> : null}
      </span>
      <StatusBadge status={v.status} />
    </Link>
  );
}
