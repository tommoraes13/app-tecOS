"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/controls";
import { SelectionBar, toggleId } from "@/components/ui/list-toolbar";
import { ConfirmDialog } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { PillTabs } from "@/components/ui/tabs";
import { useI18n } from "@/i18n/client";
import { docNumber, normalize } from "@/lib/format";
import { excluirOrcamentos } from "./actions";

export type OrcamentoLinha = {
  id: string;
  numero: number;
  data: string;
  valor_total: number;
  relato: string | null;
  cliente: string | null;
  telefone: string | null;
  os: { id: string; numero: number } | null;
};

type Aba = "aguardando" | "aprovados" | "todos";

function Situacao({ o }: { o: OrcamentoLinha }) {
  const { t } = useI18n();
  return o.os ? (
    <span className="inline-flex h-6 items-center rounded-full bg-success-bg px-2.5 text-xs font-medium text-success">
      {t("Virou OS {n}", { n: docNumber(o.os.numero) })}
    </span>
  ) : (
    <span className="inline-flex h-6 items-center rounded-full bg-warning-bg px-2.5 text-xs font-medium text-warning">
      {t("Aguardando aceite")}
    </span>
  );
}

export function OrcamentosList({ linhas }: { linhas: OrcamentoLinha[] }) {
  const { t, fmt } = useI18n();
  const { date, money, relativeDays } = fmt;
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("aguardando");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const aguardando = linhas.filter((o) => !o.os);
  const aprovados = linhas.filter((o) => o.os);

  const list = useMemo(() => {
    const base = aba === "aguardando" ? aguardando : aba === "aprovados" ? aprovados : linhas;
    const term = normalize(q);
    const digits = q.replace(/\D/g, "");
    if (!term) return base;
    return base.filter(
      (o) =>
        normalize(`${o.cliente ?? ""} ${o.relato ?? ""}`).includes(term) ||
        (digits && String(o.numero).includes(String(Number(digits)))),
    );
  }, [aba, q, linhas, aguardando, aprovados]);

  const totalAguardando = aguardando.reduce((s, o) => s + o.valor_total, 0);

  function remove() {
    start(async () => {
      const r = await excluirOrcamentos([...selected]);
      if (!r.ok) return setError(t(r.error));
      setConfirm(false);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title={t("Orçamentos")}
        description={t("{n} aguardando aceite · {valor} em aberto", { n: aguardando.length, valor: money(totalAguardando) })}
        actions={
          <ButtonLink href="/orcamentos/novo" variant="cta" icon={<Plus />}>
            {t("Novo orçamento")}
          </ButtonLink>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <PillTabs
            value={aba}
            onChange={setAba}
            items={[
              { value: "aguardando", label: t("Aguardando aceite"), count: aguardando.length },
              { value: "aprovados", label: t("Viraram atendimento"), count: aprovados.length },
              { value: "todos", label: t("Todos"), count: linhas.length },
            ]}
          />
          <SearchInput value={q} onChange={setQ} placeholder={t("Cliente, relato ou nº")} className="w-full sm:w-72" />
        </div>

        {linhas.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t("Nenhum orçamento ainda")}
            description={t("Crie um orçamento e, quando o cliente aprovar, transforme em atendimento com um clique.")}
            action={
              <ButtonLink href="/orcamentos/novo" variant="dark" icon={<Plus />}>
                {t("Novo orçamento")}
              </ButtonLink>
            }
          />
        ) : list.length === 0 ? (
          <p className="px-4 pb-8 text-center text-sm text-ink-subtle">{t("Nenhum orçamento nesta lista.")}</p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {list.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted">
                <Checkbox
                  aria-label={t("Selecionar orçamento {n}", { n: docNumber(o.numero) })}
                  checked={selected.has(o.id)}
                  onChange={() => setSelected((s) => toggleId(s, o.id))}
                />
                <Link href={`/orcamentos/${o.id}`} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="w-16 font-mono text-xs text-ink-subtle">{docNumber(o.numero)}</span>
                  <span className="min-w-0 flex-1 basis-40">
                    <span className="block truncate font-medium">{o.cliente ?? t("Cliente não definido")}</span>
                    <span className="block truncate text-xs text-ink-subtle">{o.relato || t("Sem relato")}</span>
                  </span>
                  <Situacao o={o} />
                  <span className="w-24 text-right text-xs text-ink-subtle tabular-nums" title={date(o.data)}>
                    {relativeDays(o.data)}
                  </span>
                  <span className="w-24 text-right font-medium tabular-nums">{money(o.valor_total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} onDelete={() => setConfirm(true)} />
      </Card>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        pending={pending}
        title={selected.size === 1 ? t("Excluir orçamento?") : t("Excluir {n} orçamentos?", { n: selected.size })}
        description={
          <>
            {t("Os atendimentos que já foram criados a partir deles continuam salvos. Isso não pode ser desfeito.")}
            {error ? <span className="mt-2 block text-danger">{error}</span> : null}
          </>
        }
      />
    </>
  );
}
