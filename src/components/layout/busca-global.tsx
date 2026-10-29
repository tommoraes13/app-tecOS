"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, FileText, Loader2, Monitor, Package, Search, User, Wrench, X } from "lucide-react";
import { useViewer, type DetalheRef } from "@/components/detalhes/viewer";
import { useI18n } from "@/i18n/client";
import type { Enums } from "@/lib/database.types";
import { docNumber, normalize, phone } from "@/lib/format";
import { navegarComGuarda } from "@/lib/guarda-saida";
import { OS_STATUS } from "@/lib/status";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Telas do app que a busca encontra, com palavras que levam até elas. */
const TELAS = [
  { href: "/dashboard", label: "Dashboard", palavras: "inicio painel resumo ganhos graficos" },
  { href: "/agenda", label: "Minha Agenda", palavras: "agenda calendario visitas horarios" },
  { href: "/orcamentos", label: "Orçamentos", palavras: "orcamentos propostas" },
  { href: "/orcamentos/novo", label: "Novo orçamento", palavras: "criar orcamento proposta" },
  { href: "/servicos", label: "Atendimentos", palavras: "servicos prestados atendimentos os ordens" },
  { href: "/servicos/novo", label: "Novo atendimento", palavras: "criar atendimento os ordem servico" },
  { href: "/clientes", label: "Clientes", palavras: "clientes contatos" },
  { href: "/cadastros/servicos", label: "Cadastro de Serviços", palavras: "catalogo cadastro servicos precos" },
  { href: "/cadastros/produtos", label: "Cadastro de Produtos", palavras: "catalogo cadastro produtos pecas estoque" },
  { href: "/cadastros/templates", label: "Cadastro de Modelos", palavras: "catalogo cadastro templates checklist modelos" },
  { href: "/precificacao", label: "Tabela de Preços", palavras: "tabela precificacao precos visita km deslocamento" },
  { href: "/meu-negocio", label: "Meu Negócio", palavras: "empresa negocio garantia endereco cnpj" },
  { href: "/minha-conta", label: "Minha Conta", palavras: "conta perfil foto senha idioma moeda fuso tema" },
  { href: "/meu-plano", label: "Meu Plano", palavras: "plano assinatura pagamento upgrade" },
];

type Resultados = {
  clientes: { id: string; nome: string; telefone: string; cidade: string | null }[];
  os: { id: string; numero: number; status: Enums<"os_status">; cliente: string | null; valor_total: number }[];
  orcamentos: { id: string; numero: number; cliente: string | null; valor_total: number }[];
  servicos: { id: string; nome: string; codigo: string | null; valor: number }[];
  produtos: { id: string; nome: string; codigo: string | null; valor_venda: number }[];
};

type Item = {
  key: string;
  grupo: string;
  icon: typeof Search;
  titulo: string;
  sub?: string;
  direita?: string;
  ir: { href: string } | { ver: DetalheRef };
};

const VAZIO: Resultados = { clientes: [], os: [], orcamentos: [], servicos: [], produtos: [] };

/**
 * Busca da barra superior: telas do app, clientes, OS, orçamentos e catálogo.
 * No computador fica aberta à esquerda (atalho Ctrl+K); no celular, abre em tela cheia pela lupa.
 */
