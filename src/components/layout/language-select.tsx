"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { definirIdioma } from "@/i18n/actions";
import { useI18n } from "@/i18n/client";
import { LOCALES, type Locale } from "@/i18n/config";

/** Nome de cada idioma escrito nele mesmo, para quem não lê o idioma atual. */
export const LOCALE_NAMES: Record<Locale, string> = { "pt-BR": "Português (Brasil)", en: "English", es: "Español" };

/** Seletor compacto de idioma (tela de login). */
export function LanguageSelect({ onChanged }: { onChanged?: (l: Locale) => void }) {
  const { t, prefs } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-3 text-[13px] text-ink-muted">
      <Languages className="size-4" />
      <span className="sr-only">{t("Idioma")}</span>
      <select
        value={prefs.locale}
        disabled={pending}
        onChange={(e) => {
          const l = e.target.value as Locale;
          start(async () => {
            await definirIdioma(l);
            onChanged?.(l);
            router.refresh();
          });
        }}
        className="bg-transparent text-ink outline-none"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
