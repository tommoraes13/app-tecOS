import type { Metadata } from "next";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getPerfil } from "@/lib/perfil";
import {
  DEFAULT_PREFS,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  normalizeCurrency,
  normalizeLocale,
  validTimeZone,
  type Prefs,
} from "./config";
import { createFormat } from "./format";
import { createT, loadDict } from "./translate";

/** Preferências do usuário logado; sem login, usa o cookie de idioma ou o idioma do navegador. */
export const getPrefs = cache(async (): Promise<Prefs> => {
  const perfil = await getPerfil();
  if (perfil) {
    return {
      locale: normalizeLocale(perfil.idioma) ?? DEFAULT_PREFS.locale,
      currency: normalizeCurrency(perfil.moeda),
      timeZone: validTimeZone(perfil.fuso),
    };
  }
  const jar = await cookies();
  const fromCookie = normalizeLocale(jar.get(LOCALE_COOKIE)?.value);
  const locale = fromCookie ?? localeFromAcceptLanguage((await headers()).get("accept-language"));
  return { ...DEFAULT_PREFS, locale };
});

/** Textos e formatação no idioma do usuário, para telas do servidor, ações, PDF e WhatsApp. */
export const getI18n = cache(async () => {
  const prefs = await getPrefs();
  const dict = await loadDict(prefs.locale);
  return { prefs, dict, t: createT(dict), fmt: createFormat(prefs) };
});

/** Título da aba do navegador traduzido: export const generateMetadata = pageTitle("Clientes"); */
export function pageTitle(key: string) {
  return async (): Promise<Metadata> => {
    const { t } = await getI18n();
    return { title: t(key) };
  };
}
