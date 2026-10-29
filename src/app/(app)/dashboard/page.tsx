import type { Metadata } from "next";
import Link from "next/link";
import { Moon, Plus, Sun, Sunset, Trophy, Wrench } from "lucide-react";
import { ViewerLink } from "@/components/detalhes/viewer";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { LinkTabs } from "@/components/ui/link-tabs";
import { StatCard } from "@/components/ui/stat-card";
import { intervalo, lerResumo, PERIODOS, periodoValido, variacao } from "@/lib/dashboard";
import { StatusBadge } from "@/components/ui/status-badge";
import { getI18n } from "@/i18n/server";
import { VALOR_COR } from "@/lib/status";
import { docNumber } from "@/lib/format";
import { getPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { GanhosChart } from "./ganhos-chart";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Dashboard") };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const periodo = periodoValido((await searchParams).periodo);
  const supabase = await createClient();
  const { t, fmt } = await getI18n();
  const r = intervalo(periodo, fmt.today());
  const porSemana = r.dias > 31;
  // Números e listas já calculados no banco: a tela não baixa todas as OS.
  const [user, { data: negocio }, resumo, { data: ultimosData }, { data: melhoresData }] = await Promise.all([
    getPerfil(),
    supabase.from("meu_negocio").select("nome_fantasia").maybeSingle(),
    supabase.rpc("dashboard_resumo", {
      p_inicio: r.inicio,
      p_fim: r.fim,
      p_ant_inicio: r.anteriorInicio,
      p_ant_fim: r.anteriorFim,
      p_semanal: porSemana,
    }),
    supabase
      .from("os_lista")
      .select("id, numero, cliente, status, data_inicio, valor_total")
      .order("data_inicio", { ascending: false })
      .order("numero", { ascending: false })
      .limit(6),
    supabase.rpc("melhores_clientes", { p_limite: 5 }),
  ]);
  const ultimos = (ultimosData ?? []).flatMap((o) =>
    o.id && o.status && o.data_inicio
      ? [{ id: o.id, numero: o.numero ?? 0, cliente: o.cliente, status: o.status, data_inicio: o.data_inicio, valor_total: o.valor_total ?? 0 }]
      : [],
  );
  const melhores = (melhoresData ?? []).map((c) => ({ ...c, total: Number(c.total) }));
  const m = { r, porSemana, ...lerResumo(resumo.data) };
  const nome =
    user?.nome ?? negocio?.nome_fantasia ?? user?.email?.split("@")[0];
  const real = variacao(m.realizados, m.realizadosAntes);
  const rec = variacao(m.recebido, m.recebidoAntes);
  const money = fmt.money;
  const date = fmt.date;
  const saudacao = { morning: t("Bom dia"), afternoon: t("Boa tarde"), evening: t("Boa noite") }[fmt.dayPart()];

  return (
    <>
      <PageHeader
        icon={{ morning: Sun, afternoon: Sunset, evening: Moon }[fmt.dayPart()]}
        title={`${saudacao}${nome ? `, ${nome}` : ""}!`}
        description={t("{inicio} a {fim}", { inicio: fmt.date(m.r.inicio), fim: fmt.date(m.r.fim) })}
        actionsClassName="w-full flex-nowrap sm:w-auto"
        actions={
          <>
            <ButtonLink href="/orcamentos/novo" variant="outline" className="flex-1 px-3 text-[13px] sm:flex-none sm:px-4 sm:text-sm lg:text-base">
              {t("Novo orçamento")}
            </ButtonLink>
            <ButtonLink href="/servicos/novo" variant="cta" icon={<Plus />} className="flex-1 text-[13px] sm:flex-none sm:text-sm">
              {t("Novo atendimento")}
            </ButtonLink>
          </>
        }
      />

      <LinkTabs
        active={periodo}
        items={PERIODOS.map((p) => ({
          value: p.value,
          label: t(p.label),
          href: p.value === "semana" ? "/dashboard" : `/dashboard?periodo=${p.value}`,
        }))}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
        <StatCard
          label={t("Serviços realizados")}
          value={String(m.realizados)}
          delta={real ?? undefined}
          rows={[{ label: t("Período anterior"), value: String(m.realizadosAntes) }]}
        />
        <StatCard
          label={t("Valor recebido")}
          value={money(m.recebido, { noCents: m.recebido >= 1000 })}
          delta={rec ?? undefined}
          rows={[{ label: t("Período anterior"), value: money(m.recebidoAntes, { noCents: m.recebidoAntes >= 1000 }) }]}
          featured
        />
        <StatCard
          label={t("Valores a receber")}
          valueClassName={m.aReceber > 0 ? "text-warning" : undefined}
          value={money(m.aReceber, { noCents: m.aReceber >= 1000 })}
          rows={[{ label: m.aReceberQtd === 1 ? t("1 atendimento") : t("{n} atendimentos", { n: m.aReceberQtd }), value: "" }]}
        />
        <StatCard
          label={t("Atendimentos em aberto")}
          valueClassName={m.emAberto > 0 ? "text-info" : undefined}
          value={String(m.emAberto)}
          rows={[{ label: t("Pendentes"), value: String(m.pendentes) }]}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("Ganhos")}
            description={t(m.porSemana ? "Valor recebido por semana · total {total}" : "Valor recebido por dia · total {total}", { total: money(m.recebido) })}
          />
          <div className="mt-2">
            <GanhosChart barras={m.barras} porSemana={m.porSemana} />
          </div>
        </Card>
        <Card>
          <CardHeader
            title={t("Últimos atendimentos")}
            actions={
              <Link href="/servicos" className="text-[13px] font-medium text-brand-ink">
                {t("Ver todos")}
              </Link>
            }
          />
          {ultimos.length === 0 ? (
            <EmptyState icon={Wrench} title={t("Nenhum atendimento ainda")} description={t("Os atendimentos mais recentes aparecem aqui.")} />
          ) : (
            <ul className="mt-3 divide-y divide-border border-t border-border">
              {ultimos.map((o) => (
                <li key={o.id}>
                  <ViewerLink tipo="os" id={o.id} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-muted">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {o.cliente ?? t("Cliente não definido")}
                      </span>
                      <span className="block text-xs text-ink-subtle">
                        <span className="font-mono">{t("OS {n}", { n: docNumber(o.numero) })}</span> · {date(o.data_inicio)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`text-sm font-semibold tabular-nums ${VALOR_COR[o.status]}`}>{money(o.valor_total)}</span>
                      <StatusBadge status={o.status} />
                    </span>
                  </ViewerLink>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title={t("Melhores clientes")} description={t("Quem mais contratou seus serviços")} />
        {melhores.length === 0 ? (
          <EmptyState icon={Trophy} title={t("Sem dados ainda")} description={t("Os clientes aparecem aqui conforme você registra atendimentos.")} />
        ) : (
          <>
            <table className="mt-3 hidden w-full text-sm md:table">
              <thead>
                <tr className="border-y border-border text-left text-xs text-ink-subtle">
                  <th className="px-5 py-2.5 font-medium">{t("Cliente")}</th>
                  <th className="px-5 py-2.5 text-right font-medium">{t("Atendimentos")}</th>
                  <th className="px-5 py-2.5 text-right font-medium">{t("Último serviço")}</th>
                  <th className="px-5 py-2.5 text-right font-medium">{t("Total gasto")}</th>
                </tr>
              </thead>
              <tbody>
                {melhores.map((c, i) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <ViewerLink tipo="cliente" id={c.id} className="flex items-center gap-3 text-left font-medium hover:text-brand-ink">
                        <span className="grid size-6 place-items-center rounded-full bg-surface-muted text-xs text-ink-muted">{i + 1}</span>
                        {c.nome}
                      </ViewerLink>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{c.qtd}</td>
                    <td className="px-5 py-3 text-right text-ink-muted tabular-nums">{date(c.ultimo)}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{money(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="mt-3 divide-y divide-border border-t border-border md:hidden">
              {melhores.map((c, i) => (
                <li key={c.id}>
                  <ViewerLink tipo="cliente" id={c.id} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-muted text-xs text-ink-muted">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.nome}</span>
                      <span className="block text-xs text-ink-subtle">
                        {c.qtd === 1 ? t("1 atendimento") : t("{n} atendimentos", { n: c.qtd })} · {t("último em {data}", { data: date(c.ultimo) })}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">{money(c.total)}</span>
                  </ViewerLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
