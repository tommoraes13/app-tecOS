export type EnderecoCep = { endereco: string; bairro: string; cidade: string; estado: string };

/** Busca o endereço pelo CEP no ViaCEP (gratuito). Retorna null se não encontrar. */
export async function buscarCep(cep: string): Promise<EnderecoCep | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) return null;
    return {
      endereco: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      estado: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