export function BuscaGlobal({ compact = false }: { compact?: boolean }) {
  const { t, fmt } = useI18n();
  const router = useRouter();
  const { abrir } = useViewer();
  const [q, setQ] = useState("");
  const [aberta, setAberta] = useState(false);
  const [res, setRes] = useState<Resultados>(VAZIO);
  const [carregando, setCarregando] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  // Ctrl+K / Cmd+K abre a busca.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        if (compact && window.matchMedia("(min-width: 1024px)").matches) return;
        if (!compact && !window.matchMedia("(min-width: 1024px)").matches) return;
        e.preventDefault();
        setAberta(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [compact]);

  // Fecha ao clicar fora (computador).
  useEffect(() => {
    if (!aberta || compact) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setAberta(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [aberta, compact]);

  // Busca no banco (a partir de 2 letras), esperando a pessoa parar de digitar.
  useEffect(() => {
    const termo = q.trim();
    const n = ++seq.current;
    if (termo.length < 2) {
      setRes(VAZIO);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const timer = window.setTimeout(async () => {
      const { data } = await createClient().rpc("buscar_tudo", { p_q: termo });
      if (n !== seq.current) return;
      setRes({ ...VAZIO, ...((data ?? {}) as Partial<Resultados>) });
      setCarregando(false);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [q]);

  const itens = useMemo<Item[]>(() => {
    const termo = normalize(q.trim());
    if (!termo) return [];
    const telas = TELAS.filter((s) => normalize(`${t(s.label)} ${s.label} ${s.palavras}`).includes(termo))
      .slice(0, 5)
      .map<Item>((s) => ({ key: `t${s.href}`, grupo: t("Telas do app"), icon: Monitor, titulo: t(s.label), ir: { href: s.href } }));
    return [
      ...telas,
      ...res.clientes.map<Item>((c) => ({
        key: `c${c.id}`,
        grupo: t("Clientes"),
        icon: User,
        titulo: c.nome,
        sub: [phone(c.telefone), c.cidade].filter(Boolean).join(" · "),
        ir: { ver: { tipo: "cliente", id: c.id } },
      })),
      ...res.os.map<Item>((o) => ({
        key: `o${o.id}`,
        grupo: t("Atendimentos"),
        icon: Wrench,
        titulo: `${t("OS {n}", { n: docNumber(o.numero) })} · ${o.cliente ?? t("Cliente não definido")}`,
        sub: t(OS_STATUS[o.status].label),
        direita: fmt.money(o.valor_total),
        ir: { ver: { tipo: "os", id: o.id } },
      })),
      ...res.orcamentos.map<Item>((o) => ({
        key: `r${o.id}`,
        grupo: t("Orçamentos"),
        icon: FileText,
        titulo: `${t("Orçamento {n}", { n: docNumber(o.numero) })} · ${o.cliente ?? t("Cliente não definido")}`,
        direita: fmt.money(o.valor_total),
        ir: { ver: { tipo: "orcamento", id: o.id } },
      })),
      ...res.servicos.map<Item>((s) => ({
        key: `s${s.id}`,
        grupo: t("Cadastro de Serviços"),
        icon: Wrench,
        titulo: s.nome,
        sub: s.codigo ?? undefined,
        direita: fmt.money(s.valor),
        ir: { href: `/cadastros/servicos?abrir=${s.id}` },
      })),
      ...res.produtos.map<Item>((p) => ({
        key: `p${p.id}`,
        grupo: t("Cadastro de Produtos"),
        icon: Package,
        titulo: p.nome,
        sub: p.codigo ?? undefined,
        direita: fmt.money(p.valor_venda),
        ir: { href: `/cadastros/produtos?abrir=${p.id}` },
      })),
    ];
  }, [q, res, t, fmt]);

  useEffect(() => setAtivo(0), [itens.length]);

  function escolher(item: Item) {
    setAberta(false);
    setQ("");
    inputRef.current?.blur();
    if ("href" in item.ir) navegarComGuarda(item.ir.href, router.push);
    else abrir(item.ir.ver);
  }

  const lista = (
    <div className="max-h-[min(70dvh,520px)] overflow-y-auto p-1.5" role="listbox">
      {q.trim().length === 0 ? (
        <p className="px-3 py-3 text-[13px] text-ink-subtle">{t("Digite o nome de um cliente, um nº de OS ou o nome de uma tela.")}</p>
      ) : itens.length === 0 ? (
        <p className="flex items-center gap-2 px-3 py-3 text-[13px] text-ink-subtle">
          {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
          {carregando ? t("Buscando…") : t("Nada encontrado")}
        </p>
      ) : (
        itens.map((item, i) => {
          const Icon = item.icon;
          const novoGrupo = i === 0 || itens[i - 1].grupo !== item.grupo;
          return (
            <div key={item.key}>
              {novoGrupo ? <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold tracking-wide text-ink-subtle uppercase">{item.grupo}</p> : null}
              <button
                type="button"
                role="option"
                aria-selected={i === ativo}
                onMouseEnter={() => setAtivo(i)}
                onClick={() => escolher(item)}
                className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === ativo && "bg-surface-muted")}
              >
                <Icon className="size-4 shrink-0 text-ink-subtle" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{item.titulo}</span>
                  {item.sub ? <span className="block truncate text-xs text-ink-subtle">{item.sub}</span> : null}
                </span>
                {item.direita ? <span className="shrink-0 text-xs text-ink-muted tabular-nums">{item.direita}</span> : null}
                {i === ativo ? <CornerDownLeft className="hidden size-3.5 shrink-0 text-ink-subtle lg:block" /> : null}
              </button>
            </div>
          );
        })
      )}
      {carregando && itens.length > 0 ? (
        <p className="flex items-center gap-2 px-3 py-2 text-xs text-ink-subtle">
          <Loader2 className="size-3.5 animate-spin" /> {t("Buscando…")}
        </p>
      ) : null}
    </div>
  );

  const campo = (
    <input
      ref={inputRef}
      type="search"
      value={q}
      autoComplete="off"
      placeholder={t("Buscar clientes, OS, telas…")}
      aria-label={t("Buscar")}
      onFocus={() => setAberta(true)}
      onChange={(e) => {
        setQ(e.target.value);
        setAberta(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setAtivo((a) => Math.min(a + 1, itens.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setAtivo((a) => Math.max(a - 1, 0));
        } else if (e.key === "Enter" && itens[ativo]) {
          e.preventDefault();
          escolher(itens[ativo]);
        } else if (e.key === "Escape") {
          setAberta(false);
          inputRef.current?.blur();
        }
      }}
      className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-subtle"
    />
  );

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setAberta(true);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
          aria-label={t("Buscar")}
          className="relative inline-grid size-9 place-items-center rounded-full border border-border bg-surface text-ink-muted"
        >
          <Search className="size-4" />
        </button>
        {aberta ? (
          <div className="fixed inset-0 z-50 flex flex-col bg-surface lg:hidden" role="dialog" aria-modal="true" aria-label={t("Buscar")}>
            <div className="flex h-14 items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-ink-subtle" />
              {campo}
              <button
                type="button"
                onClick={() => {
                  setAberta(false);
                  setQ("");
                }}
                aria-label={t("Fechar")}
                className="inline-grid size-10 place-items-center rounded-md text-ink-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{lista}</div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <label className="flex h-10 items-center gap-2 rounded-full bg-surface-muted px-3.5 focus-within:shadow-[0_0_0_3px_var(--brand-100)]">
        <Search className="size-4 shrink-0 text-ink-subtle" />
        {campo}
        <kbd className="hidden shrink-0 rounded border border-border px-1.5 font-mono text-[11px] text-ink-subtle xl:block">Ctrl K</kbd>
      </label>
      {aberta ? (
        <div className="absolute top-full left-0 z-40 mt-2 w-full min-w-[420px] rounded-xl border border-border bg-surface shadow-pop">{lista}</div>
      ) : null}
    </div>
  );
}
