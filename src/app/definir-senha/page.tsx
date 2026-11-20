import { redirect } from "next/navigation";

/** Endereço antigo do convite: agora é o passo a passo de primeiro acesso. */
export default function DefinirSenhaAntigo() {
  redirect("/primeiro-acesso");
}
