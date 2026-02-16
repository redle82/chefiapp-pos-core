/**
 * BillingEmailCard — E-mail de faturação + salvar.
 * Ref: Correo de facturación — notificaciones y facturas.
 */

import { useState } from "react";

interface BillingEmailCardProps {
  initialEmail: string;
  onSave?: (email: string) => void;
}

export function BillingEmailCard({
  initialEmail,
  onSave,
}: BillingEmailCardProps) {
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave?.(email);
      setSaved(true);
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
          margin: "0 0 8px 0",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        Correo de facturación
      </h3>
      <p
        style={{
          margin: "0 0 12px 0",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        Enviaremos notificaciones de facturación y facturas a esta dirección.
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="legal@empresa.es"
          style={{
            flex: "1 1 200px",
            minWidth: 0,
            padding: "8px 12px",
            fontSize: 14,
            border: "1px solid var(--surface-border)",
            borderRadius: 8,
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-inverse)",
            backgroundColor: "var(--color-primary)",
            border: "none",
            borderRadius: 8,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "var(--color-success)" }}>Guardado</span>
        )}
      </div>
    </div>
  );
}
