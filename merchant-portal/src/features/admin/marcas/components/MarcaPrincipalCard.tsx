/**
 * Card Marca principal — nome e descrição.
 */

import { useState, useEffect } from "react";
import { marcasStore } from "../store/marcasStore";

export function MarcaPrincipalCard() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const main = marcasStore.getMain();
    if (main) {
      setName(main.name);
      setDescription(main.description);
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaved(false);
    marcasStore.saveMain({ name, description });
    setSaving(false);
    setSaved(true);
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
      <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
        Marca principal
      </h3>
      <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#6b7280" }}>
        Nombre y descripción de la marca principal del restaurante.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Sofia Gastrobar"
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
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción de la marca"
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
        {saved && <span style={{ fontSize: 13, color: "#059669" }}>Guardado</span>}
      </div>
    </div>
  );
}
