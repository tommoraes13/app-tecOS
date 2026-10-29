import type { Enums, Json } from "@/lib/database.types";

export type TipoEquipamento = Enums<"equipamento_tipo">;
export type Specs = Record<string, string | boolean>;

/**
 * Campos de cada tipo de equipamento, na ordem da especificação.
 * text/mono/select/toggle ficam em `especificacoes`; secret fica criptografado em `senhas`.
 */
export type CampoEquipamento = {
  key: string;
  label: string;
  kind: "text" | "mono" | "select" | "toggle" | "secret";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  wide?: boolean;
  showIf?: (v: Specs) => boolean;
  group?: string;
};

const on = (k: string) => (v: Specs) => v[k] === true;

export const PROVEDORES = ["Claro", "Tim", "Vivo", "Provedor de bairro", "Outro"];
export const SUBTIPOS_REDE = [
  "Roteador",
  "Roteador (em modo bridge)",
  "Repetidor Wi-Fi",
  "Ponto de acesso (A.P.)",
  "Switch/Hub",
  "Wi-Fi Mesh/Google Wi-Fi",
];

export const CAMPOS: Record<TipoEquipamento, CampoEquipamento[]> = {
  desktop: [
    { key: "usuario", label: "Nome de usuário", kind: "text", group: "Acesso" },
    { key: "senha_usuario", label: "Senha de usuário", kind: "secret", group: "Acesso" },
    { key: "processador", label: "Processador", kind: "text", group: "Hardware" },
    { key: "placa_mae", label: "Placa-mãe", kind: "text", group: "Hardware" },
    { key: "memoria", label: "Memória RAM / barramento / nº de módulos", kind: "text", wide: true, group: "Hardware" },
    { key: "gpu", label: "GPU / VRAM", kind: "text", group: "Hardware" },
    { key: "fonte", label: "Fonte", kind: "text", group: "Hardware" },
    { key: "disco1", label: "HD/SSD 01", kind: "text", group: "Hardware" },
    { key: "disco2", label: "HD/SSD 02", kind: "text", group: "Hardware" },
    { key: "disco3", label: "HD/SSD 03", kind: "text", group: "Hardware" },
    { key: "cooler", label: "Cooler", kind: "text", group: "Hardware" },
    { key: "fans", label: "Fans / RGBs / controladoras", kind: "text", wide: true, group: "Hardware" },
    { key: "bios", label: "Modo da BIOS", kind: "select", options: ["UEFI", "Legacy"], group: "Sistema" },
    { key: "so", label: "Sistema operacional", kind: "text", placeholder: "Exemplo: Windows 11 Pro", group: "Sistema" },
    { key: "nome_rede", label: "Nome na rede", kind: "mono", group: "Sistema" },
    { key: "backup", label: "Backup", kind: "toggle", wide: true, group: "Outros" },
    {
      key: "backup_tipo",
      label: "Tipo de backup",
      kind: "select",
      options: ["Arquivos", "Programas", "Drivers"],
      showIf: on("backup"),
      group: "Outros",
    },
    { key: "backup_tamanho", label: "Tamanho do backup", kind: "text", placeholder: "Exemplo: 120 GB", showIf: (v) => v.backup === true && v.backup_tipo === "Arquivos", group: "Outros" },
    { key: "backup_programa", label: "Nome do programa", kind: "text", placeholder: "Exemplo: Sistema de vendas", showIf: (v) => v.backup === true && v.backup_tipo === "Programas", group: "Outros" },
    { key: "backup_driver", label: "Nome do driver", kind: "text", placeholder: "Exemplo: Driver da impressora", showIf: (v) => v.backup === true && v.backup_tipo === "Drivers", group: "Outros" },
    { key: "backup_diretorio", label: "Diretório do backup", kind: "mono", wide: true, placeholder: "Exemplo: D:\\Backup\\Cliente", showIf: on("backup"), group: "Outros" },
    { key: "backup_descricao", label: "Descrição (opcional)", kind: "text", wide: true, showIf: on("backup"), group: "Outros" },
    { key: "impressora_compartilhada", label: "Impressora compartilhada", kind: "toggle", wide: true, group: "Outros" },
    {
      key: "impressora_caminho",
      label: "Nome do compartilhamento",
      kind: "mono",
      wide: true,
      placeholder: "\\\\PC-CLIENTE\\Nome da Impressora",
      showIf: on("impressora_compartilhada"),
      group: "Outros",
    },
    { key: "impressora_usuario", label: "Usuário de login", kind: "text", showIf: on("impressora_compartilhada"), group: "Outros" },
    { key: "impressora_senha", label: "Senha de login", kind: "secret", showIf: on("impressora_compartilhada"), group: "Outros" },
    { key: "pasta_compartilhada", label: "Pasta compartilhada", kind: "toggle", wide: true, group: "Outros" },
    {
      key: "pasta_caminho",
      label: "Nome do compartilhamento",
      kind: "mono",
      wide: true,
      placeholder: "\\\\PC-CLIENTE\\Nome da Pasta",
      showIf: on("pasta_compartilhada"),
      group: "Outros",
    },
    { key: "pasta_usuario", label: "Usuário de login", kind: "text", showIf: on("pasta_compartilhada"), group: "Outros" },
    { key: "pasta_senha", label: "Senha de login", kind: "secret", showIf: on("pasta_compartilhada"), group: "Outros" },
  ],
  notebook: [
    { key: "modelo", label: "Modelo completo", kind: "text", wide: true, placeholder: "Exemplo: Dell Inspiron 15 3520", group: "Hardware" },
    { key: "processador", label: "Processador", kind: "text", group: "Hardware" },
    { key: "memoria", label: "Memória RAM / barramento / nº de módulos", kind: "text", group: "Hardware" },
    { key: "gpu", label: "GPU / VRAM", kind: "text", group: "Hardware" },
    { key: "disco1", label: "HD/SSD 01", kind: "text", group: "Hardware" },
    { key: "disco2", label: "HD/SSD 02", kind: "text", group: "Hardware" },
    { key: "bios", label: "Modo da BIOS", kind: "select", options: ["UEFI", "Legacy"], group: "Sistema" },
    { key: "so", label: "Sistema operacional", kind: "text", placeholder: "Exemplo: Windows 11 Home", group: "Sistema" },
    { key: "nome_rede", label: "Nome na rede", kind: "mono", group: "Sistema" },
    { key: "usuario", label: "Nome de usuário", kind: "text", group: "Acesso" },
    { key: "senha_usuario", label: "Senha de usuário", kind: "secret", group: "Acesso" },
  ],
  rede: [
    { key: "subtipo", label: "Tipo de equipamento", kind: "select", options: SUBTIPOS_REDE, required: true, group: "Hardware" },
    {
      key: "provedor",
      label: "Provedor",
      kind: "select",
      options: PROVEDORES,
      required: true,
      showIf: (v) => v.subtipo === "Roteador",
      group: "Hardware",
    },
    { key: "ssid_24", label: "SSID 2.4G", kind: "mono", group: "Acesso" },
    { key: "senha_wifi_24", label: "Senha Wi-Fi 2.4G", kind: "secret", group: "Acesso" },
    { key: "ssid_5", label: "SSID 5G", kind: "mono", placeholder: "Igual ao 2.4G se vazio", group: "Acesso" },
    { key: "senha_wifi_5", label: "Senha Wi-Fi 5G", kind: "secret", group: "Acesso" },
    { key: "ip_config", label: "Endereço IP de configuração", kind: "mono", placeholder: "192.168.0.1", group: "Sistema" },
    { key: "gateway", label: "Gateway padrão", kind: "mono", group: "Sistema" },
    { key: "usuario_admin", label: "Usuário admin", kind: "text", group: "Acesso" },
    { key: "senha_admin", label: "Senha admin", kind: "secret", group: "Acesso" },
    { key: "dhcp", label: "Servidor DHCP ligado", kind: "toggle", wide: true, group: "Sistema" },
    { key: "dhcp_faixa", label: "Faixa de IP", kind: "mono", wide: true, placeholder: "192.168.0.100 a 192.168.0.200", showIf: on("dhcp"), group: "Sistema" },
  ],
  impressora: [
    { key: "marca", label: "Marca", kind: "text", required: true, group: "Hardware" },
    { key: "modelo", label: "Modelo completo", kind: "text", required: true, group: "Hardware" },
    { key: "tinta", label: "Tipo de tinta", kind: "select", options: ["Toner", "Cartucho", "Ink Tank", "Térmica"], group: "Hardware" },
    { key: "conexao", label: "Modo de conexão", kind: "select", options: ["Cabo USB", "Modo wireless"], required: true, group: "Sistema" },
    { key: "rede_conectada", label: "Rede conectada", kind: "mono", showIf: (v) => v.conexao === "Modo wireless", group: "Sistema" },
    { key: "ip", label: "Endereço IP", kind: "mono", showIf: (v) => v.conexao === "Modo wireless", group: "Sistema" },
    { key: "gateway", label: "Gateway padrão", kind: "mono", showIf: (v) => v.conexao === "Modo wireless", group: "Sistema" },
    { key: "direct", label: "Wi-Fi Direct", kind: "toggle", showIf: (v) => v.conexao === "Modo wireless", group: "Sistema" },
    { key: "mac", label: "Endereço MAC", kind: "mono", group: "Sistema" },
  ],
};

