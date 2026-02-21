/**
 * Card 1 — Entidade legal principal (obrigatório).
 * Quem é a empresa/pessoa que responde legalmente.
 * Aviso ao alterar: "Alterar estes dados afeta faturas e relatórios fiscais."
 */
// @ts-nocheck


import { useState, useEffect } from "react";
import type { LegalEntity, LegalEntityType } from "../types";
import { legalEntitiesStore } from "../store/legalEntitiesStore";

const ENTITY_TYPES: { value: LegalEntityType; label: string }[] = [
  { value: "person", label: "Pessoa física" },
  { value: "company", label: "Empresa" },
];

export function LegalEntityMainCard() {
  const [form, setForm] = useState({
    type: "company" as LegalEntityType,
    legalName: "",
    taxId: "",
    fiscalCountry: "",
    fiscalAddress: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAviso, setShowAviso] = useState(false);

  useEffect(() => {
    const entity = legalEntitiesStore.getEntity();
    if (entity) {
      setForm({
        type: entity.type,
        legalName: entity.legalName,
        taxId: entity.taxId,
        fiscalCountry: entity.fiscalCountry,
        fiscalAddress: entity.fiscalAddress,
      });
    }
  }, []);

  const handleSave = () => {
    setShowAviso(true);
  };

  const handleConfirmSave = () => {
    setSaving(true);
    setSaved(false);
    try {
      legalEntitiesStore.saveEntity(form);
      setSaved(true);
      setShowAviso(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid var(--surface-border)",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "var(--card-bg-on-dark)",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        Entidad legal principal
      </h3>
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        Quién es la empresa o persona que responde legalmente por facturación y
        documentos fiscales.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            Tipo de entidad
          </span>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as LegalEntityType }))
            }
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid var(--surface-border)",
              borderRadius: 8,
              boxSizing: "border-box",
            }}
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            Razón social / Nombre legal
          </span>
          <input
            type="text"
            value={form.legalName}
            onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
            placeholder="Ej. Sofia Gastrobar SL"
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid var(--surface-border)",
              borderRadius: 8,
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            NIF / CIF / VAT ID
          </span>
          <input
            type="text"
            value={form.taxId}
            onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
            placeholder="Ej. B12345678"
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid var(--surface-border)",
              borderRadius: 8,
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            País fiscal
          </span>
          <input
            type="text"
            value={form.fiscalCountry}
            onChange={(e) =>
              setForm((f) => ({ ...f, fiscalCountry: e.target.value }))
            }
            placeholder="ES, PT, etc."
            maxLength={3}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid var(--surface-border)",
              borderRadius: 8,
              boxSizing: "border-box",
              maxWidth: 80,
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            Dirección fiscal completa
          </span>
          <textarea
            value={form.fiscalAddress}
            onChange={(e) =>
              setForm((f) => ({ ...f, fiscalAddress: e.target.value }))
            }
            placeholder="Calle, número, código postal, ciudad, país"
            rows={3}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid var(--surface-border)",
              borderRadius: 8,
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </label>
      </div>

      {showAviso && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: "var(--status-warning-bg)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--status-warning-text)",
          }}
        >
          Alterar estes dados afeta faturas e relatórios fiscais. Confirma?
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={saving}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-inverse)",
                backgroundColor: "var(--color-primary)",
                border: "none",
                borderRadius: 8,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Guardando…" : "Sí, guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowAviso(false)}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                color: "var(--text-secondary)",
                border: "1px solid var(--surface-border)",
                borderRadius: 8,
                cursor: "pointer",
                backgroundColor: "var(--card-bg-on-dark)",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!showAviso && (
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-inverse)",
              backgroundColor: "var(--color-primary)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Guardar
          </button>
          {saved && (
            <span style={{ fontSize: 13, color: "var(--color-success)" }}>Guardado</span>
          )}
        </div>
      )}
    </div>
  );
}
