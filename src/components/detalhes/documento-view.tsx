"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { excluirOrcamentos } from "@/app/(app)/orcamentos/actions";
import { excluirAtendimentos } from "@/app/(app)/servicos/actions";
import { PdfActions } from "@/components/documento/pdf-actions";
import { WhatsappButton } from "@/components/documento/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { useI18n } from "@/i18n/client";
import { addMonthsISO, docNumber, duration, phone } from "@/lib/format";
import { navegarComGuarda } from "@/lib/guarda-saida";
import type { PdfItem } from "@/lib/pdf/dados";
import { carregarDocumento, transformarOrcamento, type DocDetalhe } from "./actions";
import { Dado, Secao, ViewShell } from "./parts";
import type { ViewProps } from "./viewer";

/** Visualização da OS ou do orçamento: tudo o que foi preenchido, sem campos editáveis. */
export function DocumentoView({ tipo, id, onClose, onBack, abrir }: ViewProps & { tipo: "os" | "orcamento" }) {
  const { t, fmt } = useI18n();
  const { money, date } = fmt;
  const router = useRouter();
  const [d, setD] = useState<DocDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [pending, start] = useTransition();
  const isOS = tipo === "os";

  useEffect(() => {
    let vivo = true;
    void carregarDocumento(tipo, id).then((r) => {
      if (!vivo) return;
      if (r.ok) setD(r.data);
      else setErro(r.error);
    });
    return () => {
      vivo = false;
    };
  }, [tipo, id]);

  const editar = () => {
    onClose();
    navegarComGuarda(`${isOS ? "/servicos" : "/orcamentos"}/${id}`, router.push);
  };

  function excluir() {
    if (!confirmar) return setConfirmar(true);
    start(async () => {
      const r = isOS ? await excluirAtendimentos([id]) : await excluirOrcamentos([id]);
      if (!r.ok) return setAviso(t(r.error));
      onClose();
      router.refresh();
    });
  }

  function transformar() {
    start(async () => {
      const r = await transformarOrcamento(id);
      if (!r.ok) return setAviso(t(r.error));
      router.refresh();
      abrir({ tipo: "os", id: r.data.osId });
    });
  }

  const numero = d ? docNumber(d.numero) : "";
  const somaItens = (itens: PdfItem[]) => itens.reduce((a, i) => a + i.quantidade * i.valor_unitario, 0);

  return (
    <ViewShell
      loading={!d && !erro}
      error={erro}
      onClose={onClose}
      onBack={onBack}
      overline={d ? (isOS ? t("OS {n}", { n: numero }) : t("Orçamento {n}", { n: numero })) : undefined}
      title={d ? (d.cliente?.nome ?? t("Cliente não definido")) : isOS ? t("Ordem de serviço") : t("Orçamento")}
      footer={
        <>
          <Button variant="danger" onClick={excluir} disabled={pending} className={confirmar ? undefined : "mr-auto"}>
            {confirmar ? t("Confirmar exclusão") : t("Excluir")}
          </Button>
          {!isOS && d && !d.vinculo ? (
            <Button variant="outline" onClick={transformar} disabled={pending}>
              {t("Transformar em atendimento")}
            </Button>
          ) : null}
          <Button variant="dark" icon={<Pencil />} onClick={editar}>
            {t("Editar")}
          </Button>
        </>
      }
    >
      {d ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {isOS && d.status ? <StatusBadge status={d.status} suffix={fmt.relativeDays(d.data)} /> : null}
            {!isOS ? (
              d.vinculo ? (
                <button
                  type="button"
                  onClick={() => d.vinculo && abrir({ tipo: "os", id: d.vinculo.id })}
                  className="inline-flex h-6 items-center rounded-full bg-success-bg px-2.5 text-xs font-medium text-success"
                >
                  {t("Virou OS {n}", { n: docNumber(d.vinculo.numero) })} →
                </button>
              ) : (
                <span className="inline-flex h-6 items-center rounded-full bg-warning-bg px-2.5 text-xs font-medium text-warning">
                  {t("Aguardando aceite")}
                </span>
              )
            ) : d.vinculo ? (
              <button
                type="button"
                onClick={() => d.vinculo && abrir({ tipo: "orcamento", id: d.vinculo.id })}
                className="text-xs font-medium text-brand-ink"
              >
                {t("criado do orçamento {n}", { n: docNumber(d.vinculo.numero) })} →
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Dado rotulo={isOS ? t("Início") : t("Data")}>{date(d.data)}</Dado>
            {isOS ? <Dado rotulo={t("Entrega")}>{d.dataEntrega ? date(d.dataEntrega) : "—"}</Dado> : null}
            <Dado rotulo={t("Total")}>{money(d.total)}</Dado>
            {isOS ? (
              <Dado rotulo={t("Recebimento")}>
                {d.recebido ? money(d.recebido.valor) : t("Não recebido")}
                {d.recebido?.data ? <span className="block text-xs font-normal text-ink-subtle">{date(d.recebido.data)}</span> : null}
              </Dado>
            ) : (
              <Dado rotulo={t("Garantia")}>
                {d.garantiaMeses ? (d.garantiaMeses === 1 ? t("1 mês") : t("{n} meses", { n: d.garantiaMeses })) : t("Sem garantia")}
              </Dado>
            )}
          </div>

          {d.cliente ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">{d.cliente.nome}</span>
                <span className="block text-xs text-ink-subtle">{phone(d.cliente.telefone)}</span>
              </span>
              <button
                type="button"
                onClick={() => d.clienteId && abrir({ tipo: "cliente", id: d.clienteId })}
                className="text-[13px] font-medium text-brand-ink"
              >
                {t("Ver cliente →")}
              </button>
            </div>
          ) : null}

          {d.equipamentos.length ? (
            <Secao titulo={t("Equipamentos")}>
              <ul className="grid gap-1.5 text-sm">
                {d.equipamentos.map((e, i) => (
                  <li key={i} className="rounded-lg bg-surface-muted px-3 py-2">
                    <span className="font-medium">{e.nome}</span>
                    {e.detalhe ? <span className="block text-xs text-ink-subtle">{e.detalhe}</span> : null}
                  </li>
                ))}
              </ul>
            </Secao>
          ) : null}

          {d.relato ? (
            <Secao titulo={t("Relato do cliente")}>
              <p className="rounded-lg bg-surface-muted p-3 text-sm whitespace-pre-wrap">{d.relato}</p>
            </Secao>
          ) : null}

          {isOS && d.visitas.length ? (
            <Secao titulo={t("Visitas técnicas")}>
              <ul className="grid gap-1 text-sm">
                {d.visitas.map((v, i) => (
                  <li key={i} className="flex flex-wrap gap-x-2 text-ink-muted">
                    <span className="font-medium text-ink">{t("Visita {n}", { n: i + 1 })}</span>
                    <span className="tabular-nums">
                      {date(v.data)}
                      {v.hora ? ` · ${v.hora}` : ""}
                      {v.duracao_min ? ` · ${duration(v.duracao_min)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Secao>
          ) : null}

          <Itens titulo={t("Serviços")} itens={d.servicos} semValores={d.totalManual} />
          <Itens titulo={t("Produtos")} itens={d.produtos} semValores={d.totalManual} />

          <div className="ml-auto grid w-full max-w-xs gap-1.5 text-sm">
            {!d.totalManual ? (
              <>
                {d.servicos.length ? <Linha rotulo={t("Serviços")} valor={money(somaItens(d.servicos))} /> : null}
                {d.produtos.length ? <Linha rotulo={t("Produtos")} valor={money(somaItens(d.produtos))} /> : null}
                {d.visita !== null ? <Linha rotulo={t("Visita técnica")} valor={money(d.visita)} /> : null}
                {d.frete > 0 ? <Linha rotulo={t("Frete")} valor={money(d.frete)} /> : null}
                {d.desconto > 0 ? (
                  <Linha
                    rotulo={`${t("Desconto")}${d.descontoPct ? ` (${fmt.number(d.descontoPct, 2)}%)` : ""}`}
                    valor={`− ${money(d.desconto)}`}
                  />
                ) : null}
              </>
            ) : null}
            <div className="flex items-baseline justify-between gap-2 border-t border-border pt-2">
              <span className="font-semibold">{t("Total")}</span>
              <span className="text-xl font-semibold tabular-nums">{money(d.total)}</span>
            </div>
            {isOS && d.garantiaMeses ? (
              <p className="text-xs text-ink-subtle">
                {d.dataEntrega
                  ? t("Garantia: {meses}, até {data}", {
                      meses: d.garantiaMeses === 1 ? t("1 mês") : t("{n} meses", { n: d.garantiaMeses }),
                      data: date(addMonthsISO(d.dataEntrega, d.garantiaMeses)),
                    })
                  : t("Garantia: {meses} a partir da entrega", {
                      meses: d.garantiaMeses === 1 ? t("1 mês") : t("{n} meses", { n: d.garantiaMeses }),
                    })}
              </p>
            ) : null}
          </div>

          {d.observacoes ? (
            <Secao titulo={t("Observações")}>
              <p className="text-sm whitespace-pre-wrap text-ink-muted">{d.observacoes}</p>
            </Secao>
          ) : null}

          <div className="grid gap-2">
            <PdfActions tipo={tipo} id={id} numero={d.numero} />
            <WhatsappButton tipo={tipo} id={id} />
          </div>

          {aviso ? <Feedback kind="error">{aviso}</Feedback> : null}
          {confirmar ? (
            <Feedback kind="error">
              {isOS
                ? t("Os serviços, produtos e visitas deste atendimento também serão apagados. Isso não pode ser desfeito.")
                : t("Se este orçamento já virou atendimento, a OS continua salva. Isso não pode ser desfeito.")}
            </Feedback>
          ) : null}
        </>
      ) : null}
    </ViewShell>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-2 text-ink-muted">
      {rotulo}
      <span className="font-medium text-ink tabular-nums">{valor}</span>
    </div>
  );
}

function Itens({ titulo, itens, semValores }: { titulo: string; itens: PdfItem[]; semValores: boolean }) {
  const { t, fmt } = useI18n();
  if (itens.length === 0) return null;
  return (
    <Secao titulo={titulo}>
      <ul className="divide-y divide-border rounded-lg border border-border text-sm">
        {itens.map((i, k) => (
          <li key={k} className="flex items-start gap-3 px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block">{i.descricao}</span>
              {i.equipamento ? <span className="block text-xs text-ink-subtle">{i.equipamento}</span> : null}
            </span>
            <span className="shrink-0 text-right tabular-nums">
              {i.quantidade !== 1 ? (
                <span className="block text-xs text-ink-subtle">
                  {fmt.number(i.quantidade, 2)} × {semValores ? "" : fmt.money(i.valor_unitario)}
                </span>
              ) : null}
              {semValores ? null : <span className="block font-medium">{fmt.money(i.quantidade * i.valor_unitario)}</span>}
            </span>
          </li>
        ))}
      </ul>
      {semValores ? <p className="text-xs text-ink-subtle">{t("Total definido manualmente: os itens aparecem sem valores.")}</p> : null}
    </Secao>
  );
}
