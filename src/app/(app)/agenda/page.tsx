import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { VisitaItem } from "@/components/agenda/visita-item";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { carregarVisitas } from "@/lib/agenda";
import { addDaysISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { Calendario } from "./calendario";
import { getI18n, pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Minha Agenda");

function mesValido(m: string | undefined, hoje: string) {
  return m && /^\d{4}-\d{2}$/.test(m) ? m : hoje.slice(0, 7);
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ mes?: string; dias?: string }> }) {
  const [params, { t, fmt }] = await Promise.all([searchParams, getI18n()]);
  const hoje = fmt.today();
  const mes = mesValido(params.mes, hoje);
  const dias = [7, 15, 30, 90].includes(Number(params.dias)) ? Number(params.dias) : 30;

  // Mês do calendário, com a semana anterior e a seguinte para completar a grade.
  const inicioMes = `${mes}-01`;
  const [y, m] = mes.split("-").map(Number);
  const fimMes = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

  const supabase = await createClient();
  const [proximas, doMes] = await Promise.all([
    carregarVisitas(supabase, hoje, addDaysISO(hoje, dias - 1), 200),
    carregarVisitas(supabase, addDaysISO(inicioMes, -7), addDaysISO(fimMes, 7)),
  ]);

  return (
    <>
      <PageHeader
        icon={CalendarDays}
        title={t("Minha Agenda")}
        description={
          proximas.length === 1
            ? t("1 visita nos próximos {dias} dias", { dias })
            : t("{n} visitas nos próximos {dias} dias", { n: proximas.length, dias })
        }
        actions={
          <ButtonLink href="/servicos/novo" variant="cta" icon={<Plus />}>
            {t("Novo atendimento")}
          </ButtonLink>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        <Calendario key={mes} mes={mes} hoje={hoje} visitas={doMes} />

        <Card>
          <CardHeader
            title={t("Próximos atendimentos")}
            actions={
              <div className="flex gap-1">
                {[7, 15, 30, 90].map((d) => (
                  <Link
                    key={d}
                    href={`/agenda?mes=${mes}&dias=${d}`}
                    className={
                      d === dias
                        ? "rounded-full bg-action px-2.5 py-1 text-xs font-medium text-on-action"
                        : "rounded-full px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-surface-muted"
                    }
                  >
                    {t("{n} dias", { n: d })}
                  </Link>
                ))}
              </div>
            }
          />
          {proximas.length === 0 ? (
            <EmptyState icon={CalendarDays} title={t("Agenda livre")} description={t("Nenhuma visita técnica marcada neste período.")} />
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
