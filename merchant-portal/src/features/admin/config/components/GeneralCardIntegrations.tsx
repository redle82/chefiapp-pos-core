/**
 * Card 4 — Integraciones básicas (Configuración > General).
 * Ref: CONFIG_GENERAL_WIREFRAME.md. Guardar local solo para este card.
 * Google Place: opcional; persistência en localStorage hasta columna en gm_restaurants.
 */

import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";

const STORAGE_KEY = "chefiapp_general_google_place";

export function GeneralCardIntegrations() {
  const { runtime } = useRestaurantRuntime();
  const [googlePlace, setGooglePlace] = useState("");
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
      if (stored != null) setGooglePlace(stored);
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [restaurantId]);

  const handleSave = () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      localStorage.setItem(`${STORAGE_KEY}_${restaurantId}`, googlePlace);
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
  const inputStyle = { width: "100%", padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 };
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
    <section style={cardStyle} aria-labelledby="card-integrations-title">
      <h2 id="card-integrations-title" style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px 0", color: "#111827" }}>
        Conecta tu restaurante con Google
      </h2>
      <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#6b7280" }}>
        Añade el Google Place ID de tu restaurante para habilitar funciones como Google Reviews y más. Opcional.
      </p>
      {!loaded ? (
        <p style={{ fontSize: 12, color: "#6b7280" }}>Cargando...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <label style={labelStyle}>Busca tu restaurante por nombre o dirección</label>
            <input
              type="text"
              value={googlePlace}
              onChange={(e) => setGooglePlace(e.target.value)}
              placeholder="Ej.: SOFIA GASTROBAR IBIZA, Carrer des Caló..."
              style={inputStyle}
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
