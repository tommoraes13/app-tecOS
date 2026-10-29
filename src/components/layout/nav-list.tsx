"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, secondaryNav, type NavItem } from "./nav-items";

const itemClass = "flex h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors lg:h-10";

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(itemClass, active ? "bg-action text-on-action" : "text-ink-muted hover:bg-surface-muted hover:text-ink")}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

/** Item com submenu (ex.: Cadastros). Abre sozinho quando você está numa das telas dele. */
function NavGroup({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const inside = pathname.startsWith(item.href);
  const [open, setOpen] = useState(inside);
  const Icon = item.icon;
  return (
    <div className={cn("rounded-lg", (open || inside) && "bg-surface-muted/60")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(itemClass, "w-full text-left", inside ? "text-ink" : "text-ink-muted hover:bg-surface-muted hover:text-ink")}
      >
        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="grid gap-0.5 pt-0.5 pr-1.5 pb-1.5 pl-9">
          {item.children?.map((c) => {
            const active = pathname === c.href || pathname.startsWith(`${c.href}/`);
            return (
              <Link
                key={c.href}
                href={c.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center rounded-md px-3 text-[13px] font-medium lg:h-9",
                  active ? "bg-action text-on-action" : "text-ink-muted hover:bg-surface hover:text-ink",
                )}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const render = (item: NavItem) =>
    item.children ? (
      <NavGroup key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
    ) : (
      <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
    );

  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-1">
      {mainNav.map(render)}
      <div className="mx-3 my-2 h-px bg-border" />
      {secondaryNav.map(render)}
    </nav>
  );
}
