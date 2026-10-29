/** Formatação no padrão brasileiro. Datas do banco chegam como "AAAA-MM-DD". */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlNoCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function money(value: number | null | undefined, opts?: { noCents?: boolean }) {
  const v = Number(value ?? 0);
  return opts?.noCents ? brlNoCents.format(Math.round(v)) : brl.format(v);
}

/** 28/10/2026 */
export function date(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** 28 out */
export function dateShort(iso: string) {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${Number(d)} ${months[Number(m) - 1] ?? ""}`;
}

/** 01:30 */
export function duration(minutes: number | null | undefined) {
  const m = Math.max(0, Math.round(Number(minutes ?? 0)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** 00042 */
export function docNumber(n: number | null | undefined) {
  return String(n ?? 0).padStart(5, "0");
}

/** Hoje em "AAAA-MM-DD", no horário de Brasília. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "há 2 dias", "hoje", "em 3 dias" */
export function relativeDays(iso: string) {
  const today = todayISO();
  const diff = Math.round(
    (Date.parse(`${iso.slice(0, 10)}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000,
  );
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  return diff < 0 ? `há ${-diff} dias` : `em ${diff} dias`;
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
