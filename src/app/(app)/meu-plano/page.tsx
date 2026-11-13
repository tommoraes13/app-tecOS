import { redirect } from "next/navigation";

/** Endereço antigo: Meu Plano agora é uma aba de Minha Conta. */
export default function MeuPlanoAntigo() {
  redirect("/minha-conta?aba=plano");
}
