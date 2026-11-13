"use client";

import { useEffect } from "react";

/** Com a tela aberta, sai sozinho quando completar 24 h desde o login (opção em Minha Conta). */
export function Sair24h({ expiraEm }: { expiraEm: number }) {
  useEffect(() => {
    const sair = () => window.location.assign("/auth/expirou");
    const falta = expiraEm - Date.now();
    if (falta <= 0) return sair();
    // setTimeout aceita no máximo ~24,8 dias; aqui é sempre menos de 24 h.
    const timer = window.setTimeout(sair, falta);
    const aoVoltar = () => document.visibilityState === "visible" && Date.now() >= expiraEm && sair();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [expiraEm]);
  return null;
}