/** Ordem das seções do cadastro de equipamento (todas começam recolhidas). */
export const GRUPOS = ["Acesso", "Hardware", "Sistema", "Outros"] as const;

/** Estado geral do equipamento: textos livres guardados junto da ficha técnica. */
export const ESTADO_ATIVO = "estado_ativo";
export const ESTADO_CAMPOS = [
  { key: "estado_sintomas", label: "Sintomas", placeholder: "O que o cliente relata ou o que você observou" },
  { key: "estado_defeitos", label: "Defeitos", placeholder: "Peças ou partes com problema" },
  { key: "estado_solucao", label: "Solução", placeholder: "O que foi feito ou o que precisa ser feito" },
] as const;

export const NOME_PLACEHOLDER: Record<TipoEquipamento, string> = {
  desktop: "Exemplo: PC João",
  notebook: "Exemplo: Notebook Maria",
  rede: "Exemplo: Roteador sala",
  impressora: "Exemplo: Impressora escritório",
};

export function asSpecs(j: Json): Specs {
  if (!j || typeof j !== "object" || Array.isArray(j)) return {};
  const out: Specs = {};
  for (const [k, v] of Object.entries(j)) {
    if (typeof v === "string" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

/** Chaves das senhas que já estão salvas (o valor cifrado nunca vai para o navegador). */
export function secretKeys(j: Json): string[] {
  if (!j || typeof j !== "object" || Array.isArray(j)) return [];
  return Object.entries(j)
    .filter(([, v]) => typeof v === "string" && v.length > 0)
    .map(([k]) => k);
}

/** Resumo de uma linha: "Dell Inspiron · Windows 11". `t` traduz as opções fixas (ex.: tipo de rede). */
export function resumoEquipamento(tipo: TipoEquipamento, specs: Specs, t: (s: string) => string = (s) => s) {
  const s = (k: string) => (typeof specs[k] === "string" ? (specs[k] as string) : "");
  const parts =
    tipo === "desktop"
      ? [s("processador"), s("so")]
      : tipo === "notebook"
        ? [s("modelo"), s("so")]
        : tipo === "rede"
          ? [s("subtipo") && t(s("subtipo")), s("provedor") && t(s("provedor")), s("ssid_24")]
          : [s("marca"), s("modelo")];
  return parts.filter(Boolean).join(" · ");
}

/**
 * Ficha resumida da máquina para listas (ex.: na OS):
 * "Ryzen 7 5700X · 16 GB · SSD 480 GB · RTX 3060 · Windows 11".
 */
export function fichaEquipamento(tipo: TipoEquipamento, specs: Specs, t: (s: string) => string = (s) => s) {
  const s = (k: string) => (typeof specs[k] === "string" ? (specs[k] as string).trim() : "");
  const partes =
    tipo === "desktop"
      ? [s("processador"), s("memoria"), s("disco1"), s("gpu"), s("so")]
      : tipo === "notebook"
        ? [s("modelo"), s("processador"), s("memoria"), s("disco1"), s("so")]
        : tipo === "rede"
          ? [s("subtipo") && t(s("subtipo")), s("provedor") && t(s("provedor")), s("ssid_24")]
          : [[s("marca"), s("modelo")].filter(Boolean).join(" "), s("tinta") && t(s("tinta")), s("conexao") && t(s("conexao"))];
  return partes.filter(Boolean).join(" · ");
}
