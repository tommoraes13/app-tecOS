import type { Metadata } from "next";
import { CalendarDays, LineChart, Plus } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatBRL, greeting } from "@/lib/utils";
import { PeriodTabs } from "./period-tabs";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const name = (user?.user_metadata?.name as string | undefined) ?? user?.email?.split("@")[0];

  return (
    <>
      <PageHeader
        title={`${greeting()}${name ? `, ${name}` : ""}!`}
        description="Resumo dos seus atendimentos no período."
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

      <PeriodTabs />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
        <StatCard label="Serviços realizados" value="0" rows={[{ label: "Período anterior", value: "0" }]} />
        <StatCard
          label="Valor recebido"
          value={formatBRL(0, { noCents: true })}
          rows={[{ label: "Período anterior", value: formatBRL(0, { noCents: true }) }]}
          featured
        />
        <StatCard label="Valores a receber" value={formatBRL(0, { noCents: true })} />
        <StatCard label="Atendimentos em aberto" value="0" rows={[{ label: "Pendentes", value: "0" }]} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Ganhos" description="Valor recebido por dia no período" />
          <EmptyState icon={LineChart} title="Sem dados ainda" description="O gráfico aparece quando houver atendimentos finalizados." />
        </Card>
        <Card>
          <CardHeader title="Próximos atendimentos" />
          <EmptyState icon={CalendarDays} title="Agenda livre" description="As próximas visitas técnicas aparecem aqui." />
        </Card>
      </div>
    </>
  );
}
