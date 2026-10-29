"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

function useCloseLabel() {
  return useI18n().t("Fechar");
}

function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
}

/**
 * Modal centralizado com fundo esmaecido (Design System > Modal).
 * No celular ocupa a tela inteira, com o rodapé fixo embaixo.
 */
export function Modal({
  open,
  onClose,
  title,
  overline,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  overline?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const titleId = useId();
  useOverlay(open, onClose);
  const closeLabel = useCloseLabel();
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6">
      <button type="button" aria-label={closeLabel} onClick={onClose} className="absolute inset-0 bg-overlay" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex h-dvh w-full flex-col bg-surface shadow-pop sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-xl",
          size === "sm" && "sm:max-w-[440px]",
          size === "md" && "sm:max-w-[640px]",
          size === "lg" && "sm:max-w-[760px]",
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2 sm:px-6">
          <div className="min-w-0">
            {overline ? <div className="font-mono text-xs text-ink-subtle">{overline}</div> : null}
            <h2 id={titleId} className="text-lg leading-[26px] font-semibold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-grid size-10 shrink-0 place-items-center rounded-md border border-border text-ink-muted hover:bg-surface-muted sm:size-9"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/** Painel de detalhes que abre pela direita (Design System > Drawer). No celular, tela cheia. */
export function Drawer({
  open,
  onClose,
  title,
  overline,
  headerActions,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  overline?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const titleId = useId();
  useOverlay(open, onClose);
  const closeLabel = useCloseLabel();
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end sm:p-3">
      <button type="button" aria-label={closeLabel} onClick={onClose} className="absolute inset-0 bg-overlay" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-dvh w-full flex-col bg-surface shadow-pop sm:h-auto sm:max-w-[440px] sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 pt-5 pb-3">
          <div className="min-w-0">
            {overline ? <div className="font-mono text-xs text-ink-subtle">{overline}</div> : null}
            <h2 id={titleId} className="mt-0.5 truncate text-lg leading-[26px] font-semibold">
              {title}
            </h2>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="inline-grid size-10 place-items-center rounded-md border border-border text-ink-muted hover:bg-surface-muted sm:size-9"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-4">{footer}</div> : null}
      </aside>
    </div>,
    document.body,
  );
}

/** Pede confirmação antes de uma ação que não dá para desfazer. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  pending?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-ink-muted hover:bg-surface-muted lg:h-10"
          >
            {t("Cancelar")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex h-11 items-center rounded-full bg-danger-solid px-4 text-sm font-medium text-white disabled:opacity-45 lg:h-10"
          >
            {pending ? t("Aguarde…") : (confirmLabel ?? t("Excluir"))}
          </button>
        </>
      }
    >
      <div className="text-sm text-ink-muted">{description}</div>
    </Modal>
  );
}
