import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { T } from "@/i18n/translate";

const INCLUSO = [
  "Clientes, equipamentos e atendimentos ilimitados",
  "Orçamentos e transformação em OS",
  "PDF e mensagem para WhatsApp",
  "Agenda, dashboard e relatórios",
];

/** Aba Meu Plano (fase de testes: tudo liberado). */
export function PlanoCard({ t }: { t: T }) {
  return (
      <Card className="grid gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">{t("Gratuito")}</h2>
            <p className="text-[13px] text-ink-subtle">{t("Fase de testes")}</p>
          </div>
          <span className="inline-flex h-6 items-center rounded-full bg-success-bg px-2.5 text-xs font-medium text-success">
            {t("Ativo")}
          </span>
        </div>
        <ul className="grid gap-2 text-sm">
          {INCLUSO.map((i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="size-4 text-success" />
              {t(i)}
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-muted">
          {t(
            "Durante a fase de testes, todas as funções estão liberadas sem custo. O upgrade e o cancelamento ficam disponíveis aqui quando a cobrança for ativada.",
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium text-ink-muted opacity-60"
          >
            {t("Fazer upgrade (em breve)")}
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink-muted opacity-60"
          >
            {t("Cancelar conta (em breve)")}
          </button>
        </div>
      </Card>
  );
}
