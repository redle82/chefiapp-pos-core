/**
 * Card 3 — Texto fiscal / recibo (Configuración > General).
 * Ref: CONFIG_GENERAL_WIREFRAME.md. Guardar local solo para este card.
 * Persistência: localStorage hasta coluna dedicada (receipt_extra_text) en gm_restaurants.
 */

import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";

const STORAGE_KEY = "chefiapp_general_receipt_extra";

export function GeneralCardReceipt() {
  const { runtime } = useRestaurantRuntime();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const restaurantId = runtime.restaurant_id ?? null;

  useEffect(() => {
    if (!restaurantId) {
      setLoaded(true);
      return;
    }
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${restaurantId}`);
      if (stored != null) setValue(stored);
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [restaurantId]);

  const handleSave = () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      localStorage.setItem(`${STORAGE_KEY}_${restaurantId}`, value);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao guardar.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: 14,
  };
  const labelStyle = { display: "block" as const, fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" };
  const textareaStyle = {
    width: "100%",
    minHeight: 52,
    padding: "6px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    fontSize: 13,
    resize: "vertical" as const,
  };
  const buttonStyle = {
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: "#7c3aed",
    color: "#fff",
  };

  return (
    <section style={cardStyle} aria-labelledby="card-receipt-title">
      <h2 id="card-receipt-title" style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px 0", color: "#111827" }}>
        Texto fiscal / recibo
      </h2>
      <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#6b7280" }}>
        Información opcional que aparecerá en los recibos impresos (detalles fiscales, agradecimiento, política de devoluciones).
      </p>
      {!loaded ? (
        <p style={{ fontSize: 12, color: "#6b7280" }}>Cargando...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <label style={labelStyle}>Información adicional</label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ej.: NIF B-12345678. Gracias por su visita."
              style={textareaStyle}
              rows={2}
            />
          </div>
          <div>
            <button type="button" onClick={handleSave} disabled={saving} style={buttonStyle}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
