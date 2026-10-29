import type { Prefs } from "./config";

/** Formatação de valores e datas conforme idioma, moeda e fuso do usuário. Datas do banco chegam como "AAAA-MM-DD". */
export function createFormat(prefs: Prefs) {
  const { locale, currency, timeZone } = prefs;
  const cur = new Intl.NumberFormat(locale, { style: "currency", currency });
  const curNoCents = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  const shortFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  const monthShortFmt = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const rel = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone });
  const isoToday = () => new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  const utc = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  const symbol =
    new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ??
    currency;

  return {
    prefs,
    currencySymbol: symbol,
    money(value: number | null | undefined, opts?: { noCents?: boolean }) {
      const v = Number(value ?? 0);
      return opts?.noCents ? curNoCents.format(Math.round(v)) : cur.format(v);
    },
    /** Número com 2 casas no padrão do idioma (para o campo de dinheiro). */
    decimal(value: number) {
      return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    number(value: number, maxDigits = 1) {
      return value.toLocaleString(locale, { maximumFractionDigits: maxDigits });
    },
    date(iso: string | null | undefined) {
      return iso ? dateFmt.format(utc(iso)) : "";
    },
    dateShort(iso: string) {
      return shortFmt.format(utc(iso)).replace(".", "");
    },
    monthName(month1to12: number) {
      const s = monthFmt.format(new Date(Date.UTC(2026, month1to12 - 1, 1)));
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    monthShort(iso: string) {
      return monthShortFmt.format(utc(iso)).replace(".", "");
    },
    /** Dom, Seg, Ter... começando no domingo */
    weekdaysShort() {
      return Array.from({ length: 7 }, (_, i) => {
        const s = weekdayFmt.format(new Date(Date.UTC(2026, 10, 1 + i))).replace(".", ""); // 01/11/2026 é domingo
        return s.charAt(0).toUpperCase() + s.slice(1);
      });
    },
    time(d: Date) {
      return timeFmt.format(d);
    },
    today: isoToday,
    /** "hoje", "ontem", "há 2 dias", "em 3 dias" */
    relativeDays(iso: string) {
      const diff = Math.round((utc(iso).getTime() - utc(isoToday()).getTime()) / 86_400_000);
      return rel.format(diff, "day");
    },
    /** Parte do dia no fuso do usuário, para a saudação. */
    dayPart(): "morning" | "afternoon" | "evening" {
      const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone }).format(new Date()));
      if (h >= 5 && h < 12) return "morning";
      if (h >= 12 && h < 18) return "afternoon";
      return "evening";
    },
  };
}

export type Fmt = ReturnType<typeof createFormat>;
