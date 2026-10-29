/**
 * Busca de endereço enquanto você digita, pelo Photon (OpenStreetMap, gratuito).
 * Devolve sugestões já separadas em rua, número, bairro, cidade, estado e CEP.
 */
export type SugestaoEndereco = {
  id: string;
  titulo: string;
  detalhe: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

const UF_POR_NOME: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE", "distrito federal": "DF",
  "espirito santo": "ES", goias: "GO", maranhao: "MA", "mato grosso": "MT", "mato grosso do sul": "MS",
  "minas gerais": "MG", para: "PA", paraiba: "PB", parana: "PR", pernambuco: "PE", piaui: "PI",
  "rio de janeiro": "RJ", "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR",
  "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};

const semAcento = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

type Feature = {
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
    countrycode?: string;
    type?: string;
  };
};

export async function buscarEnderecos(q: string, pais = "BR", sinal?: AbortSignal): Promise<SugestaoEndereco[]> {
  const termo = q.trim();
  if (termo.length < 4) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(termo)}&limit=10`;
  const res = await fetch(url, { signal: sinal });
  if (!res.ok) return [];
  const json = (await res.json()) as { features?: Feature[] };
  const vistos = new Set<string>();
  const lista: SugestaoEndereco[] = [];
  for (const f of json.features ?? []) {
    const p = f.properties;
    if (pais && p.countrycode && p.countrycode.toUpperCase() !== pais) continue;
    const rua = p.street ?? (p.type === "street" ? (p.name ?? "") : "");
    const cidade = p.city ?? p.county ?? "";
    const bairro = p.district ?? p.locality ?? "";
    const uf = p.state ? (UF_POR_NOME[semAcento(p.state)] ?? p.state) : "";
    const titulo = [rua || p.name, p.housenumber].filter(Boolean).join(", ");
    const chave = `${titulo}|${bairro}|${cidade}`;
    if (!titulo || vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push({
      id: String(p.osm_id ?? chave),
      titulo,
      detalhe: [bairro, [cidade, uf].filter(Boolean).join("/"), p.postcode].filter(Boolean).join(" · "),
      endereco: rua || p.name || "",
      numero: p.housenumber ?? "",
      bairro,
      cidade,
      estado: uf.length === 2 ? uf : "",
      cep: p.postcode ?? "",
    });
    if (lista.length >= 6) break;
  }
  return lista;
}
