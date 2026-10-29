"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_PREFS, type Prefs } from "./config";
import { createFormat, type Fmt } from "./format";
import { createT, type Dict, type T } from "./translate";

type Ctx = { t: T; fmt: Fmt; prefs: Prefs };

const I18nContext = createContext<Ctx>({ t: createT(null), fmt: createFormat(DEFAULT_PREFS), prefs: DEFAULT_PREFS });

export function I18nProvider({ prefs, dict, children }: { prefs: Prefs; dict: Dict | null; children: React.ReactNode }) {
  const value = useMemo(() => ({ t: createT(dict), fmt: createFormat(prefs), prefs }), [prefs, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** const { t, fmt } = useI18n(); t("Salvar") → "Save" em inglês. */
export function useI18n() {
  return useContext(I18nContext);
}
