"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Mail, MapPin, MessageCircle, Phone, Plus, Wrench } from "lucide-react";
import { EquipamentoCard, type HistoricoItem } from "@/components/clientes/equipamento-card";
import { EquipamentoModal } from "@/components/clientes/equipamento-modal";
import { Button, ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Tables } from "@/lib/database.types";
import { useI18n } from "@/i18n/client";
import { cep, docNumber, phone, whatsappLink } from "@/lib/format";
import { CANAL_LABEL } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import { toCliente, type ClienteResumo } from "./clientes-list";

type Equipamento = Tables<"base_equipamentos">;
type OsResumo = Pick<Tables<"base_atendimentos">, "id" | "numero" | "status" | "data_inicio" | "valor_total">;
type OrcResumo = Pick<Tables<"base_orcamentos">, "id" | "numero" | "data" | "valor_total">;

export function ClienteDrawer({
  cliente,
  onClose,
  onEdit,
  onDelete,
}: {
  cliente: ClienteResumo | null;
  onClose: () => void;
  onEdit: (c: Tables<"base_clientes">) => void;
  onDelete: (id: string) => void;
}) {
  const { t, fmt } = useI18n();
  const { date, money } = fmt;
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [historico, setHistorico] = useState<Record<string, HistoricoItem[]>>({});
  const [atendimentos, setAtendimentos] = useState<OsResumo[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcResumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [equipModal, setEquipModal] = useState<{ equipamento: Equipamento | null } | null>(null);

  const id = cliente?.id ?? null;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const supabase = createClient();
    const [eq, os, orc] = await Promise.all([
      supabase.from("base_equipamentos").select("*").eq("cliente_id", id).order("nome"),
      supabase
        .from("base_atendimentos")
        .select("id, numero, status, data_inicio, valor_total")
        .eq("cliente_id", id)
        .order("data_inicio", { ascending: false })
        .limit(10),
      supabase
        .from("base_orcamentos")
        .select("id, numero, data, valor_total")
        .eq("cliente_id", id)
        .order("data", { ascending: false })
        .limit(10),
    ]);
    const equips = eq.data ?? [];
    setEquipamentos(equips);
    setAtendimentos(os.data ?? []);
    setOrcamentos(orc.data ?? []);

    // Histórico de serviços de cada equipamento.
    const hist: Record<string, HistoricoItem[]> = {};
    if (equips.length > 0) {
      const { data: itens } = await supabase
        .from("os_servicos")
        .select("descricao, equipamento_id, os_id")
        .in(
          "equipamento_id",
          equips.map((e) => e.id),
        );
      const osIds = [...new Set((itens ?? []).map((i) => i.os_id))];
      const { data: oss } = osIds.length
        ? await supabase.from("base_atendimentos").select("id, numero, data_inicio").in("id", osIds)
        : { data: [] as { id: string; numero: number; data_inicio: string }[] };
      const byId = new Map((oss ?? []).map((o) => [o.id, o]));
      for (const i of itens ?? []) {
        if (!i.equipamento_id) continue;
        const o = byId.get(i.os_id);
        (hist[i.equipamento_id] ??= []).push({
          descricao: i.descricao,
          numero: o?.numero ?? null,
          data: o?.data_inicio ?? null,
        });
      }
      for (const k of Object.keys(hist)) hist[k].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
    }
    setHistorico(hist);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setEquipamentos([]);
    setAtendimentos([]);
    setOrcamentos([]);
    setHistorico({});
    void load();
  }, [load]);

  if (!cliente || !id) return null;

  const wa = whatsappLink(cliente.telefone);
  const endereco = [
    [cliente.endereco, cliente.numero].filter(Boolean).join(", "),
    cliente.complemento,
    cliente.bairro,
    [cliente.cidade, cliente.estado].filter(Boolean).join("/"),
    cliente.cep ? cep(cliente.cep) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={cliente.nome ?? ""}
        overline={cliente.servicos_prestados === 1 ? t("1 serviço prestado") : t("{n} serviços prestados", { n: cliente.servicos_prestados ?? 0 })}
        footer={
          <>
            <Button variant="danger" size="sm" onClick={() => onDelete(id)}>
              {t("Excluir")}
            </Button>
            <span className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => onEdit(toCliente(cliente))}>
              {t("Editar")}
            </Button>
            <ButtonLink href={`/servicos/novo?cliente=${id}`} variant="dark" size="sm">
              {t("Novo atendimento")}
            </ButtonLink>
          </>
        }
      >
        <div className="grid gap-2 rounded-lg bg-surface-muted p-3 text-sm">
          <a href={`tel:${cliente.telefone}`} className="flex items-center gap-2">
            <Phone className="size-4 text-ink-subtle" />
            {phone(cliente.telefone)}
          </a>
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-medium text-brand-ink">
              <MessageCircle className="size-4" />
              {t("Conversar no WhatsApp")}
            </a>
          ) : null}
          {cliente.email ? (
            <a href={`mailto:${cliente.email}`} className="flex items-center gap-2 break-all">
              <Mail className="size-4 shrink-0 text-ink-subtle" />
              {cliente.email}
            </a>
          ) : null}
          {endereco ? (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
              <span>{endereco}</span>
            </p>
          ) : null}
          {cliente.canal ? <p className="text-xs text-ink-subtle">{t("Canal: {canal}", { canal: t(CANAL_LABEL[cliente.canal]) })}</p> : null}
        </div>

        {cliente.observacoes ? (
          <section>
            <h3 className="mb-1 text-sm font-semibold">{t("Observações")}</h3>
            <p className="text-sm whitespace-pre-wrap text-ink-muted">{cliente.observacoes}</p>
          </section>
        ) : null}

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("Equipamentos")}</h3>
            <Button variant="outline" size="sm" icon={<Plus />} onClick={() => setEquipModal({ equipamento: null })}>
              {t("Adicionar")}
            </Button>
          </div>
          {loading && equipamentos.length === 0 ? (
            <p className="text-[13px] text-ink-subtle">{t("Carregando…")}</p>
          ) : equipamentos.length === 0 ? (
            <p className="text-[13px] text-ink-subtle">{t("Nenhum equipamento cadastrado.")}</p>
          ) : (
            equipamentos.map((e) => (
              <EquipamentoCard
                key={e.id}
                equipamento={e}
                historico={historico[e.id] ?? []}
                onEdit={() => setEquipModal({ equipamento: e })}
              />
            ))
          )}
        </section>

        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Wrench className="size-4 text-ink-subtle" /> {t("Atendimentos")}
          </h3>
          {atendimentos.length === 0 ? (
            <p className="text-[13px] text-ink-subtle">{t("Nenhum atendimento ainda.")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {atendimentos.map((o) => (
                <li key={o.id}>
                  <Link href={`/servicos/${o.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-muted">
                    <span className="font-mono text-xs text-ink-subtle">{t("OS {n}", { n: docNumber(o.numero) })}</span>
                    <span className="min-w-0 flex-1">
                      <StatusBadge status={o.status} />
                    </span>
                    <span className="text-right text-xs">
                      <span className="block font-medium tabular-nums">{money(o.valor_total)}</span>
                      <span className="block text-ink-subtle tabular-nums">{date(o.data_inicio)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <FileText className="size-4 text-ink-subtle" /> {t("Orçamentos")}
          </h3>
          {orcamentos.length === 0 ? (
            <p className="text-[13px] text-ink-subtle">{t("Nenhum orçamento ainda.")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {orcamentos.map((o) => (
                <li key={o.id}>
                  <Link href={`/orcamentos/${o.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-muted">
                    <span className="flex-1 font-mono text-xs text-ink-subtle">{t("ORC {n}", { n: docNumber(o.numero) })}</span>
                    <span className="text-xs text-ink-subtle tabular-nums">{date(o.data)}</span>
                    <span className="text-xs font-medium tabular-nums">{money(o.valor_total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Drawer>

      <EquipamentoModal
        open={equipModal !== null}
        onClose={() => setEquipModal(null)}
        clienteId={id}
        equipamento={equipModal?.equipamento ?? null}
        onSaved={() => {
          setEquipModal(null);
          void load();
        }}
        onDeleted={() => {
          setEquipModal(null);
          void load();
        }}
      />
    </>
  );
}
