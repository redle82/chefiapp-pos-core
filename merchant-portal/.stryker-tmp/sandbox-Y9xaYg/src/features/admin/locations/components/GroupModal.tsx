/**
 * GroupModal — Criar/editar Grupo de ubicaciones: nombre + multi-select de ubicaciones.
 */

import { useState, useEffect } from "react";
import type { Location, LocationGroup } from "../types";

interface GroupModalProps {
  group: LocationGroup | null; // null = crear
  locations: Location[];
  onClose: () => void;
  onSave: (name: string, locationIds: string[]) => void;
}

export function GroupModal({
  group,
  locations,
  onClose,
  onSave,
}: GroupModalProps) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (group) {
      setName(group.name);
      setSelectedIds(new Set(group.locationIds));
    } else {
      setName("");
      setSelectedIds(new Set());
    }
  }, [group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, Array.from(selectedIds));
    onClose();
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isEdit = !!group;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--card-bg-on-dark)",
          borderRadius: 12,
          maxWidth: 420,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 24, borderBottom: "1px solid var(--surface-border)" }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {isEdit ? "Editar grupo" : "Nuevo grupo de ubicaciones"}
            </h2>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Nombre del grupo
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej. Ibiza, Franquicias, Temporada 2026"
                style={{
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  boxSizing: "border-box",
                }}
              />
            </label>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>
                Ubicaciones
              </span>
              {locations.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                  Crea primero al menos una ubicación.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                  {locations.map((loc) => (
                    <label
                      key={loc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "var(--text-primary)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(loc.id)}
                        onChange={() => toggle(loc.id)}
                      />
                      {loc.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              padding: 24,
              borderTop: "1px solid var(--surface-border)",
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                color: "var(--text-secondary)",
                border: "1px solid var(--surface-border)",
                borderRadius: 8,
                cursor: "pointer",
                backgroundColor: "transparent",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={locations.length === 0}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-inverse)",
                backgroundColor: "var(--color-primary)",
                border: "none",
                borderRadius: 8,
                cursor: locations.length === 0 ? "not-allowed" : "pointer",
                opacity: locations.length === 0 ? 0.6 : 1,
              }}
            >
              {isEdit ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
