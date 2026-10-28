import {
  Briefcase,
  CalendarDays,
  CircleUser,
  FileText,
  LayoutDashboard,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Ordem do menu definida na Fase 1. A Tabela de Preços entra quando for construída. */
export const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Minha Agenda", icon: CalendarDays },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/servicos", label: "Serviços Prestados", icon: Wrench },
  { href: "/clientes", label: "Clientes", icon: Users },
];

export const secondaryNav: NavItem[] = [
  { href: "/meu-negocio", label: "Meu Negócio", icon: Briefcase },
  { href: "/minha-conta", label: "Minha Conta", icon: CircleUser },
];
