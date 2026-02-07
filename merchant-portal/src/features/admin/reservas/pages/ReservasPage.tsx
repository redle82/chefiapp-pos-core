/**
 * ReservasPage — Disponibilidad, Garantía, Turnos, Mensajes.
 * Estrutura com secções; conteúdo mínimo por secção (Fase 2).
 */

import { useLocation, useNavigate } from "react-router-dom";

const BASE = "/admin/config";

const SECTIONS = [
  { path: "/reservas/disponibilidad", label: "Disponibilidad", id: "disponibilidad" },
  { path: "/reservas/garantia", label: "Garantía y Cancelación", id: "garantia" },
  { path: "/reservas/turnos", label: "Turnos", id: "turnos" },
  { path: "/reservas/mensajes", label: "Mensajes y recordatorios", id: "mensajes" },
  { path: "/reservas", label: "Resumen", id: "resumen" },
] as const;

export function ReservasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace(/^\/admin\/config/, "") || "/reservas";
  const current = SECTIONS.find((s) => path === s.path || path.startsWith(s.path + "/")) ?? SECTIONS[SECTIONS.length - 1];

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px 0", color: "#111827" }}>
          Reservas
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Disponibilidad, garantía, turnos, mensajes y recordatorios.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid #e5e7eb",
          flexWrap: "wrap",
        }}
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => navigate(BASE + s.path)}
            style={{
              padding: "10px 14px",
              border: "none",
              borderBottom: current.path === s.path ? "2px solid #7c3aed" : "2px solid transparent",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontWeight: current.path === s.path ? 600 : 400,
              color: current.path === s.path ? "#7c3aed" : "#6b7280",
              fontSize: 13,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          backgroundColor: "#fff",
        }}
      >
        {current.id === "resumen" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Resumen de reservas
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Configuración central de reservas. Usa las pestañas para Disponibilidad, Garantía, Turnos y Mensajes.
            </p>
          </>
        )}
        {current.id === "disponibilidad" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Disponibilidad
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Horarios y capacidad por día y ubicación. En fase 2: calendario y límites.
            </p>
          </>
        )}
        {current.id === "garantia" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Garantía y Cancelación
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Depósitos, cargos por no presentarse, políticas de cancelación. En fase 2.
            </p>
          </>
        )}
        {current.id === "turnos" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Turnos
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Duración de turnos y bloques de tiempo. En fase 2.
            </p>
          </>
        )}
        {current.id === "mensajes" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Mensajes y recordatorios
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Plantillas de correo y SMS para confirmación y recordatorios. En fase 2.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
