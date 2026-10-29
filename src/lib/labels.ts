import type { Enums } from "@/lib/database.types";

export const CANAL_LABEL: Record<Enums<"cliente_canal">, string> = {
  internet: "Internet",
  indicacao: "Indicação",
  trafego_pago: "Tráfego pago",
  redes_sociais: "Redes sociais",
  outro: "Outro",
};

export const CATEGORIA_LABEL: Record<Enums<"servico_categoria">, string> = {
  manutencao: "Manutenção",
  diagnostico_revisao: "Diagnóstico/Revisão",
  montagem: "Montagem",
  configuracao: "Configuração",
  backup_recuperacao: "Backup e Recuperação",
  consultoria: "Consultoria",
  outros: "Outros",
};

export const EQUIPAMENTO_LABEL: Record<Enums<"equipamento_tipo">, string> = {
  desktop: "Computador (desktop)",
  notebook: "Notebook/laptop",
  rede: "Roteador/A.P./rede",
  impressora: "Impressora",
};

export const EQUIPAMENTO_CURTO: Record<Enums<"equipamento_tipo">, string> = {
  desktop: "Desktop",
  notebook: "Notebook",
  rede: "Rede",
  impressora: "Impressora",
};

export const ESTADO_LABEL: Record<Enums<"equipamento_estado">, string> = {
  funcionando: "Funcionando",
  defeito: "Defeito",
  parado: "Parado",
};

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
  "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

/** Opções de duração em passos de 30 min (00:30 a 12:00). */
export const DURACOES = Array.from({ length: 24 }, (_, i) => (i + 1) * 30);

/** Opções de tempo médio de serviço em passos de 15 min (00:15 a 08:00). */
export const TEMPOS_MEDIOS = Array.from({ length: 32 }, (_, i) => (i + 1) * 15);
