"use client";

import { useState } from "react";
import { Check, Loader2, MapPin } from "lucide-react";
import { Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { buscarCep } from "@/lib/cep";
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

/** CEP + endereço. Ao completar o CEP, preenche rua, bairro, cidade e estado pelo ViaCEP. */
export function AddressFields({
  value,
  onChange,
  idPrefix,
}: {
  value: Address;
  onChange: (patch: Partial<Address>) => void;
  idPrefix: string;
}) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

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
        <Field label={t("Endereço")} htmlFor={id("endereco")}>
          <Input
            id={id("endereco")}
            autoComplete="address-line1"
            value={value.endereco}
            onChange={(e) => onChange({ endereco: e.target.value })}
          />
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
