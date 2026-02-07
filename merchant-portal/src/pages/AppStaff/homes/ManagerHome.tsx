/**
 * ManagerHome — Home por papel: Gerente.
 * Foco: TPV, KDS, Equipe, Alertas. Obrigatórios para todos: Tarefas, Turno.
 */

import { Link } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";

const mainButtons = [
  { icon: "🧾", label: "TPV", to: "/app/staff/mode/tpv" },
  { icon: "🍳", label: "KDS", to: "/app/staff/mode/kds" },
  { icon: "👥", label: "Equipe", to: "/app/staff/mode/team" },
  { icon: "⚠️", label: "Alertas", to: "/app/staff/mode/alerts" },
  { icon: "🧹", label: "Tarefas", to: "/app/staff/mode/tasks" },
  { icon: "⏱️", label: "Turno", to: "/app/staff/mode/turn" },
] as const;

export function ManagerHome() {
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
        GERENTE
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
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "14px",
              background: colors.surface.layer1,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 13,
              color: colors.text.primary,
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 24 }}>{icon}</span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
