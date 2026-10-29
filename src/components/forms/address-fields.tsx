"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, MapPin } from "lucide-react";
import { Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { buscarCep } from "@/lib/cep";
import { buscarEnderecos, type SugestaoEndereco } from "@/lib/enderecos";
import { cep as formatCep } from "@/lib/format";
import { UFS } from "@/lib/labels";

export type Address = {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

/**
 * CEP + endereço. Ao completar o CEP, preenche rua, bairro, cidade e estado pelo ViaCEP.
 * Ao digitar o endereço, mostra sugestões (OpenStreetMap) e, ao escolher uma, preenche o resto.
 */
export function AddressFields({
  value,
  onChange,
  idPrefix,
}: {
  value: Address;
  onChange: (patch: Partial<Address>) => void;
  idPrefix: string;
}) {
  const { t, prefs } = useI18n();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [termo, setTermo] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  // Sugestões de endereço: espera parar de digitar; só busca o que a pessoa digitou (não o que o CEP preencheu).
  useEffect(() => {
    if (termo === null || termo.trim().length < 4) {
      setSugestoes([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setBuscando(true);
      try {
        const pais = prefs.locale === "pt-BR" ? "BR" : "";
        const base = [termo, value.cidade].filter(Boolean).join(", ");
        setSugestoes(await buscarEnderecos(base, pais, ctrl.signal));
      } catch {
        setSugestoes([]);
      } finally {
        setBuscando(false);
      }
    }, 450);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo]);

  useEffect(() => {
    if (!sugestoes.length) return;
    const fora = (e: MouseEvent | TouchEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setSugestoes([]);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("touchstart", fora);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("touchstart", fora);
    };
  }, [sugestoes.length]);

  function escolher(s: SugestaoEndereco) {
    setTermo(null);
    setSugestoes([]);
    onChange({
      endereco: s.endereco || value.endereco,
      numero: s.numero || value.numero,
      bairro: s.bairro || value.bairro,
      cidade: s.cidade || value.cidade,
      estado: s.estado || value.estado,
      cep: s.cep ? formatCep(s.cep) : value.cep,
    });
  }

  async function onCep(raw: string) {
    const formatted = formatCep(raw);
    onChange({ cep: formatted });
    const digits = formatted.replace(/\D/g, "");
    if (digits.length !== 8) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const found = await buscarCep(digits);
    if (!found) {
      setStatus("error");
      return;
    }
    setStatus("ok");
    onChange({
      endereco: found.endereco || value.endereco,
      bairro: found.bairro || value.bairro,
      cidade: found.cidade,
      estado: found.estado,
    });
  }

  const id = (k: string) => `${idPrefix}-${k}`;

  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <Field label={t("CEP")} htmlFor={id("cep")}>
          <div className="relative">
            <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle" />
            <Input
              id={id("cep")}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={value.cep}
              onChange={(e) => onCep(e.target.value)}
              className="pl-9 font-mono"
            />
          </div>
        </Field>
        {status === "loading" ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-subtle">
            <Loader2 className="size-3 animate-spin" /> {t("Buscando endereço…")}
          </p>
        ) : status === "ok" ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-success">
            <Check className="size-3" /> {t("Endereço preenchido automaticamente")}
          </p>
        ) : status === "error" ? (
          <p className="mt-1 text-xs text-danger">{t("CEP não encontrado. Preencha o endereço manualmente.")}</p>
        ) : null}
      </div>
      <div className="sm:col-span-4">
        <Field label={t("Endereço")} htmlFor={id("endereco")} hint={t("Digite para buscar; escolha uma sugestão para preencher o resto")}>
          <div ref={caixa} className="relative">
            <Input
              id={id("endereco")}
              autoComplete="off"
              role="combobox"
              aria-expanded={sugestoes.length > 0}
              aria-controls={id("sugestoes")}
              value={value.endereco}
              onChange={(e) => {
                onChange({ endereco: e.target.value });
                setTermo(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Escape" && setSugestoes([])}
            />
            {buscando ? <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-ink-subtle" /> : null}
            {sugestoes.length ? (
              <ul
                id={id("sugestoes")}
                role="listbox"
                className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-pop"
              >
                {sugestoes.map((s) => (
                  <li key={s.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => escolher(s)}
                      className="flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-muted"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
                      <span className="min-w-0">
                        <span className="block truncate">{s.titulo}</span>
                        {s.detalhe ? <span className="block truncate text-xs text-ink-subtle">{s.detalhe}</span> : null}
                      </span>
                    </button>
                  </li>
                ))}
                <li className="px-3 pt-1 pb-1.5 text-[11px] text-ink-subtle">© OpenStreetMap</li>
              </ul>
            ) : null}
          </div>
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label={t("Número@@endereço")} htmlFor={id("numero")}>
          <Input id={id("numero")} value={value.numero} onChange={(e) => onChange({ numero: e.target.value })} />
        </Field>
      </div>
      <div className="sm:col-span-4">
        <Field label={t("Complemento")} htmlFor={id("complemento")}>
          <Input
            id={id("complemento")}
            placeholder={t("Apto, bloco, sala")}
            value={value.complemento}
            onChange={(e) => onChange({ complemento: e.target.value })}
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label={t("Bairro")} htmlFor={id("bairro")}>
          <Input id={id("bairro")} value={value.bairro} onChange={(e) => onChange({ bairro: e.target.value })} />
        </Field>
      </div>
      <div className="sm:col-span-3">
        <Field label={t("Cidade")} htmlFor={id("cidade")}>
          <Input id={id("cidade")} value={value.cidade} onChange={(e) => onChange({ cidade: e.target.value })} />
        </Field>
      </div>
      <div className="sm:col-span-1">
        <Field label={t("Estado@@UF")} htmlFor={id("estado")}>
          <Select id={id("estado")} value={value.estado} onChange={(e) => onChange({ estado: e.target.value })}>
            <option value="">{t("UF")}</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}
