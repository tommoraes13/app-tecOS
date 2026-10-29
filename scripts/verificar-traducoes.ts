/**
 * Confere se todo texto que aparece no app tem tradução em inglês e espanhol, com os mesmos {placeholders}.
 * Roda na verificação automática. Uso: npx tsx --tsconfig scripts/tsconfig.teste.json scripts/verificar-traducoes.ts
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import en from "../src/i18n/messages/en";
import es from "../src/i18n/messages/es";
import { mainNav, secondaryNav } from "../src/components/layout/nav-items";
import { PERIODOS } from "../src/lib/dashboard";
import { STATUS_OPCOES } from "../src/lib/documento";
import { CAMPOS, NOME_PLACEHOLDER, PROVEDORES, SUBTIPOS_REDE } from "../src/lib/equipamentos";
import { CANAL_LABEL, CATEGORIA_LABEL, EQUIPAMENTO_CURTO, EQUIPAMENTO_LABEL, ESTADO_LABEL } from "../src/lib/labels";
import { OS_STATUS } from "../src/lib/status";

const chaves = new Map<string, string>(); // chave -> onde apareceu
const add = (k: string, onde: string) => {
  if (k && !chaves.has(k)) chaves.set(k, onde);
};

// 1) Textos fixos usados nas telas via t(variavel).
for (const rec of [CANAL_LABEL, CATEGORIA_LABEL, EQUIPAMENTO_CURTO, EQUIPAMENTO_LABEL, ESTADO_LABEL, NOME_PLACEHOLDER]) {
  for (const v of Object.values(rec)) add(v, "labels");
}
for (const v of [...PROVEDORES, ...SUBTIPOS_REDE]) add(v, "equipamentos");
for (const campos of Object.values(CAMPOS)) {
  for (const c of campos) {
    add(c.label, "equipamentos");
    if (c.placeholder) add(c.placeholder, "equipamentos");
    if (c.group) add(c.group, "equipamentos");
    for (const o of c.options ?? []) add(o, "equipamentos");
  }
}
for (const s of Object.values(OS_STATUS)) add(s.label, "status");
for (const s of STATUS_OPCOES) add(s.label, "status");
for (const p of PERIODOS) add(p.label, "dashboard");
for (const item of [...mainNav, ...secondaryNav]) {
  add(item.label, "menu");
  for (const c of item.children ?? []) add(c.label, "menu");
}

// 2) Textos escritos no código: t("..."), mensagens de erro das ações e listas fixas.
const arquivos: string[] = [];
(function walk(dir: string) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (n !== "messages") walk(p);
    } else if (/\.(ts|tsx)$/.test(n) && n !== "database.types.ts") arquivos.push(p);
  }
})("src");

const STR = String.raw`"((?:[^"\\\n]|\\.)*)"`;
const padroes = [
  new RegExp(String.raw`\bt\(\s*` + STR, "g"),
  new RegExp(String.raw`\bt\(\s*[\w.!]+\s*\?\s*` + STR + String.raw`\s*:\s*` + STR, "g"),
  new RegExp(String.raw`\berror:\s*` + STR, "g"),
  new RegExp(String.raw`\bfail\([^,()]+,\s*` + STR, "g"),
  new RegExp(String.raw`new Error\(\s*` + STR, "g"),
  new RegExp(String.raw`\bpageTitle\(\s*` + STR, "g"),
];
for (const arq of arquivos) {
  const src = readFileSync(arq, "utf8");
  for (const re of padroes) {
    for (const m of src.matchAll(re)) {
      for (const g of m.slice(1)) if (g !== undefined) add(JSON.parse(`"${g}"`), arq);
    }
  }
  // Funções que devolvem mensagens (dbMessage, validações, translateError) e listas fixas de telas.
  if (/actions\.ts$|login-form\.tsx$/.test(arq)) {
    for (const m of src.matchAll(new RegExp(String.raw`return\s+` + STR, "g"))) add(JSON.parse(`"${m[1]}"`), arq);
    for (const m of src.matchAll(new RegExp(String.raw`fallback\s*=\s*` + STR, "g"))) add(JSON.parse(`"${m[1]}"`), arq);
  }
  for (const nome of ["INCLUSO", "FUSOS_BR"]) {
    const bloco = src.match(new RegExp(String.raw`const ${nome} = \[([\s\S]*?)\]( as const)?;`));
    if (!bloco) continue;
    for (const m of bloco[1].matchAll(new RegExp(STR, "g"))) {
      if (nome === "FUSOS_BR" && m[1].includes("/")) continue; // America/Sao_Paulo é valor, não texto
      add(JSON.parse(`"${m[1]}"`), arq);
    }
  }
}

// Erros técnicos e valores que não são texto de tela.
const ignorar = new Set(["pdf", "canvas", "blob", "Documento inválido", "SEM_CHAVE", "Texto em português", "Salvar"]);

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const problemas: string[] = [];
for (const [k, onde] of chaves) {
  if (ignorar.has(k)) continue;
  for (const [nome, dict] of [["inglês", en], ["espanhol", es]] as const) {
    const v = dict[k];
    if (v === undefined) problemas.push(`Falta em ${nome}: ${JSON.stringify(k)}  (${onde})`);
    else if (vars(v) !== vars(k)) problemas.push(`Placeholders diferentes em ${nome}: ${JSON.stringify(k)} -> ${JSON.stringify(v)}`);
  }
}
const sobrando = Object.keys(en).filter((k) => !chaves.has(k));

console.log(`${chaves.size} textos encontrados, ${Object.keys(en).length} traduções.`);
if (sobrando.length) console.log(`Traduções sem uso (${sobrando.length}): ${sobrando.slice(0, 30).map((s) => JSON.stringify(s)).join(", ")}`);
if (problemas.length) {
  console.error(problemas.join("\n"));
  process.exit(1);
}
console.log("Todas as traduções estão completas.");
