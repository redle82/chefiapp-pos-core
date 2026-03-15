/**
 * ReservasPage — Disponibilidade, Garantia, Turnos, Mensagens.
 * Estrutura com secções; conteúdo mínimo por secção (Fase 2).
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

const BASE = "/admin/config";

const SECTIONS = [
  { path: "/reservas/disponibilidad", labelKey: "reservas.tabDisponibilidad", id: "disponibilidad" },
  { path: "/reservas/garantia", labelKey: "reservas.tabGarantia", id: "garantia" },
  { path: "/reservas/turnos", labelKey: "reservas.tabTurnos", id: "turnos" },
  { path: "/reservas/mensajes", labelKey: "reservas.tabMensajes", id: "mensajes" },
  { path: "/reservas", labelKey: "reservas.tabResumen", id: "resumen" },
] as const;

const SECTION_TITLE_KEYS: Record<string, string> = {
  resumen: "reservas.sectionResumenTitle",
  disponibilidad: "reservas.sectionDisponibilidadTitle",
  garantia: "reservas.sectionGarantiaTitle",
  turnos: "reservas.sectionTurnosTitle",
  mensajes: "reservas.sectionMensajesTitle",
};

const SECTION_DESC_KEYS: Record<string, string> = {
  resumen: "reservas.sectionResumenDesc",
  disponibilidad: "reservas.sectionDisponibilidadDesc",
  garantia: "reservas.sectionGarantiaDesc",
  turnos: "reservas.sectionTurnosDesc",
  mensajes: "reservas.sectionMensajesDesc",
};

export function ReservasPage() {
  const { t } = useTranslation("config");
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace(/^\/admin\/config/, "") || "/reservas";
  const current = SECTIONS.find((s) => path === s.path || path.startsWith(s.path + "/")) ?? SECTIONS[SECTIONS.length - 1];
  const titleKey = SECTION_TITLE_KEYS[current.id] ?? "reservas.sectionResumenTitle";
  const descKey = SECTION_DESC_KEYS[current.id] ?? "reservas.sectionResumenDesc";

  return (
    <div className="page-enter admin-content-page" style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title={t("reservas.title")}
        subtitle={t("reservas.subtitle")}
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
            {t(s.labelKey)}
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
        <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
          {t(titleKey)}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          {t(descKey)}
        </p>
      </div>
    </div>
  );
}
