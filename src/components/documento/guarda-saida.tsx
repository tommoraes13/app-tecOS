"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/client";
import { registrarGuarda } from "@/lib/guarda-saida";

/**
 * Pergunta "Salvar antes de sair?" quando há mudanças não salvas e você clica num link,
 * no menu, na busca, ou fecha/recarrega a aba (aí o navegador mostra o aviso dele).
 */
export function GuardaSaida({ alterado, salvar }: { alterado: boolean; salvar: () => Promise<boolean> }) {
  const { t } = useI18n();
  const router = useRouter();
  const [destino, setDestino] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const alteradoRef = useRef(alterado);
  alteradoRef.current = alterado;

  useEffect(() => {
    const antesDeSair = (e: BeforeUnloadEvent) => {
      if (!alteradoRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    // Cliques em links internos (menu, voltar, links das telas).
    const aoClicar = (e: MouseEvent) => {
      if (!alteradoRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setDestino(url.pathname + url.search);
    };
    window.addEventListener("beforeunload", antesDeSair);
    document.addEventListener("click", aoClicar, true);
    registrarGuarda((href) => {
      if (!alteradoRef.current) return false;
      setDestino(href);
      return true;
    });
    return () => {
      window.removeEventListener("beforeunload", antesDeSair);
      document.removeEventListener("click", aoClicar, true);
      registrarGuarda(null);
    };
  }, []);

  if (!destino) return null;

  const sair = (href: string) => {
    alteradoRef.current = false;
    setDestino(null);
    router.push(href);
  };

  return (
    <Modal
      open
      size="sm"
      onClose={() => setDestino(null)}
      title={t("Salvar antes de sair?")}
      footer={
        <>
          <Button variant="ghost" onClick={() => sair(destino)} disabled={salvando} className="mr-auto">
            {t("Sair sem salvar")}
          </Button>
          <Button variant="outline" onClick={() => setDestino(null)} disabled={salvando}>
            {t("Continuar editando")}
          </Button>
          <Button
            variant="dark"
            disabled={salvando}
            onClick={async () => {
              setSalvando(true);
              const ok = await salvar();
              setSalvando(false);
              if (ok) sair(destino);
              else setDestino(null);
            }}
          >
            {salvando ? t("Salvando…") : t("Salvar e sair")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{t("Você fez alterações que ainda não foram salvas.")}</p>
    </Modal>
  );
}
