"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, Plus, Search, UserRound, type LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

const ITENS: { href: string; label: string; icon: LucideIcon; destaque?: boolean }[] = [
  { href: "/dashboard", label: "Início", icon: House },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/servicos/novo", label: "Novo atendimento", icon: Plus, destaque: true },
  { href: "/servicos", label: "Atendimentos", icon: Search },
  { href: "/minha-conta", label: "Conta", icon: UserRound },
];

/** Telas de formulário (OS e orçamento) têm a própria barra fixa no rodapé. */
const SEM_MENU = /^\/(servicos|orcamentos)\/[^/]+/;

/** Menu fixo no rodapé do celular: início, agenda, novo atendimento, atendimentos e conta. */
export function MenuRodape() {
  const { t } = useI18n();
  const pathname = usePathname();
  if (SEM_MENU.test(pathname)) return null;

  return (
    <nav
      aria-label={t("Menu rápido")}
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface px-2 pt-1.5 pb-[max(24px,calc(env(safe-area-inset-bottom)+10px))] shadow-pop lg:hidden"
    >
      {ITENS.map((item) => {
        const ativo = item.href === "/servicos" ? pathname === "/servicos" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        if (item.destaque) {
          return (
            <Link key={item.href} href={item.href} aria-label={t(item.label)} className="grid place-items-center">
              <span className="grid size-12 place-items-center rounded-full bg-brand-700 text-on-brand shadow-cta">
                <Icon className="size-6" strokeWidth={2.25} />
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={t(item.label)}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium",
              ativo ? "text-brand-ink" : "text-ink-subtle",
            )}
          >
            <Icon className="size-[22px]" strokeWidth={ativo ? 2.25 : 1.75} />
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
