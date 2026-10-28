import * as React from "react";
import { cn } from "@/lib/utils";

/** Campo de texto (Design System > Input). Altura 44px no celular, 40px no computador. */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-md border border-border-control bg-surface px-3 text-sm text-ink transition-[border-color,box-shadow] outline-none focus:border-focus-ring focus:shadow-[0_0_0_3px_var(--brand-100)] focus-visible:outline-none disabled:opacity-60 lg:h-10",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] leading-[18px] font-medium text-ink">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-subtle">{hint}</span>
      ) : null}
    </div>
  );
}
