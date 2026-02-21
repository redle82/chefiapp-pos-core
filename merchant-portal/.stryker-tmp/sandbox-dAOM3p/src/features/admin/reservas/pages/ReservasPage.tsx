/**
 * ReservasPage — Disponibilidad, Garantía, Turnos, Mensajes.
 * Estrutura com secções; conteúdo mínimo por secção (Fase 2).
 */
// @ts-nocheck


import { useLocation, useNavigate } from "react-router-dom";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

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
      <AdminPageHeader
        title="Reservas"
        subtitle="Disponibilidad, garantía, turnos, mensajes y recordatorios."
      />

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid var(--surface-border)",
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
              borderBottom: current.path === s.path ? "2px solid var(--color-primary)" : "2px solid transparent",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontWeight: current.path === s.path ? 600 : 400,
              color: current.path === s.path ? "var(--color-primary)" : "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        style={{
          border: "1px solid var(--surface-border)",
          borderRadius: 12,
          padding: 24,
          backgroundColor: "var(--card-bg-on-dark)",
        }}
      >
        {current.id === "resumen" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Resumen de reservas
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              Configuración central de reservas. Usa las pestañas para Disponibilidad, Garantía, Turnos y Mensajes.
            </p>
          </>
        )}
        {current.id === "disponibilidad" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Disponibilidad
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              Horarios y capacidad por día y ubicación. En fase 2: calendario y límites.
            </p>
          </>
        )}
        {current.id === "garantia" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Garantía y Cancelación
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              Depósitos, cargos por no presentarse, políticas de cancelación. En fase 2.
            </p>
          </>
        )}
        {current.id === "turnos" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Turnos
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              Duración de turnos y bloques de tiempo. En fase 2.
            </p>
          </>
        )}
        {current.id === "mensajes" && (
          <>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Mensajes y recordatorios
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              Plantillas de correo y SMS para confirmación y recordatorios. En fase 2.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
