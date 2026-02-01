import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";

const MODE_CONFIG = {
  demo: {
    label: "DEMO",
    description: "Dados simulados. Seguro para demonstração.",
    color: "#3b82f6",
  },
  pilot: {
    label: "PILOTO",
    description: "Ambiente real controlado. Ideal para testes.",
    color: "#facc15",
  },
  live: {
    label: "AO VIVO",
    description: "Operação oficial. Dados e dinheiro reais.",
    color: "#22c55e",
  },
} as const;

/** Rotas onde o indicador não deve aparecer (landing/demo ou operacional fullscreen). */
const HIDE_INDICATOR_PATHS = ["/", "/demo", "/op/tpv", "/op/kds"];

export function ModeIndicator() {
  const { pathname } = useLocation();
  const { runtime } = useRestaurantRuntime();
  const mode = runtime.productMode ?? "demo";
  const [open, setOpen] = useState(false);
  const config = MODE_CONFIG[mode];

  /** Em produção não mostrar indicador de modo (demo/piloto/live) ao utilizador final. */
  if (import.meta.env.PROD) {
    return null;
  }

  if (HIDE_INDICATOR_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 12,
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          borderRadius: 999,
          backgroundColor: "rgba(15,23,42,0.9)",
          border: "1px solid rgba(148,163,184,0.5)",
          color: "#e5e7eb",
          fontSize: 11,
          cursor: "pointer",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 10,
            height: 10,
            borderRadius: "999px",
            backgroundColor: config.color,
          }}
        />
        <span style={{ fontWeight: 600 }}>{config.label}</span>
      </div>
      {open && (
        <div
          style={{
            position: "fixed",
            top: 32,
            left: 12,
            zIndex: 1100,
            maxWidth: 260,
            padding: "10px 12px",
            borderRadius: 8,
            backgroundColor: "#020617",
            border: "1px solid rgba(148,163,184,0.7)",
            boxShadow: "0 10px 25px rgba(15,23,42,0.7)",
            color: "#e5e7eb",
            fontSize: 12,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <strong style={{ color: config.color }}>{config.label}</strong>
          </div>
          <p style={{ margin: 0, marginBottom: 6, lineHeight: 1.4 }}>
            {config.description}
          </p>
          <p
            style={{
              margin: 0,
              marginTop: 4,
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            O modo do restaurante é definido pelo contrato. Esta indicação é
            apenas leitura.
          </p>
        </div>
      )}
    </>
  );
}
