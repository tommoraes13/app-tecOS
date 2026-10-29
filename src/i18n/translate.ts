import type { Locale } from "./config";

/** Dicionário de um idioma: o texto em português é a chave, o valor é a tradução. */
export type Dict = Record<string, string>;
export type Vars = Record<string, string | number>;
export type T = (key: string, vars?: Vars) => string;

/**
 * Cria a função t("Texto em português", { variavel }) para um idioma. Sem tradução, usa o português.
 * Quando a mesma palavra tem sentidos diferentes, a chave leva um contexto: "Claro@@tema".
 */
export function createT(dict: Dict | null): T {
  return (key, vars) => {
    const s = (dict && dict[key]) || key.split("@@")[0];
    return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
  };
}

export async function loadDict(locale: Locale): Promise<Dict | null> {
  if (locale === "en") return (await import("./messages/en")).default;
  if (locale === "es") return (await import("./messages/es")).default;
  return null;
}
