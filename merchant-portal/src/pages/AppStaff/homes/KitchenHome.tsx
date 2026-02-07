/**
 * KitchenHome — Home por papel: Cozinha.
 * Foco principal: KDS (Pedidos, Atrasos). Obrigatórios: Tarefas, Alertas, Turno.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";
import KitchenDisplay from "../../TPV/KDS/KitchenDisplay";

export function KitchenHome() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {/* Foco: KDS + obrigatórios Tarefas, Alertas, Turno */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: "10px 16px",
          backgroundColor: colors.surface.layer1,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/kds")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 14px",
            background: colors.action.base,
            color: colors.action.text,
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          🍳 KDS
        </button>
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/kds?filter=delay")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 14px",
            background: colors.surface.layer2,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            color: colors.text.primary,
            cursor: "pointer",
          }}
        >
          ⏱️ Atrasos
        </button>
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/tasks")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 14px",
            background: colors.surface.layer2,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            color: colors.text.primary,
            cursor: "pointer",
          }}
        >
          🧹 Tarefas
        </button>
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/alerts")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 14px",
            background: colors.surface.layer2,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            color: colors.text.primary,
            cursor: "pointer",
          }}
        >
          ⚠️ Alertas
        </button>
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/turn")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 14px",
            background: colors.surface.layer2,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            color: colors.text.primary,
            cursor: "pointer",
          }}
        >
          ⏱️ Turno
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <KitchenDisplay />
      </div>
    </div>
  );
}
