import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes do Tailwind resolvendo conflitos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** R$ 1.250,00 */
export function formatBRL(value: number, options?: { noCents?: boolean }) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: options?.noCents ? 0 : 2,
    maximumFractionDigits: options?.noCents ? 0 : 2,
  }).format(value);
}

/** 00042 */
export function formatDocNumber(value: number) {
  return String(value).padStart(5, "0");
}

/** "Bom dia" / "Boa tarde" / "Boa noite", no horário de Brasília. */
export function greeting(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(date),
  );
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}
