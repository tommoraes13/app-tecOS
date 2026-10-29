"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback, Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
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
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState(perfil.nome ?? "");
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
    if (!file.type.startsWith("image/")) return setMsg({ kind: "error", text: "Escolha uma imagem (JPG, PNG ou WEBP)." });
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
      setMsg({ kind: "ok", text: "Foto atualizada." });
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: "Não foi possível enviar a foto agora. Tente outra imagem." });
    } finally {
      setEnviando(false);
    }
  }

  function removerFoto() {
    start(async () => {
      const r = await salvarFoto(null);
      if (!r.ok) return setMsg({ kind: "error", text: r.error });
      setFoto(null);
      router.refresh();
    });
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await salvarPerfil({ nome_exibicao: nome, moeda, fuso });
      setMsg(r.ok ? { kind: "ok", text: "Dados da conta salvos." } : { kind: "error", text: r.error });
      if (r.ok) router.refresh();
    });
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={salvar} className="grid gap-5">
        <h2 className="text-[15px] font-semibold">Perfil</h2>

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
              {enviando ? "Enviando…" : foto ? "Trocar foto" : "Enviar foto"}
            </Button>
            {foto ? (
              <Button variant="ghost" onClick={removerFoto} disabled={pending} icon={<Trash2 />}>
                Remover
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nome de exibição" htmlFor="pf-nome" hint="Aparece na saudação do Dashboard e no menu da conta">
              <Input id="pf-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Exemplo: Everton" />
            </Field>
          </div>
          <Field label="Moeda" htmlFor="pf-moeda">
            <Select id="pf-moeda" value={moeda} onChange={(e) => setMoeda(e.target.value)}>
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar (US$)</option>
              <option value="EUR">Euro (€)</option>
            </Select>
          </Field>
          <Field label="Fuso horário" htmlFor="pf-fuso" hint="Usado para datas, agenda e saudação">
            <Select id="pf-fuso" value={fuso} onChange={(e) => setFuso(e.target.value)}>
              <optgroup label="Brasil">
                {FUSOS_BR.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </optgroup>
              {outrosFusos.length ? (
                <optgroup label="Outros países">
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
            {pending ? "Salvando…" : "Salvar perfil"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
