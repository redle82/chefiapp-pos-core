/**
 * ImpresorasPage — Impresoras e rotas de impressão.
 */

import { useState, useCallback } from "react";
import { impresorasStore } from "../store/impresorasStore";

export function ImpresorasPage() {
  const [printers, setPrinters] = useState(impresorasStore.getPrinters());
  const [routes, setRoutes] = useState(impresorasStore.getRoutes());
  const refresh = useCallback(() => {
    setPrinters(impresorasStore.getPrinters());
    setRoutes(impresorasStore.getRoutes());
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px 0", color: "#111827" }}>
          Impresoras
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Impresoras y rutas de impresión por tipo de pedido o categoría.
        </p>
      </header>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            backgroundColor: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Impresoras</h3>
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("Nombre de la impresora");
                if (name) {
                  impresorasStore.addPrinter(name, "kitchen", "network");
                  refresh();
                }
              }}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "#7c3aed",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              + Añadir impresora
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>Tipo</th>
                  <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>Conexión</th>
                  <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600, width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {printers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#6b7280", fontSize: 14 }}>
                      No hay impresoras. Añade una con el botón +.
                    </td>
                  </tr>
                ) : (
                  printers.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px", color: "#111827", fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: "12px 16px", color: "#6b7280" }}>{p.type}</td>
                      <td style={{ padding: "12px 16px", color: "#6b7280" }}>{p.connection}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          type="button"
                          onClick={() => { impresorasStore.deletePrinter(p.id); refresh(); }}
                          style={{ fontSize: 13, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}
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
        </div>
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          backgroundColor: "#fff",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
          Rutas de impresión
        </h3>
        <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#6b7280" }}>
          Asigna qué impresora recibe cada tipo de pedido o categoría.
        </p>
        {routes.length === 0 ? (
          <p style={{ padding: 24, textAlign: "center", color: "#6b7280", fontSize: 14, margin: 0 }}>
            No hay rutas. Añade impresoras primero y luego crea rutas.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>Ruta</th>
                  <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>Impresora</th>
                  <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600, width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", color: "#111827", fontWeight: 500 }}>{r.name}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{r.trigger}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        type="button"
                        onClick={() => { impresorasStore.deleteRoute(r.id); refresh(); }}
                        style={{ fontSize: 13, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
