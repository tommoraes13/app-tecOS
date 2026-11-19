"use client";

import { useViewer } from "@/components/detalhes/viewer";
import { StatusBadge } from "@/components/ui/status-badge";
import type { VisitaAgenda } from "@/lib/agenda";
import { useI18n } from "@/i18n/client";
import { docNumber } from "@/lib/format";

/** Uma visita técnica na lista: dia, cliente, bairro · serviço · valor, OS e status. */
export function VisitaItem({ v, showDate = true }: { v: VisitaAgenda; showDate?: boolean }) {
  const { t, fmt } = useI18n();
  const { abrir } = useViewer();
  return (
    <button
      type="button"
      onClick={() => abrir({ tipo: "os", id: v.os_id })}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted"
    >
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
            v.bairro,
            v.servicos.length ? (v.servicos.length > 1 ? `${v.servicos[0]} +${v.servicos.length - 1}` : v.servicos[0]) : null,
            v.valor_total ? fmt.money(v.valor_total) : null,
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
    </button>
  );
}
