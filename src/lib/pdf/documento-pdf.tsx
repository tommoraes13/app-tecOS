import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { OS_STATUS } from "@/lib/status";
import { DEFAULT_PREFS } from "@/i18n/config";
import { createFormat, type Fmt } from "@/i18n/format";
import { createT, type T } from "@/i18n/translate";
import { addMonthsISO, cep, docNumber, duration, phone } from "@/lib/format";
import type { PdfDados, PdfItem } from "./dados";

// Cores do Design System (tema claro).
const C = {
  ink: "#0f1a14",
  muted: "#4f5d55",
  subtle: "#626f68",
  border: "#e2e7e4",
  surfaceMuted: "#edf1ee",
  brand: "#0a3a2a",
  brandLight: "#dff1e7",
};

const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 48, paddingHorizontal: 40, fontSize: 9.5, color: C.ink, fontFamily: "Helvetica", lineHeight: 1.35 },
  header: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: C.brand, marginBottom: 14 },
  empresa: { maxWidth: 300 },
  empresaNome: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  small: { fontSize: 8.5, color: C.muted },
  docBox: { alignItems: "flex-end" },
  docTipo: { fontSize: 8.5, color: C.subtle, letterSpacing: 1 },
  docNum: { fontSize: 18, lineHeight: 1.1, fontFamily: "Helvetica-Bold", color: C.brand, marginTop: 3, marginBottom: 4 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.subtle, letterSpacing: 0.8, marginBottom: 5 },
  section: { marginBottom: 11 },
  box: { backgroundColor: C.surfaceMuted, borderRadius: 6, padding: 10 },
  row: { flexDirection: "row" },
  bold: { fontFamily: "Helvetica-Bold" },
  tableHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 4, marginBottom: 2 },
  th: { fontSize: 8, color: C.subtle, fontFamily: "Helvetica-Bold" },
  tr: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.border },
  cDesc: { flex: 1, paddingRight: 8 },
  cQtd: { width: 40, textAlign: "right" },
  cVal: { width: 72, textAlign: "right" },
  totais: { marginLeft: "auto", width: 230, marginTop: 6 },
  totLinha: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  totFinal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 4, paddingTop: 8, borderTopWidth: 1.5, borderTopColor: C.brand },
  totFinalValor: { fontSize: 15, lineHeight: 1.1, fontFamily: "Helvetica-Bold", color: C.brand },
  assinaturas: { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  assinatura: { width: 220, borderTopWidth: 1, borderTopColor: C.muted, paddingTop: 4, textAlign: "center", fontSize: 8.5, color: C.muted },
  footerLeft: { position: "absolute", bottom: 24, left: 40, fontSize: 7.5, color: C.subtle },
});

function enderecoLinha(
  e: {
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  },
  t: T,
) {
  return [
    [e.endereco, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.cidade, e.estado].filter(Boolean).join("/"),
    e.cep ? `${t("CEP")} ${cep(e.cep)}` : null,
  ]
    .filter(Boolean)
    .join(" - ");
}

function doc(v: string | null) {
  const d = (v ?? "").replace(/\D/g, "");
  if (d.length === 11) return `CPF ${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14) return `CNPJ ${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return v ?? "";
}

function Tabela({ titulo, itens, semValores, t, fmt }: { titulo: string; itens: PdfItem[]; semValores: boolean; t: T; fmt: Fmt }) {
  if (itens.length === 0) return null;
  return (
    <View style={s.section} wrap={false}>
      <Text style={s.sectionTitle}>{titulo.toUpperCase()}</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, s.cDesc]}>{t("Descrição")}</Text>
        <Text style={[s.th, s.cQtd]}>{t("Qtd.")}</Text>
        {semValores ? null : <Text style={[s.th, s.cVal]}>{t("Valor unit.")}</Text>}
        {semValores ? null : <Text style={[s.th, s.cVal]}>{t("Subtotal")}</Text>}
      </View>
      {itens.map((i, k) => (
        <View key={k} style={s.tr}>
          <View style={s.cDesc}>
            <Text>{i.descricao}</Text>
            {i.equipamento ? <Text style={s.small}>{i.equipamento}</Text> : null}
          </View>
          <Text style={s.cQtd}>{fmt.number(i.quantidade, 2)}</Text>
          {semValores ? null : <Text style={s.cVal}>{fmt.money(i.valor_unitario)}</Text>}
          {semValores ? null : <Text style={s.cVal}>{fmt.money(i.quantidade * i.valor_unitario)}</Text>}
        </View>
      ))}
    </View>
  );
}

