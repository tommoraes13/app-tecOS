import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botões em pílula (Design System > Button).
 * cta = degradê verde, no máximo um por tela · dark = conclui formulários ·
 * outline = secundárias · ghost = cancelar · danger = excluir (claro) · dangerSolid = confirmar exclusão ·
 * success = concluir (Finalizar OS) · successSoft = ações positivas secundárias (WhatsApp, transformar).
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-medium whitespace-nowrap transition-[background-color,box-shadow,transform] duration-150 select-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        cta: "bg-brand-gradient text-on-brand shadow-cta hover:-translate-y-px",
        dark: "bg-action text-on-action hover:opacity-90",
        outline: "border-border bg-surface text-ink hover:bg-surface-muted",
        ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
        danger: "bg-danger-bg text-danger hover:opacity-90",
        dangerSolid: "bg-danger-solid text-white hover:opacity-90",
        success: "bg-brand-600 text-white hover:opacity-90",
        successSoft: "bg-success-bg text-success hover:opacity-90",
      },
      size: {
        md: "h-11 px-4 text-sm lg:h-10",
        sm: "h-8 px-3 text-[13px]",
      },
    },
    compoundVariants: [{ variant: "cta", size: "md", className: "pr-[18px] pl-1.5" }],
    defaultVariants: { variant: "outline", size: "md" },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

/** Bolinha branca com o ícone, usada dentro do botão de destaque. */
function CtaBubble({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-7 place-items-center rounded-full bg-on-brand text-brand-700">
      {children}
    </span>
  );
}

function Content({
  variant,
  icon,
  children,
}: {
  variant: ButtonVariantProps["variant"];
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      {icon ? variant === "cta" ? <CtaBubble>{icon}</CtaBubble> : icon : null}
      {children}
    </>
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  icon?: React.ReactNode;
}

export function Button({ className, variant, size, icon, children, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      <Content variant={variant} icon={icon}>
        {children}
      </Content>
    </button>
  );
}

export interface ButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "className">,
    ButtonVariantProps {
  className?: string;
  icon?: React.ReactNode;
}

export function ButtonLink({ className, variant, size, icon, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>
      <Content variant={variant} icon={icon}>
        {children}
      </Content>
    </Link>
  );
}

/** Botão só com ícone (fechar, navegar). Sempre com aria-label. */
export function IconButton({
  className,
  type,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string }) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-grid size-9 place-items-center rounded-md border border-border bg-surface text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}
