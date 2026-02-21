/**
 * Card Sub-marcas — lista + CTA añadir.
 */
// @ts-nocheck


import { useState, useCallback } from "react";
import { marcasStore } from "../store/marcasStore";

export function SubMarcasCard() {
  const [subs, setSubs] = useState(marcasStore.getSubs());
  const refresh = useCallback(() => setSubs(marcasStore.getSubs()), []);

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
        Sub-marcas
      </h3>
      <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--text-secondary)" }}>
        Marcas secundarias o virtuales asociadas al restaurante.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--surface-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Nombre</th>
              <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Descripción</th>
              <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
                  No hay sub-marcas. Añade una con el botón +.
                </td>
              </tr>
            ) : (
              subs.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                  <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 500 }}>{b.name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{b.description || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        marcasStore.deleteSub(b.id);
                        refresh();
                      }}
                      style={{
                        fontSize: 13,
                        color: "var(--color-error)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => {
            const name = window.prompt("Nombre de la sub-marca");
            if (name) {
              marcasStore.addSub(name, "");
              refresh();
            }
          }}
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
          + Añadir sub-marca
        </button>
      </div>
    </div>
  );
}
