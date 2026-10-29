"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { NavList } from "./nav-list";
import { Wordmark } from "./wordmark";

/** Barra superior com menu hambúrguer, abaixo de 1024px (Design System > Sidebar). */
export function MobileNav({ actions }: { actions?: React.ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao trocar de tela.
  useEffect(() => setOpen(false), [pathname]);

  // Esc fecha e trava a rolagem do fundo enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("Abrir menu")}
          aria-expanded={open}
          className="inline-grid size-10 place-items-center rounded-md border border-border text-ink-muted"
        >
          <Menu className="size-5" />
        </button>
        <Wordmark className="text-lg" />
        <span className="flex-1" />
        {actions}
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t("Menu")}>
          <button
            type="button"
            aria-label={t("Fechar menu")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-overlay"
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col gap-3 rounded-r-xl bg-surface p-3 pt-4 shadow-pop">
            <div className="flex items-center justify-between px-1">
              <Wordmark className="px-2 text-lg" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("Fechar menu")}
                className="inline-grid size-10 place-items-center rounded-md text-ink-muted hover:bg-surface-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
