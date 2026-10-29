"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const LIMITE = 72; // px puxados para atualizar

/**
 * "Puxar para atualizar" no celular, quando o app está instalado na tela inicial
 * (no navegador comum o próprio Safari/Chrome já faz isso). Atualiza os dados da tela, sem recarregar tudo.
 */
export function PuxarParaAtualizar() {
  const router = useRouter();
  const [dist, setDist] = useState(0);
  const [pending, start] = useTransition();
  const inicio = useRef<number | null>(null);
  const distRef = useRef(0);

  useEffect(() => {
    const instalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!instalado) return;

    const onStart = (e: TouchEvent) => {
      // Só no topo da tela e com nenhuma janela aberta (janela trava a rolagem do fundo).
      if (window.scrollY > 0 || document.body.style.overflow === "hidden" || e.touches.length !== 1) return;
      inicio.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (inicio.current === null) return;
      const dy = e.touches[0].clientY - inicio.current;
      if (dy <= 0 || window.scrollY > 0) {
        distRef.current = 0;
        setDist(0);
        return;
      }
      distRef.current = Math.min(120, dy * 0.5);
      setDist(distRef.current);
    };
    const onEnd = () => {
      if (inicio.current !== null && distRef.current >= LIMITE * 0.75) start(() => router.refresh());
      inicio.current = null;
      distRef.current = 0;
      setDist(0);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [router]);

  const visivel = pending || dist > 8;
  if (!visivel) return null;
  const pronto = dist >= LIMITE * 0.75;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+72px)] z-40 flex justify-center lg:hidden"
      style={{ transform: `translateY(${pending ? 8 : dist / 2}px)` }}
    >
      <span className={cn("grid size-9 place-items-center rounded-full bg-surface shadow-pop", pronto || pending ? "text-brand-ink" : "text-ink-subtle")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" style={{ transform: `rotate(${dist * 3}deg)` }} />}
      </span>
    </div>
  );
}
