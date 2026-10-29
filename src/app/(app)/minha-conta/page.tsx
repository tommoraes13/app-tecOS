import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/supabase/server";
import { date } from "@/lib/format";
import { ContaForms } from "./conta-forms";

export const metadata: Metadata = { title: "Minha Conta" };

export default async function MinhaContaPage() {
  const user = await getCurrentUser();
  return (
    <>
      <PageHeader title="Minha Conta" description={user?.email ?? ""} />
      <div className="grid max-w-[720px] gap-6">
        <Card className="grid gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold">Meu plano</h2>
              <p className="text-[13px] text-ink-subtle">
                Conta criada em {user?.created_at ? date(user.created_at.slice(0, 10)) : "—"}
              </p>
            </div>
            <span className="inline-flex h-6 items-center rounded-full bg-success-bg px-2.5 text-xs font-medium text-success">
              Gratuito · fase de testes
            </span>
          </div>
          <p className="text-sm text-ink-muted">
            Durante a fase de testes, todas as funções estão liberadas sem custo. Os planos pagos, o upgrade e o
            cancelamento ficam disponíveis aqui quando a cobrança for ativada.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium text-ink-muted opacity-60"
            >
              Fazer upgrade (em breve)
            </button>
            <button
              type="button"
              disabled
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink-muted opacity-60"
            >
              Cancelar conta (em breve)
            </button>
          </div>
        </Card>
        <ContaForms />
      </div>
    </>
  );
}
