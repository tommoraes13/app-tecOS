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
    { key: "backup", label: "Backup", kind: "toggle", wide: true, group: "Backup" },
    {
      key: "backup_tipo",
      label: "Tipo de backup",
      kind: "select",
      options: ["Arquivos", "Programas", "Drivers"],
      showIf: on("backup"),
      group: "Backup",
    },
    { key: "backup_tamanho", label: "Tamanho do backup", kind: "text", placeholder: "Exemplo: 120 GB", showIf: (v) => v.backup === true && v.backup_tipo === "Arquivos", group: "Backup" },
    { key: "backup_programa", label: "Nome do programa", kind: "text", placeholder: "Exemplo: Sistema de vendas", showIf: (v) => v.backup === true && v.backup_tipo === "Programas", group: "Backup" },
    { key: "backup_driver", label: "Nome do driver", kind: "text", placeholder: "Exemplo: Driver da impressora", showIf: (v) => v.backup === true && v.backup_tipo === "Drivers", group: "Backup" },
    { key: "backup_diretorio", label: "Diretório do backup", kind: "mono", wide: true, placeholder: "Exemplo: D:\\Backup\\Cliente", showIf: on("backup"), group: "Backup" },
    { key: "backup_descricao", label: "Descrição (opcional)", kind: "text", wide: true, showIf: on("backup"), group: "Backup" },
    { key: "impressora_compartilhada", label: "Impressora compartilhada", kind: "toggle", wide: true, group: "Compartilhamentos" },
    {
      key: "impressora_caminho",
      label: "Nome do compartilhamento",
      kind: "mono",
      wide: true,
      placeholder: "\\\\PC-CLIENTE\\Nome da Impressora",
      showIf: on("impressora_compartilhada"),
      group: "Compartilhamentos",
    },
    { key: "impressora_usuario", label: "Usuário de login", kind: "text", showIf: on("impressora_compartilhada"), group: "Compartilhamentos" },
    { key: "impressora_senha", label: "Senha de login", kind: "secret", showIf: on("impressora_compartilhada"), group: "Compartilhamentos" },
    { key: "pasta_compartilhada", label: "Pasta compartilhada", kind: "toggle", wide: true, group: "Compartilhamentos" },
    {
      key: "pasta_caminho",
      label: "Nome do compartilhamento",
      kind: "mono",
      wide: true,
      placeholder: "\\\\PC-CLIENTE\\Nome da Pasta",
      showIf: on("pasta_compartilhada"),
      group: "Compartilhamentos",
    },
    { key: "pasta_usuario", label: "Usuário de login", kind: "text", showIf: on("pasta_compartilhada"), group: "Compartilhamentos" },
    { key: "pasta_senha", label: "Senha de login", kind: "secret", showIf: on("pasta_compartilhada"), group: "Compartilhamentos" },
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
    { key: "subtipo", label: "Tipo de equipamento", kind: "select", options: SUBTIPOS_REDE, required: true, group: "Equipamento" },
    {
      key: "provedor",
      label: "Provedor",
      kind: "select",
      options: PROVEDORES,
      required: true,
      showIf: (v) => v.subtipo === "Roteador",
      group: "Equipamento",
    },
    { key: "ssid_24", label: "SSID 2.4G", kind: "mono", group: "Wi-Fi" },
    { key: "senha_wifi_24", label: "Senha Wi-Fi 2.4G", kind: "secret", group: "Wi-Fi" },
    { key: "ssid_5", label: "SSID 5G", kind: "mono", placeholder: "Igual ao 2.4G se vazio", group: "Wi-Fi" },
    { key: "senha_wifi_5", label: "Senha Wi-Fi 5G", kind: "secret", group: "Wi-Fi" },
    { key: "ip_config", label: "Endereço IP de configuração", kind: "mono", placeholder: "192.168.0.1", group: "Administração" },
    { key: "gateway", label: "Gateway padrão", kind: "mono", group: "Administração" },
    { key: "usuario_admin", label: "Usuário admin", kind: "text", group: "Administração" },
    { key: "senha_admin", label: "Senha admin", kind: "secret", group: "Administração" },
    { key: "dhcp", label: "Servidor DHCP ligado", kind: "toggle", wide: true, group: "Administração" },
    { key: "dhcp_faixa", label: "Faixa de IP", kind: "mono", wide: true, placeholder: "192.168.0.100 a 192.168.0.200", showIf: on("dhcp"), group: "Administração" },
  ],
  impressora: [
    { key: "marca", label: "Marca", kind: "text", required: true, group: "Equipamento" },
    { key: "modelo", label: "Modelo completo", kind: "text", required: true, group: "Equipamento" },
    { key: "tinta", label: "Tipo de tinta", kind: "select", options: ["Toner", "Cartucho", "Ink Tank", "Térmica"], group: "Equipamento" },
    { key: "conexao", label: "Modo de conexão", kind: "select", options: ["Cabo USB", "Modo wireless"], required: true, group: "Conexão" },
    { key: "rede_conectada", label: "Rede conectada", kind: "mono", showIf: (v) => v.conexao === "Modo wireless", group: "Conexão" },
    { key: "ip", label: "Endereço IP", kind: "mono", showIf: (v) => v.conexao === "Modo wireless", group: "Conexão" },
    { key: "gateway", label: "Gateway padrão", kind: "mono", showIf: (v) => v.conexao === "Modo wireless", group: "Conexão" },
    { key: "direct", label: "Wi-Fi Direct", kind: "toggle", showIf: (v) => v.conexao === "Modo wireless", group: "Conexão" },
    { key: "mac", label: "Endereço MAC", kind: "mono", group: "Conexão" },
  ],
};

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
