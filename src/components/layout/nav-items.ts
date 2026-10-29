import {
  Briefcase,
  CalendarDays,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Tags,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string }[];
};

/** Menu lateral, na ordem combinada com o dono. */
export const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/servicos", label: "Atendimentos", icon: Wrench },
  { href: "/agenda", label: "Minha Agenda", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  {
    href: "/cadastros",
    label: "Meu Catálogo",
    icon: FolderOpen,
    children: [
      { href: "/cadastros/servicos", label: "Serviços" },
      { href: "/cadastros/produtos", label: "Produtos" },
      { href: "/cadastros/templates", label: "Modelos" },
    ],
  },
  { href: "/precificacao", label: "Tabela de Preços", icon: Tags },
];

export const secondaryNav: NavItem[] = [{ href: "/meu-negocio", label: "Meu Negócio", icon: Briefcase }];
