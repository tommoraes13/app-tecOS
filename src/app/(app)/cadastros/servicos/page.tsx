import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";
import { duration } from "@/lib/format";
import { CatalogoServicos } from "./catalogo-servicos";
import { getI18n, pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Tabela de Preços");

export default async function CadastroServicosPage({ searchParams }: { searchParams: Promise<{ abrir?: string }> }) {
  const { abrir } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { t, fmt }] = await Promise.all([supabase.from("cadastro_servicos").select("*").order("nome"), getI18n()]);
  const servicos = data ?? [];

  // Números da tabela: média dos valores, média do tempo médio (só de quem tem tempo) e quantos serviços.
  const ticket = servicos.length ? servicos.reduce((s, x) => s + Number(x.valor), 0) / servicos.length : 0;
  const comTempo = servicos.filter((x) => x.tempo_medio_min);
  const tempo = comTempo.length ? Math.round(comTempo.reduce((s, x) => s + (x.tempo_medio_min ?? 0), 0) / comTempo.length) : 0;

  return (
    <>
      <PageHeader icon={ClipboardList} title={t("Tabela de Preços")} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:mb-6 lg:grid-cols-3 lg:gap-6">
        <StatCard label={t("Ticket médio")} value={fmt.money(ticket)} featured />
        <StatCard label={t("Tempo médio")} value={tempo ? duration(tempo) : "—"} />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label={t("Serviços cadastrados")} value={String(servicos.length)} />
        </div>
      </div>
      <CatalogoServicos key={abrir ?? ""} servicos={servicos} abrirId={abrir ?? null} />
    </>
  );
}
