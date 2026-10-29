/** Formatos que não dependem do idioma. Dinheiro e datas ficam em src/i18n/format.ts (useI18n/getI18n). */

/** 01:30 */
export function duration(minutes: number | null | undefined) {
  const m = Math.max(0, Math.round(Number(minutes ?? 0)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** 00042 */
export function docNumber(n: number | null | undefined) {
  return String(n ?? 0).padStart(5, "0");
}

/** Hoje em "AAAA-MM-DD" no fuso informado (padrão: Brasília). Nas telas, prefira fmt.today(). */
export function todayISO(timeZone = "America/Sao_Paulo") {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

/** (11) 98123-4501 */
export function phone(v: string | null | undefined) {
  const d = onlyDigits(v ?? "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 01310-100 */
export function cep(v: string | null | undefined) {
  const d = onlyDigits(v ?? "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Link do WhatsApp a partir do telefone (assume Brasil). */
export function whatsappLink(v: string | null | undefined) {
  const d = onlyDigits(v ?? "");
  if (d.length < 10) return null;
  return `https://wa.me/${d.startsWith("55") ? d : `55${d}`}`;
}

/** Remove acentos e deixa minúsculo, para buscas tolerantes. */
export function normalize(v: string | null | undefined) {
  return (v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Soma meses a uma data "AAAA-MM-DD" (31/01 + 1 mês = 28 ou 29/02). */
export function addMonthsISO(iso: string, months: number) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}
