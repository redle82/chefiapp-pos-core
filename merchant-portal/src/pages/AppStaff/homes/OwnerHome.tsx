/**
 * OwnerHome — Home por papel: Dono. SUPER-OPERADOR.
 * Acesso total: Operação, TPV, KDS, Equipe, Tarefas, Alertas, Turno.
 * Perfil ≠ ferramenta: Owner não é dashboard, é super-operador.
 */

import React from "react";
import { Link } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";

const mainButtons = [
  { icon: "📊", label: "Operação", to: "/app/staff/mode/operation" },
  { icon: "🧾", label: "TPV", to: "/app/staff/mode/tpv" },
  { icon: "🍳", label: "KDS", to: "/app/staff/mode/kds" },
  { icon: "👥", label: "Equipe", to: "/app/staff/mode/team" },
  { icon: "🧹", label: "Tarefas", to: "/app/staff/mode/tasks" },
  { icon: "⚠️", label: "Alertas", to: "/app/staff/mode/alerts" },
  { icon: "⏱️", label: "Turno", to: "/app/staff/mode/turn" },
] as const;

export function OwnerHome() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        padding: "16px",
        backgroundColor: colors.surface.base,
        gap: 12,
      }}
    >
      <h2
        style={{
          fontSize: 14,
          fontWeight: 700,
          margin: 0,
          color: colors.text.tertiary,
          letterSpacing: "0.04em",
        }}
      >
        DONO — SUPER-OPERADOR
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {mainButtons.map(({ icon, label, to }) => (
          <Link
            key={to}
            to={to}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              background: colors.surface.layer1,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              color: colors.text.primary,
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 22 }}>{icon}</span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
