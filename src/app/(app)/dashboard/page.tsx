import type { Metadata } from "next";
import { CalendarDays, LineChart, Plus } from "lucide-react";
import { VisitaItem } from "@/components/agenda/visita-item";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { LinkTabs } from "@/components/ui/link-tabs";
import { StatCard } from "@/components/ui/stat-card";
import { carregarVisitas } from "@/lib/agenda";
import { metricas, PERIODOS, periodoValido, variacao } from "@/lib/dashboard";
import { addDaysISO, date, money, todayISO } from "@/lib/format";
import { getPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { greeting } from "@/lib/utils";
import { GanhosChart } from "./ganhos-chart";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const periodo = periodoValido((await searchParams).periodo);
  const supabase = await createClient();
  const hoje = todayISO();

  const [user, { data: negocio }, { data: oss }, proximas] = await Promise.all([
    getPerfil(),
    supabase.from("meu_negocio").select("nome_fantasia").maybeSingle(),
    supabase
      .from("base_atendimentos")
      .select("status, data_inicio, data_entrega, valor_total, valor_recebido, recebido, data_recebimento")
      .limit(5000),
    carregarVisitas(supabase, hoje, addDaysISO(hoje, 30), 5),
  ]);

  const m = metricas(oss ?? [], periodo);
  const nome =
    user?.nome ?? negocio?.nome_fantasia ?? user?.email?.split("@")[0];
  const temGanhos = m.barras.some((b) => b.valor > 0);
  const real = variacao(m.realizados, m.realizadosAntes);
  const rec = variacao(m.recebido, m.recebidoAntes);

  return (
    <>
      <PageHeader
        title={`${greeting()}${nome ? `, ${nome}` : ""}!`}
        description={`${date(m.r.inicio)} a ${date(m.r.fim)}`}
        actions={
          <>
            <ButtonLink href="/orcamentos/novo" variant="outline">
              Novo orçamento
            </ButtonLink>
            <ButtonLink href="/servicos/novo" variant="cta" icon={<Plus />}>
              Novo atendimento
            </ButtonLink>
          </>
        }
      />

      <LinkTabs
        active={periodo}
        items={PERIODOS.map((p) => ({
          value: p.value,
          label: p.label,
          href: p.value === "semana" ? "/dashboard" : `/dashboard?periodo=${p.value}`,
        }))}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
        <StatCard
          label="Serviços realizados"
          value={String(m.realizados)}
          delta={real ?? undefined}
          rows={[{ label: "Período anterior", value: String(m.realizadosAntes) }]}
        />
        <StatCard
          label="Valor recebido"
          value={money(m.recebido, { noCents: m.recebido >= 1000 })}
          delta={rec ?? undefined}
          rows={[{ label: "Período anterior", value: money(m.recebidoAntes, { noCents: m.recebidoAntes >= 1000 }) }]}
          featured
        />
        <StatCard
          label="Valores a receber"
          value={money(m.aReceber, { noCents: m.aReceber >= 1000 })}
          rows={[{ label: m.aReceberQtd === 1 ? "1 atendimento" : `${m.aReceberQtd} atendimentos`, value: "" }]}
        />
        <StatCard
          label="Atendimentos em aberto"
          value={String(m.emAberto)}
          rows={[{ label: "Pendentes", value: String(m.pendentes) }]}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Ganhos"
            description={`Valor recebido por ${m.porSemana ? "semana" : "dia"} · total ${money(m.recebido)}`}
          />
          {temGanhos ? (
            <div className="mt-2">
              <GanhosChart barras={m.barras} porSemana={m.porSemana} />
            </div>
          ) : (
            <EmptyState
              icon={LineChart}
              title="Nenhum recebimento no período"
              description="O gráfico aparece quando houver atendimentos com valor recebido."
            />
          )}
        </Card>
        <Card>
          <CardHeader title="Próximos atendimentos" />
          {proximas.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Agenda livre" description="As próximas visitas técnicas aparecem aqui." />
          ) : (
            <div className="mt-3 divide-y divide-border border-t border-border">
              {proximas.map((v) => (
                <VisitaItem key={v.id} v={v} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
