"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, CalendarClock, Wallet } from "lucide-react";
import { useViewer } from "@/components/detalhes/viewer";
import { Popover } from "@/components/ui/popover";
import { useI18n } from "@/i18n/client";
import { docNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Dados = {
  visitas: { os_id: string; data: string; hora: string | null; numero: number; cliente: string | null }[];
  pagamentos: { os_id: string; numero: number; cliente: string | null; valor_total: number; previsto: string | null }[];
  pagamentosQtd: number;
};

/** Sino da barra superior: visitas de hoje a depois de amanhã e pagamentos aguardando. */
export function Notificacoes({ className, compact = false }: { className: string; compact?: boolean }) {
  const { t, fmt } = useI18n();
  const { abrir } = useViewer();
  const pathname = usePathname();
  const [d, setD] = useState<Dados | null>(null);

  const carregar = useCallback(async () => {
    // O sino existe duas vezes (barra do computador e do celular); só a versão visível busca.
    if (window.matchMedia("(min-width: 1024px)").matches === compact) return;
    const { data } = await createClient().rpc("notificacoes", { p_hoje: fmt.today() });
    if (data) setD(data as unknown as Dados);
  }, [fmt, compact]);

  // Atualiza ao trocar de tela (leve: uma consulta só).
  useEffect(() => {
    void carregar();
  }, [carregar, pathname]);

  const total = (d?.visitas.length ?? 0) + (d?.pagamentosQtd ?? 0);
  const quando = (iso: string) => {
    const r = fmt.relativeDays(iso);
    return r.charAt(0).toUpperCase() + r.slice(1);
  };

  return (
    <Popover
      label={t("Notificações")}
      className="w-80"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={() => {
            toggle();
            void carregar();
          }}
          aria-label={total ? t("Notificações ({n})", { n: total }) : t("Notificações")}
          className={className}
        >
          <Bell className="size-4" />
          {total ? (
            <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white tabular-nums">
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </button>
      )}
    >
      {(close) => (
        <div className="max-h-[70dvh] overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-sm font-semibold">{t("Notificações")}</p>
          {!d || total === 0 ? (
            <p className="px-3 pb-3 text-[13px] text-ink-subtle">{t("Nenhuma notificação por enquanto.")}</p>
          ) : null}

          {d?.visitas.length ? (
            <Grupo titulo={t("Próximas visitas")}>
              {d.visitas.map((v, i) => (
                <Linha
                  key={`${v.os_id}-${i}`}
                  icon={<CalendarClock className="size-4 text-brand-ink" />}
                  titulo={v.cliente ?? t("Cliente não definido")}
                  sub={`${quando(v.data)}${v.hora ? ` · ${v.hora}` : ""} · ${t("OS {n}", { n: docNumber(v.numero) })}`}
                  onClick={() => {
                    close();
                    abrir({ tipo: "os", id: v.os_id });
                  }}
                />
              ))}
            </Grupo>
          ) : null}

          {d?.pagamentos.length ? (
            <Grupo
              titulo={
                d.pagamentosQtd > d.pagamentos.length
                  ? t("Pagamentos aguardando ({n})", { n: d.pagamentosQtd })
                  : t("Pagamentos aguardando")
              }
            >
              {d.pagamentos.map((p) => (
                <Linha
                  key={p.os_id}
                  icon={<Wallet className="size-4 text-warning" />}
                  titulo={p.cliente ?? t("Cliente não definido")}
                  sub={`${t("OS {n}", { n: docNumber(p.numero) })} · ${fmt.money(p.valor_total)}${
                    p.previsto ? ` · ${t("previsto para {data}", { data: fmt.date(p.previsto) })}` : ""
                  }`}
                  onClick={() => {
                    close();
                    abrir({ tipo: "os", id: p.os_id });
                  }}
                />
              ))}
            </Grupo>
          ) : null}
        </div>
      )}
    </Popover>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="pb-1.5">
      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-ink-subtle uppercase">{titulo}</p>
      {children}
    </div>
  );
}

function Linha({ icon, titulo, sub, onClick }: { icon: React.ReactNode; titulo: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={cn("flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-surface-muted")}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{titulo}</span>
        <span className="block truncate text-xs text-ink-subtle">{sub}</span>
      </span>
    </button>
  );
}
