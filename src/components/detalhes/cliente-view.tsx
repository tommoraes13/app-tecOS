"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, HardDrive, Laptop, Mail, MapPin, MessageCircle, Monitor, Pencil, Phone, Plus, Printer, Router, Wrench } from "lucide-react";
import { excluirClientes } from "@/app/(app)/clientes/actions";
import { ClienteModal } from "@/components/clientes/cliente-modal";
import { EquipamentoModal } from "@/components/clientes/equipamento-modal";
import { Button, ButtonLink } from "@/components/ui/button";
import { Feedback } from "@/components/ui/controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { useI18n } from "@/i18n/client";
import type { Tables } from "@/lib/database.types";
import { asSpecs, resumoEquipamento, type TipoEquipamento } from "@/lib/equipamentos";
import { cep, docNumber, phone, whatsappLink } from "@/lib/format";
import { CANAL_LABEL, EQUIPAMENTO_CURTO } from "@/lib/labels";
import { carregarCliente, type ClienteDetalhe } from "./actions";
import { LinhaLista, listaClass, Secao, vazioClass, ViewShell } from "./parts";
import type { ViewProps } from "./viewer";

export const ICONE_EQUIPAMENTO: Record<TipoEquipamento, typeof Monitor> = {
  desktop: Monitor,
  notebook: Laptop,
  rede: Router,
  impressora: Printer,
};

function toCliente(r: Tables<"clientes_resumo">): Tables<"base_clientes"> {
  return {
    id: r.id ?? "",
    user_id: r.user_id ?? "",
    nome: r.nome ?? "",
    telefone: r.telefone ?? "",
    email: r.email,
    canal: r.canal,
    cep: r.cep,
    endereco: r.endereco,
    numero: r.numero,
    complemento: r.complemento,
    bairro: r.bairro,
    cidade: r.cidade,
    estado: r.estado,
    observacoes: r.observacoes,
    created_at: r.created_at ?? "",
    updated_at: r.updated_at ?? "",
  };
}