/** PDF da OS ou do orçamento, no idioma do técnico. Total digitado à mão: itens saem sem valores, só o total. */
export function DocumentoPDF({
  d,
  geradoEm,
  t = createT(null),
  fmt = createFormat(DEFAULT_PREFS),
}: {
  d: PdfDados;
  geradoEm: string;
  t?: T;
  fmt?: Fmt;
}) {
  const { money, date } = fmt;
  const isOS = d.tipo === "os";
  const n = d.negocio;
  const nomeEmpresa = n?.nome_fantasia || n?.razao_social || t("Meu negócio");
  const semValores = d.totalManual;
  const somaServicos = d.servicos.reduce((a, i) => a + i.quantidade * i.valor_unitario, 0);
  const somaProdutos = d.produtos.reduce((a, i) => a + i.quantidade * i.valor_unitario, 0);
  const titulo = (isOS ? t("Ordem de serviço") : t("Orçamento")).toUpperCase();
  const numero = isOS ? t("OS {n}", { n: docNumber(d.numero) }) : t("ORC {n}", { n: docNumber(d.numero) });

  return (
    <Document title={`${numero} - ${nomeEmpresa}`} author={nomeEmpresa} creator="TecDesk">
      <Page size="A4" style={s.page}>
        <Text style={s.footerLeft} fixed>
          {`${numero} · ${t("gerado em {quando}", { quando: geradoEm })}`}
        </Text>
        <View style={s.header}>
          <View style={s.empresa}>
            <Text style={s.empresaNome}>{nomeEmpresa}</Text>
            {n?.razao_social && n.razao_social !== nomeEmpresa ? <Text style={s.small}>{n.razao_social}</Text> : null}
            {n?.cpf_cnpj ? <Text style={s.small}>{doc(n.cpf_cnpj)}</Text> : null}
            <Text style={s.small}>{[n?.telefone ? phone(n.telefone) : null, n?.email].filter(Boolean).join("  ·  ")}</Text>
            {n ? <Text style={s.small}>{enderecoLinha(n, t)}</Text> : null}
          </View>
          <View style={s.docBox}>
            <Text style={s.docTipo}>{titulo}</Text>
            <Text style={s.docNum}>{docNumber(d.numero)}</Text>
            <Text style={s.small}>
              {isOS ? t("Início") : t("Data")}: {date(d.data)}
            </Text>
            {isOS && d.dataEntrega ? <Text style={s.small}>{t("Entrega")}: {date(d.dataEntrega)}</Text> : null}
            {isOS && d.status ? <Text style={s.small}>{t("Status")}: {t(OS_STATUS[d.status].label)}</Text> : null}
          </View>
        </View>

        <View style={[s.section, s.box]}>
          <Text style={s.sectionTitle}>{t("Cliente").toUpperCase()}</Text>
          {d.cliente ? (
            <>
              <Text style={s.bold}>{d.cliente.nome}</Text>
              <Text style={s.small}>{[phone(d.cliente.telefone), d.cliente.email].filter(Boolean).join("  ·  ")}</Text>
              {enderecoLinha(d.cliente, t) ? <Text style={s.small}>{enderecoLinha(d.cliente, t)}</Text> : null}
            </>
          ) : (
            <Text style={s.small}>{t("Não definido")}</Text>
          )}
        </View>

        {d.equipamentos.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t("Equipamentos").toUpperCase()}</Text>
            {d.equipamentos.map((e, k) => (
              <Text key={k}>
                <Text style={s.bold}>{e.nome}</Text>
                {e.detalhe ? <Text style={s.small}>{`  ${e.detalhe}`}</Text> : null}
              </Text>
            ))}
          </View>
        ) : null}

        {d.relato ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t("Relato do cliente").toUpperCase()}</Text>
            <Text>{d.relato}</Text>
          </View>
        ) : null}

        {isOS && d.visitas.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t("Visitas técnicas").toUpperCase()}</Text>
            {d.visitas.map((v, k) => (
              <Text key={k}>
                {`${t("Visita {n}", { n: k + 1 })}: ${date(v.data)}${v.hora ? ` ${t("às {hora}", { hora: v.hora })}` : ""}${v.duracao_min ? ` - ${t("duração {tempo}", { tempo: duration(v.duracao_min) })}` : ""}`}
              </Text>
            ))}
          </View>
        ) : null}

        <Tabela titulo={t("Serviços")} itens={d.servicos} semValores={semValores} t={t} fmt={fmt} />
        <Tabela titulo={t("Produtos")} itens={d.produtos} semValores={semValores} t={t} fmt={fmt} />

        <View style={s.totais} wrap={false}>
          {!semValores ? (
            <>
              {d.servicos.length > 0 ? (
                <View style={s.totLinha}>
                  <Text style={s.small}>{t("Serviços")}</Text>
                  <Text>{money(somaServicos)}</Text>
                </View>
              ) : null}
              {d.produtos.length > 0 ? (
                <View style={s.totLinha}>
                  <Text style={s.small}>{t("Produtos")}</Text>
                  <Text>{money(somaProdutos)}</Text>
                </View>
              ) : null}
              {d.visita !== null ? (
                <View style={s.totLinha}>
                  <Text style={s.small}>{t("Visita técnica")}</Text>
                  <Text>{money(d.visita)}</Text>
                </View>
              ) : null}
              {d.frete > 0 ? (
                <View style={s.totLinha}>
                  <Text style={s.small}>{t("Frete")}</Text>
                  <Text>{money(d.frete)}</Text>
                </View>
              ) : null}
              {d.desconto > 0 ? (
                <View style={s.totLinha}>
                  <Text style={s.small}>
                    {t("Desconto")}
                    {d.descontoPct ? ` (${fmt.number(d.descontoPct, 2)}%)` : ""}
                  </Text>
                  <Text>- {money(d.desconto)}</Text>
                </View>
              ) : null}
            </>
          ) : null}
          <View style={s.totFinal}>
            <Text style={s.bold}>{t("Total")}</Text>
            <Text style={s.totFinalValor}>{money(d.total)}</Text>
          </View>
          {d.recebido ? (
            <View style={s.totLinha}>
              <Text style={s.small}>
                {d.recebido.data ? t("Recebido em {data}", { data: date(d.recebido.data) }) : t("Recebido")}
              </Text>
              <Text>{money(d.recebido.valor)}</Text>
            </View>
          ) : null}
        </View>

        {d.garantiaMeses ? (
          <View style={[s.section, { marginTop: 14 }]} wrap={false}>
            <Text style={s.sectionTitle}>{t("Garantia").toUpperCase()}</Text>
            <Text>
              {isOS && d.dataEntrega
                ? t("{meses}, de {inicio} até {fim}.", {
                    meses: d.garantiaMeses === 1 ? t("1 mês") : t("{n} meses", { n: d.garantiaMeses }),
                    inicio: date(d.dataEntrega),
                    fim: date(addMonthsISO(d.dataEntrega, d.garantiaMeses)),
                  })
                : t("{meses} a partir da entrega do serviço.", {
                    meses: d.garantiaMeses === 1 ? t("1 mês") : t("{n} meses", { n: d.garantiaMeses }),
                  })}
            </Text>
          </View>
        ) : null}

        {d.observacoes ? (
          <View style={[s.section, { marginTop: d.garantiaMeses ? 0 : 14 }]}>
            <Text style={s.sectionTitle}>{t("Observações").toUpperCase()}</Text>
            <Text>{d.observacoes}</Text>
          </View>
        ) : null}

        {isOS ? (
          <View style={s.assinaturas} wrap={false}>
            <Text style={s.assinatura}>{nomeEmpresa}</Text>
            <Text style={s.assinatura}>{d.cliente?.nome ?? t("Cliente")}</Text>
          </View>
        ) : null}

      </Page>
    </Document>
  );
}
