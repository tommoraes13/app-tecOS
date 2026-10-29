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

/** Menu lateral. A Tabela de Preços entra quando for construída. */
export const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Minha Agenda", icon: CalendarDays },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/servicos", label: "Atendimentos", icon: Wrench },
  { href: "/clientes", label: "Clientes", icon: Users },
  {
    href: "/cadastros",
    label: "Cadastros",
    icon: FolderOpen,
    children: [
      { href: "/cadastros/servicos", label: "Cadastro de Serviços" },
      { href: "/cadastros/produtos", label: "Cadastro de Produtos" },
      { href: "/cadastros/templates", label: "Cadastro de Templates" },
    ],
  },
  { href: "/precificacao", label: "Precificação", icon: Tags },
];

export const secondaryNav: NavItem[] = [{ href: "/meu-negocio", label: "Meu Negócio", icon: Briefcase }];
