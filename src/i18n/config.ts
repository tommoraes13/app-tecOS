export const LOCALES = ["pt-BR", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const CURRENCIES = ["BRL", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Preferências de exibição do usuário (Minha Conta). */
export type Prefs = { locale: Locale; currency: Currency; timeZone: string };

export const DEFAULT_PREFS: Prefs = { locale: "pt-BR", currency: "BRL", timeZone: "America/Sao_Paulo" };

/** Cookie com o idioma, para a tela de login (antes de entrar) e para responder rápido. */
export const LOCALE_COOKIE = "idioma";

export function normalizeLocale(v: string | null | undefined): Locale | null {
  if (!v) return null;
  const s = v.toLowerCase();
  if (s.startsWith("pt")) return "pt-BR";
  if (s.startsWith("en")) return "en";
  if (s.startsWith("es")) return "es";
  return null;
}

export function normalizeCurrency(v: string | null | undefined): Currency {
  return (CURRENCIES as readonly string[]).includes(v ?? "") ? (v as Currency) : "BRL";
}

export function validTimeZone(v: string | null | undefined) {
  if (!v) return DEFAULT_PREFS.timeZone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: v });
    return v;
  } catch {
    return DEFAULT_PREFS.timeZone;
  }
}

/** Idioma preferido pelo navegador (cabeçalho Accept-Language). */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  for (const part of (header ?? "").split(",")) {
    const l = normalizeLocale(part.split(";")[0]?.trim());
    if (l) return l;
  }
  return DEFAULT_PREFS.locale;
}
