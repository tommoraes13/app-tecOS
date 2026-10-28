"use client";

import { useState } from "react";
import { PillTabs } from "@/components/ui/tabs";

type Period = "semana" | "7" | "15" | "30" | "90";

const items: { value: Period; label: string }[] = [
  { value: "semana", label: "Essa semana" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "15", label: "Últimos 15 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

/** Filtro de período do Dashboard. Ainda só visual: os números vêm na fase do banco. */
export function PeriodTabs() {
  const [period, setPeriod] = useState<Period>("semana");
  return <PillTabs items={items} value={period} onChange={setPeriod} />;
}
