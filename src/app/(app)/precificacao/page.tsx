import { redirect } from "next/navigation";

/** Endereço antigo: a precificação agora fica em Meu Negócio. */
export default function PrecificacaoAntiga() {
  redirect("/meu-negocio/precificacao");
}
