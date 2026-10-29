import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trophy, Wrench } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { LinkTabs } from "@/components/ui/link-tabs";
import { StatCard } from "@/components/ui/stat-card";
import { metricas, PERIODOS, periodoValido, variacao } from "@/lib/dashboard";
import { StatusBadge } from "@/components/ui/status-badge";
import { getI18n } from "@/i18n/server";
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
  const [user, { t, fmt }, { data: negocio }, { data: oss }, { data: clientes }] = await Promise.all([
    getPerfil(),
    getI18n(),
    supabase.from("meu_negocio").select("nome_fantasia").maybeSingle(),
    supabase
      .from("base_atendimentos")
      .select("id, numero, cliente_id, status, data_inicio, data_entrega, valor_total, valor_recebido, recebido, data_recebimento, created_at")
      .order("data_inicio", { ascending: false })
      .order("numero", { ascending: false })
      .limit(5000),
    supabase.from("base_clientes").select("id, nome"),
  ]);
  const nomes = new Map((clientes ?? []).map((c) => [c.id, c.nome]));
  const ultimos = (oss ?? []).slice(0, 6);

  // Melhores clientes: quem mais gastou (soma das OS), com nº de atendimentos e último serviço.
  const porCliente = new Map<string, { total: number; qtd: number; ultimo: string }>();
  for (const o of oss ?? []) {
    if (!o.cliente_id) continue;
    const c = porCliente.get(o.cliente_id) ?? { total: 0, qtd: 0, ultimo: "" };
    c.total += Number(o.valor_total);
    c.qtd += 1;
    if (o.data_inicio > c.ultimo) c.ultimo = o.data_inicio;
    porCliente.set(o.cliente_id, c);
  }
  const melhores = [...porCliente.entries()]
    .map(([id, v]) => ({ id, nome: nomes.get(id) ?? t("Cliente"), ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const m = metricas(oss ?? [], periodo, fmt.today());
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
        title={`${saudacao}${nome ? `, ${nome}` : ""}!`}
        description={t("{inicio} a {fim}", { inicio: fmt.date(m.r.inicio), fim: fmt.date(m.r.fim) })}
        actions={
          <>
            <ButtonLink href="/orcamentos/novo" variant="outline">
              {t("Novo orçamento")}
            </ButtonLink>
            <ButtonLink href="/servicos/novo" variant="cta" icon={<Plus />}>
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
          value={money(m.aReceber, { noCents: m.aReceber >= 1000 })}
          rows={[{ label: m.aReceberQtd === 1 ? t("1 atendimento") : t("{n} atendimentos", { n: m.aReceberQtd }), value: "" }]}
        />
        <StatCard
          label={t("Atendimentos em aberto")}
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
                  <Link href={`/servicos/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {o.cliente_id ? (nomes.get(o.cliente_id) ?? t("Cliente")) : t("Cliente não definido")}
                      </span>
                      <span className="block text-xs text-ink-subtle">
                        <span className="font-mono">{t("OS {n}", { n: docNumber(o.numero) })}</span> · {date(o.data_inicio)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-medium tabular-nums">{money(o.valor_total)}</span>
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
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
                      <Link href={`/clientes?abrir=${c.id}`} className="flex items-center gap-3 font-medium hover:text-brand-ink">
                        <span className="grid size-6 place-items-center rounded-full bg-surface-muted text-xs text-ink-muted">{i + 1}</span>
                        {c.nome}
                      </Link>
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
                  <Link href={`/clientes?abrir=${c.id}`} className="flex items-center gap-3 px-4 py-3">
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
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
