"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VisitaItem } from "@/components/agenda/visita-item";
import { Card } from "@/components/ui/card";
import type { VisitaAgenda } from "@/lib/agenda";
import { useI18n } from "@/i18n/client";
import { addDaysISO } from "@/lib/format";
import { cn } from "@/lib/utils";


function shiftMes(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Calendário do mês com as visitas: as já realizadas ficam esmaecidas. */
export function Calendario({ mes, hoje, visitas }: { mes: string; hoje: string; visitas: VisitaAgenda[] }) {
  const { t, fmt } = useI18n();
  const { date } = fmt;
  const SEMANA = fmt.weekdaysShort();
  const [dia, setDia] = useState<string | null>(hoje.startsWith(mes) ? hoje : null);
  const [y, m] = mes.split("-").map(Number);
  const primeiro = `${mes}-01`;
  const inicioGrade = addDaysISO(primeiro, -new Date(Date.UTC(y, m - 1, 1)).getUTCDay());
  const dias = Array.from({ length: 42 }, (_, i) => addDaysISO(inicioGrade, i));
  const semanas = dias[35].startsWith(mes) ? 6 : 5;

  const porDia = new Map<string, VisitaAgenda[]>();
  for (const v of visitas) porDia.set(v.data, [...(porDia.get(v.data) ?? []), v]);
  const doDia = dia ? (porDia.get(dia) ?? []) : [];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4">
        <h2 className="text-[15px] font-semibold">
          {t("{mes} de {ano}", { mes: fmt.monthName(m), ano: y })}
        </h2>
        <div className="flex items-center gap-1">
          <Link
            href={`/agenda?mes=${hoje.slice(0, 7)}`}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-muted hover:bg-surface-muted"
          >
            {t("Hoje")}
          </Link>
          <Link
            href={`/agenda?mes=${shiftMes(mes, -1)}`}
            aria-label={t("Mês anterior")}
            className="inline-grid size-9 place-items-center rounded-md border border-border text-ink-muted hover:bg-surface-muted"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/agenda?mes=${shiftMes(mes, 1)}`}
            aria-label={t("Próximo mês")}
            className="inline-grid size-9 place-items-center rounded-md border border-border text-ink-muted hover:bg-surface-muted"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 border-t border-border text-center text-xs text-ink-subtle">
        {SEMANA.map((s) => (
          <div key={s} className="py-2">
            {s}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-border">
        {dias.slice(0, semanas * 7).map((d) => {
          const lista = porDia.get(d) ?? [];
          const foraDoMes = !d.startsWith(mes);
          const passado = d < hoje;
          const selecionado = d === dia;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDia(d)}
              aria-label={`${date(d)}: ${lista.length === 1 ? t("1 visita") : t("{n} visitas", { n: lista.length })}`}
              className={cn(
                "flex min-h-14 flex-col items-stretch gap-1 border-r border-b border-border p-1.5 text-left last:border-r-0 sm:min-h-24 [&:nth-child(7n)]:border-r-0",
                foraDoMes && "bg-surface-muted/50",
                selecionado && "bg-brand-100",
              )}
            >
              <span
                className={cn(
                  "grid size-6 place-items-center self-start rounded-full text-xs tabular-nums",
                  foraDoMes ? "text-ink-subtle" : "text-ink",
                  d === hoje && "bg-action font-semibold text-on-action",
                )}
              >
                {Number(d.slice(8, 10))}
              </span>
              {/* Celular: pontinhos. Computador: nomes. */}
              {lista.length > 0 ? (
                <>
                  <span className="flex flex-wrap gap-0.5 sm:hidden">
                    {lista.slice(0, 4).map((v) => (
                      <i key={v.id} className={cn("size-1.5 rounded-full", passado ? "bg-ink-subtle" : "bg-brand-600")} />
                    ))}
                  </span>
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {lista.slice(0, 2).map((v) => (
                      <span
                        key={v.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[11px] leading-4",
                          passado ? "bg-surface-muted text-ink-subtle" : "bg-brand-100 text-brand-ink",
                        )}
                      >
                        {v.hora ? `${v.hora} ` : ""}
                        {v.cliente ?? t("OS")}
                      </span>
                    ))}
                    {lista.length > 2 ? <span className="px-1 text-[11px] text-ink-subtle">+{lista.length - 2}</span> : null}
                  </span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      {dia ? (
        <div className="border-t border-border">
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold">
            {date(dia)} ·{" "}
            {doDia.length === 0 ? t("nenhuma visita") : doDia.length === 1 ? t("1 visita") : t("{n} visitas", { n: doDia.length })}
          </h3>
          {doDia.length > 0 ? (
            <div className="divide-y divide-border">
              {doDia.map((v) => (
                <VisitaItem key={v.id} v={v} showDate={false} />
              ))}
            </div>
          ) : (
            <p className="px-4 pb-4 text-[13px] text-ink-subtle">{t("Escolha outro dia ou crie um atendimento.")}</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
