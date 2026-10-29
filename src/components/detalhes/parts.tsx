"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Moldura comum das janelas de visualização: carregando, erro, botão Voltar e rodapé com ações. */
export function ViewShell({
  title,
  overline,
  loading,
  error,
  onClose,
  onBack,
  footer,
  children,
  size = "lg",
}: {
  title: string;
  overline?: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onBack?: () => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  size?: "md" | "lg";
}) {
  const { t } = useI18n();
  return (
    <Modal
      open
      onClose={onClose}
      size={size}
      title={title}
      overline={overline}
      footer={
        <>
          {onBack ? (
            <Button variant="ghost" icon={<ArrowLeft />} onClick={onBack} className="mr-auto">
              {t("Voltar")}
            </Button>
          ) : null}
          {loading || error ? null : footer}
        </>
      }
    >
      {loading ? (
        <p className="flex items-center gap-2 py-8 text-sm text-ink-subtle">
          <Loader2 className="size-4 animate-spin" /> {t("Carregando…")}
        </p>
      ) : error ? (
        <p className="py-8 text-sm text-danger">{t(error)}</p>
      ) : (
        <div className="grid gap-5">{children}</div>
      )}
    </Modal>
  );
}

export function Secao({ titulo, children, acao }: { titulo: string; children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** Caixinha cinza com um rótulo pequeno e um valor (Início, Entrega, Total…). */
export function Dado({ rotulo, children, className }: { rotulo: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid min-w-0 gap-0.5 rounded-lg bg-surface-muted p-3", className)}>
      <span className="text-xs text-ink-subtle">{rotulo}</span>
      <span className="min-w-0 truncate text-sm font-semibold tabular-nums">{children}</span>
    </div>
  );
}

/** Linha clicável de uma lista dentro da janela (abre outra janela). */
export function LinhaLista({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-muted">
        {children}
      </button>
    </li>
  );
}

export const listaClass = "divide-y divide-border overflow-hidden rounded-lg border border-border";
export const vazioClass = "text-[13px] text-ink-subtle";
