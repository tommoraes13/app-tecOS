"use client";

import { useI18n } from "@/i18n/client";
import type { Enums } from "@/lib/database.types";
import { CATEGORIA_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Cor de cada tipo de serviço (abas, etiquetas). */
export const CATEGORIA_COR: Record<Enums<"servico_categoria">, string> = {
  manutencao: "bg-info-bg text-info",
  diagnostico_revisao: "bg-teal-bg text-teal",
  montagem: "bg-orange-bg text-orange",
  configuracao: "bg-return-bg text-return",
  backup_recuperacao: "bg-pink-bg text-pink",
  consultoria: "bg-success-bg text-success",
  outros: "bg-neutral-bg text-neutral",
};

/** Etiqueta colorida do tipo de serviço. */
export function CategoriaTag({ categoria, className }: { categoria: Enums<"servico_categoria">; className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-sm px-2 text-xs font-medium whitespace-nowrap",
        CATEGORIA_COR[categoria],
        className,
      )}
    >
      {t(CATEGORIA_LABEL[categoria])}
    </span>
  );
}
