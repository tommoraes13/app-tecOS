"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ClienteView } from "./cliente-view";
import { DocumentoView } from "./documento-view";
import { EquipamentoView } from "./equipamento-view";

export type DetalheRef = { tipo: "os" | "orcamento" | "cliente" | "equipamento"; id: string };

type Ctx = {
  /** Abre a janela de visualização. Dentro de outra janela, empilha (com botão Voltar). */
  abrir: (ref: DetalheRef) => void;
  fechar: () => void;
};

const ViewerContext = createContext<Ctx>({ abrir: () => {}, fechar: () => {} });

export function useViewer() {
  return useContext(ViewerContext);
}

export type ViewProps = {
  id: string;
  onClose: () => void;
  /** Volta para a janela anterior (quando uma abriu a outra). */
  onBack?: () => void;
  abrir: (ref: DetalheRef) => void;
};

/**
 * Janelas de visualização (Design System > Modal): ao clicar em cliente, atendimento, orçamento ou
 * equipamento, mostra as informações sem campos editáveis; o botão Editar leva para a edição.
 */
export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const [pilha, setPilha] = useState<DetalheRef[]>([]);

  const abrir = useCallback((ref: DetalheRef) => {
    setPilha((p) => {
      const topo = p[p.length - 1];
      if (topo && topo.tipo === ref.tipo && topo.id === ref.id) return p;
      return [...p, ref].slice(-6);
    });
  }, []);
  const fechar = useCallback(() => setPilha([]), []);
  const voltar = useCallback(() => setPilha((p) => p.slice(0, -1)), []);
  const value = useMemo(() => ({ abrir, fechar }), [abrir, fechar]);

  const topo = pilha[pilha.length - 1];
  const props: ViewProps | null = topo
    ? { id: topo.id, onClose: fechar, onBack: pilha.length > 1 ? voltar : undefined, abrir }
    : null;

  return (
    <ViewerContext.Provider value={value}>
      {children}
      {topo && props ? (
        topo.tipo === "cliente" ? (
          <ClienteView key={`c-${topo.id}`} {...props} />
        ) : topo.tipo === "equipamento" ? (
          <EquipamentoView key={`e-${topo.id}`} {...props} />
        ) : (
          <DocumentoView key={`${topo.tipo}-${topo.id}`} tipo={topo.tipo} {...props} />
        )
      ) : null}
    </ViewerContext.Provider>
  );
}

/** Botão com aparência de link que abre a janela de visualização (para usar em telas do servidor). */
export function ViewerLink({
  tipo,
  id,
  className,
  children,
}: DetalheRef & { className?: string; children: React.ReactNode }) {
  const { abrir } = useViewer();
  return (
    <button type="button" onClick={() => abrir({ tipo, id })} className={className}>
      {children}
    </button>
  );
}
