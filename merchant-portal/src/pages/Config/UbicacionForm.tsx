/**
 * UbicacionForm — Formulário criar/editar localização (ChefIApp).
 * Campos mínimos operacionais; sem billing, sem fiscal. Ref: CONFIG_LOCATION_VS_CONTRACT.md.
 */

import React from "react";
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  space,
  tapTarget,
} from "@chefiapp/core-design-system";
import type { Location } from "../../features/admin/locations/types";

const CURRENCIES = [
  { value: "EUR", label: "EUR" },
  { value: "BRL", label: "BRL" },
  { value: "USD", label: "USD" },
];
const TIMEZONES = [
  { value: "Europe/Madrid", label: "Europe/Madrid" },
  { value: "Europe/Lisbon", label: "Europe/Lisbon" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
  { value: "UTC", label: "UTC" },
];

export type UbicacionFormData = Omit<Location, "id" | "createdAt" | "updatedAt">;

const emptyForm = (): UbicacionFormData => ({
  name: "",
  address: "",
  country: "",
  city: "",
  postalCode: "",
  timezone: "Europe/Madrid",
  currency: "EUR",
  isActive: true,
  isPrimary: false,
});

export const getEmptyForm = emptyForm;

const inputStyle: React.CSSProperties = {
  padding: `${space.sm}px ${space.md}px`,
  fontSize: fontSize.sm,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  boxSizing: "border-box",
  width: "100%",
  fontFamily: fontFamily.sans,
  color: colors.textPrimary,
  backgroundColor: colors.background,
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: space.xs,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  color: colors.textPrimary,
};

interface UbicacionFormProps {
  initial?: UbicacionFormData | null;
  onSubmit: (data: UbicacionFormData) => void;
  onCancel: () => void;
  submitLabel: string;
}

export function UbicacionForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: UbicacionFormProps) {
  const [form, setForm] = React.useState<UbicacionFormData>(() => initial ?? emptyForm());

  React.useEffect(() => {
    setForm(initial ?? emptyForm());
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: fontFamily.sans }}>
      <div style={{ display: "flex", flexDirection: "column", gap: space.lg }}>
        <label style={labelStyle}>
          Nome
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            placeholder="Ex.: Sofia Gastrobar Ibiza"
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Endereço
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Rua, número, código postal, cidade, país"
            style={inputStyle}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.md }}>
          <label style={labelStyle}>
            Cidade
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Código postal
            <input
              type="text"
              value={form.postalCode}
              onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              style={inputStyle}
            />
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.md }}>
          <label style={labelStyle}>
            País (código)
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              placeholder="ES, PT, BR"
              maxLength={3}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Moeda
            <select
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              style={inputStyle}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label style={labelStyle}>
          Fuso horário (IANA)
          <select
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            style={inputStyle}
          >
            {TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: "flex", gap: space.lg, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: space.sm, cursor: "pointer", fontSize: fontSize.sm, color: colors.textPrimary }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Ativo
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: space.sm, cursor: "pointer", fontSize: fontSize.sm, color: colors.textPrimary }}>
            <input
              type="checkbox"
              checked={form.isPrimary ?? false}
              onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
            />
            Principal
          </label>
        </div>
      </div>
      <div
        style={{
          marginTop: space.xl,
          paddingTop: space.lg,
          borderTop: `1px solid ${colors.border}`,
          display: "flex",
          gap: space.md,
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            minHeight: tapTarget.min,
            padding: `0 ${space.lg}`,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
            color: colors.textSecondary,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          style={{
            minHeight: tapTarget.min,
            padding: `0 ${space.lg}`,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: colors.textInverse,
            backgroundColor: colors.accent,
            border: "none",
            borderRadius: radius.md,
            cursor: "pointer",
          }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
