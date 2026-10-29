"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, CircleHelp, CreditCard, LogOut, Moon, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/controls";
import { Popover } from "@/components/ui/popover";
import { initials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export type TopBarUser = { nome: string | null; email: string | null; fotoUrl: string | null };

export function Avatar({ user, size = 36 }: { user: TopBarUser; size?: number }) {
  return user.fotoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.fotoUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-ink"
      style={{ width: size, height: size }}
    >
      {initials(user.nome, user.email)}
    </span>
  );
}

const iconBtn =
  "relative inline-grid size-10 place-items-center rounded-full border border-border bg-surface text-ink-muted hover:bg-surface-muted hover:text-ink";

function ItemLink({ href, icon: Icon, children, onClick }: { href: string; icon: typeof UserRound; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-ink hover:bg-surface-muted lg:h-10"
    >
      <Icon className="size-4 text-ink-subtle" />
      {children}
    </Link>
  );
}

/** Lado direito da barra superior: ajuda, notificações e menu da conta. */
export function TopBarActions({ user, compact = false }: { user: TopBarUser; compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Popover
        label="Ajuda"
        trigger={({ toggle }) => (
          <button type="button" onClick={toggle} aria-label="Ajuda" className={cn(iconBtn, compact && "size-9")}>
            <CircleHelp className="size-4" />
          </button>
        )}
      >
        {() => (
          <div className="p-3">
            <p className="text-sm font-semibold">Central de ajuda</p>
            <p className="mt-1 text-[13px] text-ink-subtle">
              Em breve: perguntas frequentes e tutoriais sobre cada tela do app.
            </p>
          </div>
        )}
      </Popover>

      <Popover
        label="Notificações"
        trigger={({ toggle }) => (
          <button type="button" onClick={toggle} aria-label="Notificações" className={cn(iconBtn, compact && "size-9")}>
            <Bell className="size-4" />
          </button>
        )}
      >
        {() => (
          <div className="p-3">
            <p className="text-sm font-semibold">Notificações</p>
            <p className="mt-1 text-[13px] text-ink-subtle">Nenhuma notificação por enquanto.</p>
          </div>
        )}
      </Popover>

      <Popover
        label="Conta"
        trigger={({ toggle, open }) => (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label="Menu da conta"
            className={cn(
              "flex items-center gap-2.5 rounded-full text-left",
              compact ? "p-0" : "border border-border bg-surface py-1 pr-3 pl-1 hover:bg-surface-muted",
            )}
          >
            <Avatar user={user} size={compact ? 36 : 34} />
            {compact ? null : (
              <>
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-40 truncate text-sm font-semibold">{user.nome || "Minha conta"}</span>
                  <span className="block max-w-40 truncate text-xs text-ink-subtle">{user.email}</span>
                </span>
                <ChevronDown className="size-4 text-ink-subtle" />
              </>
            )}
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="flex items-center gap-3 border-b border-border px-3 pt-2 pb-3">
              <Avatar user={user} size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.nome || "Minha conta"}</p>
                <p className="truncate text-xs text-ink-subtle">{user.email}</p>
              </div>
            </div>
            <div className="py-1">
              <ItemLink href="/minha-conta" icon={UserRound} onClick={close}>
                Minha Conta
              </ItemLink>
              <ItemLink href="/meu-plano" icon={CreditCard} onClick={close}>
                Meu Plano
              </ItemLink>
              <div className="flex h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm font-medium lg:h-10">
                <span className="flex items-center gap-2.5">
                  <Moon className="size-4 text-ink-subtle" />
                  Modo escuro
                </span>
                <Switch checked={dark} onChange={(v) => setTheme(v ? "dark" : "light")} />
              </div>
            </div>
            <form action="/auth/signout" method="post" className="border-t border-border pt-1">
              <button
                type="submit"
                role="menuitem"
                className="flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger-bg lg:h-10"
              >
                <LogOut className="size-4" />
                Sair do aplicativo
              </button>
            </form>
          </>
        )}
      </Popover>
    </div>
  );
}
