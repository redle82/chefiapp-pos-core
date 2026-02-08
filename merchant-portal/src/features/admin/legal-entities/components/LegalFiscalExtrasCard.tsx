/**
 * Card 4 — Dados fiscais adicionais (opcional).
 * Texto padrão de rodapé fiscal, referência legal, observações internas (não no recibo).
 */

import { useState, useEffect } from "react";
import type { LegalFiscalExtras } from "../types";
import { legalEntitiesStore } from "../store/legalEntitiesStore";

export function LegalFiscalExtrasCard() {
  const [form, setForm] = useState<LegalFiscalExtras>({
    defaultFiscalFooter: "",
    legalReference: "",
    internalNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(legalEntitiesStore.getExtras());
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaved(false);
    try {
      legalEntitiesStore.saveExtras(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "#fff",
      }}
    >
      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: 16,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Datos fiscales adicionales
      </h3>
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        Opcional. Texto fiscal en recibos, referencia legal (ej. Registro
        mercantil). Las observaciones internas no aparecen en el recibo.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Texto estándar de pie fiscal
          </span>
          <textarea
            value={form.defaultFiscalFooter}
            onChange={(e) =>
              setForm((f) => ({ ...f, defaultFiscalFooter: e.target.value }))
            }
            placeholder="Ej. Inscrita en el Registro Mercantil..."
            rows={2}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Referencia legal
          </span>
          <input
            type="text"
            value={form.legalReference}
            onChange={(e) =>
              setForm((f) => ({ ...f, legalReference: e.target.value }))
            }
            placeholder="Ej. Registro mercantil de Madrid, tomo 12345"
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Observaciones legales internas (no en recibo)
          </span>
          <textarea
            value={form.internalNotes}
            onChange={(e) =>
              setForm((f) => ({ ...f, internalNotes: e.target.value }))
            }
            placeholder="Solo uso interno"
            rows={2}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </label>
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#7c3aed",
            border: "none",
            borderRadius: 8,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "#059669" }}>Guardado</span>
        )}
      </div>
    </div>
  );
}
