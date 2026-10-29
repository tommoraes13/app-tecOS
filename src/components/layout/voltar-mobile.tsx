"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Botão Voltar no fim dos formulários, só no celular: no app instalado no iPhone não há botão de voltar do navegador.
 * Sem página anterior, volta para o Dashboard.
 */
export function VoltarMobile({ className }: { className?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/dashboard"))}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-medium text-ink-muted sm:w-auto lg:hidden",
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      {t("Voltar")}
    </button>
  );
}
