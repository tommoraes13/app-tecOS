"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { EquipamentoModal } from "@/components/clientes/equipamento-modal";
import { SecretValue } from "@/components/clientes/secret-field";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/status-badge";
import { useI18n } from "@/i18n/client";
import { asSpecs, CAMPOS, secretKeys } from "@/lib/equipamentos";
import { docNumber } from "@/lib/format";
import { EQUIPAMENTO_LABEL, ESTADO_LABEL } from "@/lib/labels";
import { carregarEquipamento, type EquipamentoDetalhe } from "./actions";
import { LinhaLista, listaClass, Secao, vazioClass, ViewShell } from "./parts";
import type { ViewProps } from "./viewer";

/** Visualização do equipamento: ficha técnica, senhas (mascaradas) e serviços já feitos nele. */
export function EquipamentoView({ id, onClose, onBack, abrir }: ViewProps) {
  const { t, fmt } = useI18n();
  const router = useRouter();
  const [d, setD] = useState<EquipamentoDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);

  const carregar = useCallback(async () => {
    const r = await carregarEquipamento(id);
    if (r.ok) setD(r.data);
    else setErro(r.error);
  }, [id]);
  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (d && editando) {
    return (
      <EquipamentoModal
        open
        clienteId={d.equipamento.cliente_id}
        equipamento={d.equipamento}
        onClose={() => setEditando(false)}
        onSaved={() => {
          setEditando(false);
          void carregar();
          router.refresh();
        }}
        onDeleted={() => {
          if (onBack) onBack();
          else onClose();
          router.refresh();
        }}
      />
    );
  }

  const e = d?.equipamento;
  const specs = e ? asSpecs(e.especificacoes) : {};
  const secrets = new Set(e ? secretKeys(e.senhas) : []);
  const campos = e
    ? CAMPOS[e.tipo].filter((c) =>
        c.kind === "secret" ? secrets.has(c.key) : c.kind === "toggle" ? specs[c.key] === true : Boolean(specs[c.key]),
      )
    : [];
  const grupos = [...new Set(campos.map((c) => c.group ?? ""))];

  return (
    <ViewShell
      loading={!d && !erro}
      error={erro}
      onClose={onClose}
      onBack={onBack}
      size="md"
      title={e?.nome ?? t("Equipamento")}
      overline={e ? t(EQUIPAMENTO_LABEL[e.tipo]) : undefined}
      footer={
        <Button variant="dark" icon={<Pencil />} onClick={() => setEditando(true)}>
          {t("Editar")}
        </Button>
      }
    >
      {e && d ? (
        <>
          {d.cliente ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
              <span className="min-w-0">
                <span className="block text-xs text-ink-subtle">{t("Cliente")}</span>
                <span className="block truncate font-medium">{d.cliente.nome}</span>
              </span>
              <button
                type="button"
                onClick={() => d.cliente && abrir({ tipo: "cliente", id: d.cliente.id })}
                className="text-[13px] font-medium text-brand-ink"
              >
                {t("Ver cliente →")}
              </button>
            </div>
          ) : null}

          {e.estado_geral ? (
            <p className="text-[13px]">
              <Tag>{t(ESTADO_LABEL[e.estado_geral])}</Tag>
              {e.estado_detalhe ? <span className="ml-2 text-ink-muted">{e.estado_detalhe}</span> : null}
            </p>
          ) : null}

          {campos.length === 0 ? (
            <p className={vazioClass}>{t("Nenhum detalhe preenchido.")}</p>
          ) : (
            grupos.map((g) => (
              <Secao key={g} titulo={g ? t(g) : t("Detalhes")}>
                <dl className="grid grid-cols-[minmax(0,160px)_1fr] gap-x-3 gap-y-1.5 rounded-lg bg-surface-muted p-3 text-[13px]">
                  {campos
                    .filter((c) => (c.group ?? "") === g)
                    .map((c) => (
                      <div key={c.key} className="contents">
                        <dt className="text-ink-subtle">{t(c.label)}</dt>
                        <dd className="min-w-0 break-words">
                          {c.kind === "secret" ? (
                            <SecretValue equipamentoId={e.id} campo={c.key} />
                          ) : c.kind === "toggle" ? (
                            t("Sim")
                          ) : (
                            <span className={c.kind === "mono" ? "font-mono" : undefined}>
                              {c.kind === "select" ? t(String(specs[c.key])) : String(specs[c.key])}
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>
              </Secao>
            ))
          )}

          <Secao titulo={t("Serviços realizados")}>
            {d.historico.length === 0 ? (
              <p className={vazioClass}>{t("Nenhum serviço registrado neste equipamento.")}</p>
            ) : (
              <ul className={listaClass}>
                {d.historico.map((h, i) => (
                  <LinhaLista key={i} onClick={() => abrir({ tipo: "os", id: h.osId })}>
                    <span className="min-w-0 flex-1 truncate text-sm">{h.descricao}</span>
                    <span className="shrink-0 text-xs text-ink-subtle tabular-nums">
                      {h.numero ? <span className="font-mono">{t("OS {n}", { n: docNumber(h.numero) })}</span> : null}
                      {h.data ? ` · ${fmt.date(h.data)}` : ""}
                    </span>
                  </LinhaLista>
                ))}
              </ul>
            )}
          </Secao>
        </>
      ) : null}
    </ViewShell>
  );
}