/** Visualização do cliente: contato, equipamentos, atendimentos e orçamentos. */
export function ClienteView({ id, onClose, onBack, abrir }: ViewProps) {
  const { t, fmt } = useI18n();
  const { money, date } = fmt;
  const router = useRouter();
  const [d, setD] = useState<ClienteDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [novoEquip, setNovoEquip] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [pending, start] = useTransition();

  const carregar = useCallback(async () => {
    const r = await carregarCliente(id);
    if (r.ok) setD(r.data);
    else setErro(r.error);
  }, [id]);
  useEffect(() => {
    void carregar();
  }, [carregar]);

  function excluir() {
    if (!confirmar) return setConfirmar(true);
    start(async () => {
      const r = await excluirClientes([id]);
      if (!r.ok) return setAviso(t(r.error));
      onClose();
      router.refresh();
    });
  }

  // Edição do cliente e cadastro de equipamento abrem no lugar da visualização.
  if (d && editando) {
    return (
      <ClienteModal
        open
        cliente={toCliente(d.cliente)}
        onClose={() => setEditando(false)}
        onSaved={() => {
          setEditando(false);
          void carregar();
          router.refresh();
        }}
      />
    );
  }
  if (d && novoEquip) {
    return (
      <EquipamentoModal
        open
        clienteId={id}
        onClose={() => setNovoEquip(false)}
        onSaved={() => {
          setNovoEquip(false);
          void carregar();
        }}
      />
    );
  }

  const c = d?.cliente;
  const wa = c ? whatsappLink(c.telefone) : null;
  const endereco = c
    ? [
        [c.endereco, c.numero].filter(Boolean).join(", "),
        c.complemento,
        c.bairro,
        [c.cidade, c.estado].filter(Boolean).join("/"),
        c.cep ? cep(c.cep) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const qtd = c?.servicos_prestados ?? 0;

  return (
    <ViewShell
      loading={!d && !erro}
      error={erro}
      onClose={onClose}
      onBack={onBack}
      size="md"
      title={c?.nome ?? t("Cliente")}
      overline={c ? (qtd === 1 ? t("1 serviço prestado") : t("{n} serviços prestados", { n: qtd })) : undefined}
      footer={
        <>
          <Button variant="danger" onClick={excluir} disabled={pending} className={confirmar ? undefined : "mr-auto"}>
            {confirmar ? t("Confirmar exclusão") : t("Excluir")}
          </Button>
          <ButtonLink href={`/servicos/novo?cliente=${id}`} variant="outline" onClick={onClose}>
            {t("Novo atendimento")}
          </ButtonLink>
          <Button variant="dark" icon={<Pencil />} onClick={() => setEditando(true)}>
            {t("Editar")}
          </Button>
        </>
      }
    >
      {c && d ? (
        <>
          <div className="grid gap-2 rounded-lg bg-surface-muted p-3 text-sm">
            <a href={`tel:${c.telefone}`} className="flex items-center gap-2">
              <Phone className="size-4 text-ink-subtle" />
              {phone(c.telefone)}
            </a>
            {wa ? (
              <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-medium text-brand-ink">
                <MessageCircle className="size-4" />
                {t("Conversar no WhatsApp")}
              </a>
            ) : null}
            {c.email ? (
              <a href={`mailto:${c.email}`} className="flex items-center gap-2 break-all">
                <Mail className="size-4 shrink-0 text-ink-subtle" />
                {c.email}
              </a>
            ) : null}
            {endereco ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
                <span>{endereco}</span>
              </p>
            ) : null}
            {c.canal ? <p className="text-xs text-ink-subtle">{t("Canal: {canal}", { canal: t(CANAL_LABEL[c.canal]) })}</p> : null}
          </div>

          {c.observacoes ? (
            <Secao titulo={t("Observações")}>
              <p className="text-sm whitespace-pre-wrap text-ink-muted">{c.observacoes}</p>
            </Secao>
          ) : null}

          <Secao
            titulo={t("Equipamentos")}
            acao={
              <Button variant="outline" size="sm" icon={<Plus />} onClick={() => setNovoEquip(true)}>
                {t("Adicionar")}
              </Button>
            }
          >
            {d.equipamentos.length === 0 ? (
              <p className={vazioClass}>{t("Nenhum equipamento cadastrado.")}</p>
            ) : (
              <ul className={listaClass}>
                {d.equipamentos.map((e) => {
                  const Icon = ICONE_EQUIPAMENTO[e.tipo] ?? HardDrive;
                  const resumo = resumoEquipamento(e.tipo, asSpecs(e.especificacoes), t);
                  return (
                    <LinhaLista key={e.id} onClick={() => abrir({ tipo: "equipamento", id: e.id })}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-muted text-ink-muted">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{e.nome}</span>
                        <span className="block truncate text-xs text-ink-subtle">
                          {[t(EQUIPAMENTO_CURTO[e.tipo]), resumo].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </LinhaLista>
                  );
                })}
              </ul>
            )}
          </Secao>

          <Secao titulo={t("Atendimentos")}>
            {d.atendimentos.length === 0 ? (
              <p className={vazioClass}>{t("Nenhum atendimento ainda.")}</p>
            ) : (
              <ul className={listaClass}>
                {d.atendimentos.map((o) => (
                  <LinhaLista key={o.id} onClick={() => abrir({ tipo: "os", id: o.id })}>
                    <Wrench className="size-4 shrink-0 text-ink-subtle" />
                    <span className="font-mono text-xs text-ink-subtle">{t("OS {n}", { n: docNumber(o.numero) })}</span>
                    <span className="min-w-0 flex-1">
                      <StatusBadge status={o.status} />
                    </span>
                    <span className="text-right text-xs">
                      <span className="block font-medium tabular-nums">{money(o.valor_total)}</span>
                      <span className="block text-ink-subtle tabular-nums">{date(o.data_inicio)}</span>
                    </span>
                  </LinhaLista>
                ))}
              </ul>
            )}
          </Secao>

          <Secao titulo={t("Orçamentos")}>
            {d.orcamentos.length === 0 ? (
              <p className={vazioClass}>{t("Nenhum orçamento ainda.")}</p>
            ) : (
              <ul className={listaClass}>
                {d.orcamentos.map((o) => (
                  <LinhaLista key={o.id} onClick={() => abrir({ tipo: "orcamento", id: o.id })}>
                    <FileText className="size-4 shrink-0 text-ink-subtle" />
                    <span className="flex-1 font-mono text-xs text-ink-subtle">{t("ORC {n}", { n: docNumber(o.numero) })}</span>
                    <span className="text-xs text-ink-subtle tabular-nums">{date(o.data)}</span>
                    <span className="text-xs font-medium tabular-nums">{money(o.valor_total)}</span>
                  </LinhaLista>
                ))}
              </ul>
            )}
          </Secao>

          {aviso ? <Feedback kind="error">{aviso}</Feedback> : null}
          {confirmar ? (
            <Feedback kind="error">
              {qtd > 0
                ? `${t("Os {n} atendimentos e os orçamentos continuam salvos, com o cliente como “Não definido”.", { n: qtd })} `
                : ""}
              {t("Os equipamentos cadastrados deste cliente serão apagados. Isso não pode ser desfeito.")}
            </Feedback>
          ) : null}
        </>
      ) : null}
    </ViewShell>
  );
}
