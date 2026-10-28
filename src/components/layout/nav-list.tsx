"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav, secondaryNav, type NavItem } from "./nav-items";

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors lg:h-10",
        active ? "bg-action text-on-action" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-1">
      {mainNav.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
      ))}
      <div className="mx-3 my-2 h-px bg-border" />
      {secondaryNav.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
