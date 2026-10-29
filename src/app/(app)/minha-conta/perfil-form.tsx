"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { LOCALE_NAMES } from "@/components/layout/language-select";
import { Avatar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback, Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { LOCALES } from "@/i18n/config";
import type { Perfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/client";
import { salvarFoto, salvarPerfil } from "./actions";

const FUSOS_BR = [
  ["America/Sao_Paulo", "Brasília (SP, RJ, MG, Sul, GO, DF)"],
  ["America/Bahia", "Bahia"],
  ["America/Fortaleza", "Nordeste (CE, RN, PB, PE, PI, MA, AL, SE)"],
  ["America/Belem", "Pará e Amapá"],
  ["America/Manaus", "Amazonas"],
  ["America/Cuiaba", "Mato Grosso"],
  ["America/Campo_Grande", "Mato Grosso do Sul"],
  ["America/Porto_Velho", "Rondônia"],
  ["America/Boa_Vista", "Roraima"],
  ["America/Rio_Branco", "Acre"],
  ["America/Noronha", "Fernando de Noronha"],
] as const;

/** Reduz a foto para 320×320 (corte central) antes de enviar. */
async function prepararFoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const lado = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, (bitmap.width - lado) / 2, (bitmap.height - lado) / 2, lado, lado, 0, 0, 320, 320);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.85),
  );
}

export function PerfilForm({ perfil }: { perfil: Perfil }) {
  const { t } = useI18n();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState(perfil.nome ?? "");
  const [idioma, setIdioma] = useState(perfil.idioma);
  const [moeda, setMoeda] = useState(perfil.moeda);
  const [fuso, setFuso] = useState(perfil.fuso);
  const [foto, setFoto] = useState(perfil.fotoUrl);
  const [enviando, setEnviando] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const outrosFusos = useMemo(() => {
    try {
      const all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
      const br = new Set<string>(FUSOS_BR.map(([v]) => v));
      return all.filter((z) => !br.has(z));
    } catch {
      return [] as string[];
    }
  }, []);

  async function trocarFoto(file: File) {
    setMsg(null);
    if (!file.type.startsWith("image/")) return setMsg({ kind: "error", text: t("Escolha uma imagem (JPG, PNG ou WEBP).") });
    setEnviando(true);
    try {
      const blob = await prepararFoto(file);
      const path = `${perfil.id}/foto-${Date.now()}.jpg`;
      const { error } = await createClient().storage.from("avatars").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (error) throw error;
      const r = await salvarFoto(path);
      if (!r.ok) throw new Error(r.error);
      setFoto(URL.createObjectURL(blob));
      setMsg({ kind: "ok", text: t("Foto atualizada.") });
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: t("Não foi possível enviar a foto agora. Tente outra imagem.") });
    } finally {
      setEnviando(false);
    }
  }

  function removerFoto() {
    start(async () => {
      const r = await salvarFoto(null);
      if (!r.ok) return setMsg({ kind: "error", text: t(r.error) });
      setFoto(null);
      router.refresh();
    });
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await salvarPerfil({ nome_exibicao: nome, idioma, moeda, fuso });
      setMsg(r.ok ? { kind: "ok", text: t("Dados da conta salvos.") } : { kind: "error", text: t(r.error) });
      if (r.ok) router.refresh();
    });
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={salvar} className="grid gap-5">
        <h2 className="text-[15px] font-semibold">{t("Perfil")}</h2>

        <div className="flex flex-wrap items-center gap-4">
          <Avatar user={{ nome, email: perfil.email, fotoUrl: foto }} size={72} />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void trocarFoto(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={enviando}
              icon={enviando ? <Loader2 className="animate-spin" /> : <Camera />}
            >
              {enviando ? t("Enviando…") : foto ? t("Trocar foto") : t("Enviar foto")}
            </Button>
            {foto ? (
              <Button variant="ghost" onClick={removerFoto} disabled={pending} icon={<Trash2 />}>
                {t("Remover")}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={t("Nome de exibição")} htmlFor="pf-nome" hint={t("Aparece na saudação do Dashboard e no menu da conta")}>
              <Input id="pf-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t("Exemplo: Everton")} />
            </Field>
          </div>
          <Field label={t("Idioma")} htmlFor="pf-idioma" hint={t("Idioma das telas, do PDF e das mensagens")}>
            <Select id="pf-idioma" value={idioma} onChange={(e) => setIdioma(e.target.value)}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Moeda")} htmlFor="pf-moeda">
            <Select id="pf-moeda" value={moeda} onChange={(e) => setMoeda(e.target.value)}>
              <option value="BRL">{t("Real (R$)")}</option>
              <option value="USD">{t("Dólar (US$)")}</option>
              <option value="EUR">{t("Euro (€)")}</option>
            </Select>
          </Field>
          <Field label={t("Fuso horário")} htmlFor="pf-fuso" hint={t("Usado para datas, agenda e saudação")}>
            <Select id="pf-fuso" value={fuso} onChange={(e) => setFuso(e.target.value)}>
              <optgroup label={t("Brasil")}>
                {FUSOS_BR.map(([v, l]) => (
                  <option key={v} value={v}>
                    {t(l)}
                  </option>
                ))}
              </optgroup>
              {outrosFusos.length ? (
                <optgroup label={t("Outros países")}>
                  {outrosFusos.map((z) => (
                    <option key={z} value={z}>
                      {z.replace(/_/g, " ")}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </Select>
          </Field>
        </div>

        {msg ? <Feedback kind={msg.kind}>{msg.text}</Feedback> : null}

        <div className="flex justify-end">
          <Button type="submit" variant="dark" disabled={pending} className="w-full sm:w-auto">
            {pending ? t("Salvando…") : t("Salvar perfil")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
