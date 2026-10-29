"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HardDrive, Laptop, Monitor, Pencil, Printer, Router } from "lucide-react";
import type { Tables } from "@/lib/database.types";
import { asSpecs, CAMPOS, resumoEquipamento, secretKeys, type TipoEquipamento } from "@/lib/equipamentos";
import { useI18n } from "@/i18n/client";
import { docNumber } from "@/lib/format";
import { EQUIPAMENTO_CURTO, ESTADO_LABEL } from "@/lib/labels";
import { Tag } from "@/components/ui/status-badge";
import { SecretValue } from "./secret-field";

type Equipamento = Tables<"base_equipamentos">;
export type HistoricoItem = { descricao: string; numero: number | null; data: string | null };

const ICONS: Record<TipoEquipamento, typeof Monitor> = {
  desktop: Monitor,
  notebook: Laptop,
  rede: Router,
  impressora: Printer,
};

/** Ficha do equipamento no painel do cliente: resumo, detalhes, senhas e histórico de serviços. */
export function EquipamentoCard({
  equipamento,
  historico,
  onEdit,
}: {
  equipamento: Equipamento;
  historico: HistoricoItem[];
  onEdit: () => void;
}) {
  const { t, fmt } = useI18n();
  const [open, setOpen] = useState(false);
  const specs = asSpecs(equipamento.especificacoes);
  const secrets = new Set(secretKeys(equipamento.senhas));
  const Icon = ICONS[equipamento.tipo] ?? HardDrive;
  const campos = CAMPOS[equipamento.tipo].filter((c) =>
    c.kind === "secret" ? secrets.has(c.key) : c.kind === "toggle" ? true : Boolean(specs[c.key]),
  );

  return (
    <div className="rounded-lg bg-surface-muted">
      <div className="flex items-center gap-3 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-ink-muted">
          <Icon className="size-4" />
        </span>
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold">{equipamento.nome}</span>
          <span className="block truncate text-xs text-ink-subtle">
            {[t(EQUIPAMENTO_CURTO[equipamento.tipo]), resumoEquipamento(equipamento.tipo, specs, t)].filter(Boolean).join(" · ")}
          </span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={t("Editar {nome}", { nome: equipamento.nome })}
          className="inline-grid size-9 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? t("Recolher") : t("Ver detalhes")}
          className="inline-grid size-9 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink"
        >
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-border px-3 pt-3 pb-3">
          {equipamento.estado_geral ? (
            <p className="text-[13px]">
              <Tag>{t(ESTADO_LABEL[equipamento.estado_geral])}</Tag>
              {equipamento.estado_detalhe ? <span className="ml-2 text-ink-muted">{equipamento.estado_detalhe}</span> : null}
            </p>
          ) : null}

          {campos.length > 0 ? (
            <dl className="grid grid-cols-[minmax(0,140px)_1fr] gap-x-3 gap-y-1.5 text-[13px]">
              {campos.map((c) => (
                <div key={c.key} className="contents">
                  <dt className="text-ink-subtle">{t(c.label)}</dt>
                  <dd className="min-w-0 break-words">
                    {c.kind === "secret" ? (
                      <SecretValue equipamentoId={equipamento.id} campo={c.key} />
                    ) : c.kind === "toggle" ? (
                      specs[c.key] === true ? (
                        t("Sim")
                      ) : (
                        t("Não")
                      )
                    ) : (
                      <span className={c.kind === "mono" ? "font-mono" : undefined}>
                        {c.kind === "select" ? t(String(specs[c.key])) : String(specs[c.key])}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[13px] text-ink-subtle">{t("Nenhum detalhe preenchido.")}</p>
          )}

          <div>
            <h4 className="mb-1 text-xs font-semibold text-ink-muted">{t("Serviços realizados")}</h4>
            {historico.length === 0 ? (
              <p className="text-[13px] text-ink-subtle">{t("Nenhum serviço registrado neste equipamento.")}</p>
            ) : (
              <ul className="space-y-1 text-[13px]">
                {historico.map((h, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{h.descricao}</span>
                    <span className="shrink-0 text-ink-subtle tabular-nums">
                      {h.numero ? <span className="font-mono">{t("OS {n}", { n: docNumber(h.numero) })}</span> : null}
                      {h.data ? ` · ${fmt.date(h.data)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
