"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Feedback, Switch } from "@/components/ui/controls";
import { useI18n } from "@/i18n/client";
import { salvarSair24h } from "./actions";

/** Opção de segurança: sair sozinho 24 horas depois de entrar. */
export function Sair24hForm({ ligado: inicial }: { ligado: boolean }) {
  const { t } = useI18n();
  const [ligado, setLigado] = useState(inicial);
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function mudar(v: boolean) {
    setLigado(v);
    setErro(null);
    start(async () => {
      const r = await salvarSair24h(v);
      if (!r.ok) {
        setLigado(!v);
        setErro(t(r.error));
      }
    });
  }

  return (
    <Card className="grid gap-2 p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold">{t("Segurança")}</h2>
      <Switch checked={ligado} onChange={mudar} disabled={pending} label={t("Sair sozinho 24 horas depois de entrar")} />
      {erro ? <Feedback kind="error">{erro}</Feedback> : null}
    </Card>
  );
}
