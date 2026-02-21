/**
 * Card Marca principal — nome e descrição.
 */
// @ts-nocheck


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
        border: "1px solid var(--surface-border)",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "var(--card-bg-on-dark)",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
        Marca principal
      </h3>
      <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--text-secondary)" }}>
        Nombre y descripción de la marca principal del restaurante.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Sofia Gastrobar"
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
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción de la marca"
            rows={2}
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
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
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
          }}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {saved && <span style={{ fontSize: 13, color: "var(--color-success)" }}>Guardado</span>}
      </div>
    </div>
  );
}
