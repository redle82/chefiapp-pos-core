/**
 * Card 2 — Uso da entidade (escopo).
 * Checkboxes: Faturação, Recibos, Relatórios fiscais.
 * "Uma entidade pode ser usada por uma ou mais ubicaciones."
 */

import { useState, useEffect } from "react";
import type { LegalEntityUsage } from "../types";
import { legalEntitiesStore } from "../store/legalEntitiesStore";

export function LegalEntityUsageCard() {
  const [usage, setUsage] = useState<LegalEntityUsage>({
    useForBilling: true,
    useForReceipts: true,
    useForFiscalReports: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUsage(legalEntitiesStore.getUsage());
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaved(false);
    try {
      legalEntitiesStore.saveUsage(usage);
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
        Uso de la entidad
      </h3>
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        Dónde se usa esta entidad legal. Una entidad puede usarse en una o más
        ubicaciones.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={usage.useForBilling}
            onChange={(e) =>
              setUsage((u) => ({ ...u, useForBilling: e.target.checked }))
            }
          />
          <span style={{ fontSize: 14, color: "#374151" }}>Facturación</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={usage.useForReceipts}
            onChange={(e) =>
              setUsage((u) => ({ ...u, useForReceipts: e.target.checked }))
            }
          />
          <span style={{ fontSize: 14, color: "#374151" }}>Recibos</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={usage.useForFiscalReports}
            onChange={(e) =>
              setUsage((u) => ({ ...u, useForFiscalReports: e.target.checked }))
            }
          />
          <span style={{ fontSize: 14, color: "#374151" }}>
            Relatórios fiscais
          </span>
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
