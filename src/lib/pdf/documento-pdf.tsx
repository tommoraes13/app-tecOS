import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { OS_STATUS } from "@/components/ui/status-badge";
import { cep, date, docNumber, duration, money, phone } from "@/lib/format";
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

function enderecoLinha(e: {
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}) {
  return [
    [e.endereco, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.cidade, e.estado].filter(Boolean).join("/"),
    e.cep ? `CEP ${cep(e.cep)}` : null,
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

function Tabela({ titulo, itens, semValores }: { titulo: string; itens: PdfItem[]; semValores: boolean }) {
  if (itens.length === 0) return null;
  return (
    <View style={s.section} wrap={false}>
      <Text style={s.sectionTitle}>{titulo.toUpperCase()}</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, s.cDesc]}>Descrição</Text>
        <Text style={[s.th, s.cQtd]}>Qtd.</Text>
        {semValores ? null : <Text style={[s.th, s.cVal]}>Valor unit.</Text>}
        {semValores ? null : <Text style={[s.th, s.cVal]}>Subtotal</Text>}
      </View>
      {itens.map((i, k) => (
        <View key={k} style={s.tr}>
          <View style={s.cDesc}>
            <Text>{i.descricao}</Text>
            {i.equipamento ? <Text style={s.small}>{i.equipamento}</Text> : null}
          </View>
          <Text style={s.cQtd}>{String(i.quantidade).replace(".", ",")}</Text>
          {semValores ? null : <Text style={s.cVal}>{money(i.valor_unitario)}</Text>}
          {semValores ? null : <Text style={s.cVal}>{money(i.quantidade * i.valor_unitario)}</Text>}
        </View>
      ))}
    </View>
  );
}

/** PDF da OS ou do orçamento. Total digitado à mão: itens saem sem valores, só o total. */
export function DocumentoPDF({ d, geradoEm }: { d: PdfDados; geradoEm: string }) {
  const isOS = d.tipo === "os";
  const n = d.negocio;
  const nomeEmpresa = n?.nome_fantasia || n?.razao_social || "Meu negócio";
  const semValores = d.totalManual;
  const somaServicos = d.servicos.reduce((a, i) => a + i.quantidade * i.valor_unitario, 0);
  const somaProdutos = d.produtos.reduce((a, i) => a + i.quantidade * i.valor_unitario, 0);
  const titulo = isOS ? "ORDEM DE SERVIÇO" : "ORÇAMENTO";
  const numero = `${isOS ? "OS" : "ORC"} ${docNumber(d.numero)}`;

  return (
    <Document title={`${numero} - ${nomeEmpresa}`} author={nomeEmpresa} creator="TecDesk">
      <Page size="A4" style={s.page}>
        <Text style={s.footerLeft} fixed>
          {`${numero} · gerado em ${geradoEm}`}
        </Text>
        <View style={s.header}>
          <View style={s.empresa}>
            <Text style={s.empresaNome}>{nomeEmpresa}</Text>
            {n?.razao_social && n.razao_social !== nomeEmpresa ? <Text style={s.small}>{n.razao_social}</Text> : null}
            {n?.cpf_cnpj ? <Text style={s.small}>{doc(n.cpf_cnpj)}</Text> : null}
            <Text style={s.small}>{[n?.telefone ? phone(n.telefone) : null, n?.email].filter(Boolean).join("  ·  ")}</Text>
            {n ? <Text style={s.small}>{enderecoLinha(n)}</Text> : null}
          </View>
          <View style={s.docBox}>
            <Text style={s.docTipo}>{titulo}</Text>
            <Text style={s.docNum}>{docNumber(d.numero)}</Text>
            <Text style={s.small}>
              {isOS ? "Início" : "Data"}: {date(d.data)}
            </Text>
            {isOS && d.dataEntrega ? <Text style={s.small}>Entrega: {date(d.dataEntrega)}</Text> : null}
            {isOS && d.status ? <Text style={s.small}>Status: {OS_STATUS[d.status].label}</Text> : null}
          </View>
        </View>

        <View style={[s.section, s.box]}>
          <Text style={s.sectionTitle}>CLIENTE</Text>
          {d.cliente ? (
            <>
              <Text style={s.bold}>{d.cliente.nome}</Text>
              <Text style={s.small}>{[phone(d.cliente.telefone), d.cliente.email].filter(Boolean).join("  ·  ")}</Text>
              {enderecoLinha(d.cliente) ? <Text style={s.small}>{enderecoLinha(d.cliente)}</Text> : null}
            </>
          ) : (
            <Text style={s.small}>Não definido</Text>
          )}
        </View>

        {d.equipamentos.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>EQUIPAMENTOS</Text>
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
            <Text style={s.sectionTitle}>RELATO DO CLIENTE</Text>
            <Text>{d.relato}</Text>
          </View>
        ) : null}

        {isOS && d.visitas.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>VISITAS TÉCNICAS</Text>
            {d.visitas.map((v, k) => (
              <Text key={k}>
                {`Visita ${k + 1}: ${date(v.data)}${v.hora ? ` às ${v.hora}` : ""}${v.duracao_min ? ` - duração ${duration(v.duracao_min)}` : ""}`}
              </Text>
            ))}
          </View>
        ) : null}

        <Tabela titulo="Serviços" itens={d.servicos} semValores={semValores} />
        <Tabela titulo="Produtos" itens={d.produtos} semValores={semValores} />

        {!semValores && d.despesas.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>DESPESAS</Text>
            {d.despesas.map((x) => (
              <View key={x.label} style={[s.row, { justifyContent: "space-between", maxWidth: 260 }]}>
                <Text>{x.label}</Text>
                <Text>{money(x.valor)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={s.totais} wrap={false}>
          {!semValores ? (
            <>
              {d.servicos.length > 0 ? (
                <View style={s.totLinha}>
                  <Text style={s.small}>Serviços</Text>
                  <Text>{money(somaServicos)}</Text>
                </View>
              ) : null}
              {d.produtos.length > 0 ? (
                <View style={s.totLinha}>
                  <Text style={s.small}>Produtos</Text>
                  <Text>{money(somaProdutos)}</Text>
                </View>
              ) : null}
              {d.despesas.length > 0 ? (
                <View style={s.totLinha}>
                  <Text style={s.small}>Despesas</Text>
                  <Text>{money(d.despesas.reduce((a, x) => a + x.valor, 0))}</Text>
                </View>
              ) : null}
              {d.visita !== null ? (
                <View style={s.totLinha}>
                  <Text style={s.small}>Visita técnica</Text>
                  <Text>{money(d.visita)}</Text>
                </View>
              ) : null}
            </>
          ) : null}
          <View style={s.totFinal}>
            <Text style={s.bold}>Total</Text>
            <Text style={s.totFinalValor}>{money(d.total)}</Text>
          </View>
          {d.recebido ? (
            <View style={s.totLinha}>
              <Text style={s.small}>Recebido{d.recebido.data ? ` em ${date(d.recebido.data)}` : ""}</Text>
              <Text>{money(d.recebido.valor)}</Text>
            </View>
          ) : null}
        </View>

        {d.observacoes ? (
          <View style={[s.section, { marginTop: 14 }]}>
            <Text style={s.sectionTitle}>OBSERVAÇÕES</Text>
            <Text>{d.observacoes}</Text>
          </View>
        ) : null}

        {isOS ? (
          <View style={s.assinaturas} wrap={false}>
            <Text style={s.assinatura}>{nomeEmpresa}</Text>
            <Text style={s.assinatura}>{d.cliente?.nome ?? "Cliente"}</Text>
          </View>
        ) : null}

      </Page>
    </Document>
  );
}
