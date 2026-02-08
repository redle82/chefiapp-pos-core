/**
 * CleaningHome — Home por papel: Limpeza.
 * Foco principal: Tarefas. Obrigatórios: Alertas, Turno.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

export function CleaningHome() {
  const { tasks } = useStaff();
  const navigate = useNavigate();

  const cleaningTasks = tasks.filter(
    (t) =>
      t.context === "floor" ||
      t.type === "maintenance" ||
      t.type === "reactive" ||
      (t.assigneeRole && ["cleaning", "worker"].includes(t.assigneeRole)),
  );
  const pending = cleaningTasks.filter((t) => t.status !== "done");
  const statusLabel = pending.length === 0 ? "OK" : `${pending.length} pendente(s)`;

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
        LIMPEZA
      </h2>
      <p style={{ fontSize: 13, color: colors.text.secondary, margin: 0 }}>
        Status geral: {statusLabel}
      </p>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {cleaningTasks.length === 0 ? (
          <>
            <li style={{ padding: "8px 0", color: colors.text.secondary }}>☐ Mesa 3</li>
            <li style={{ padding: "8px 0", color: colors.text.secondary }}>☐ WC</li>
            <li style={{ padding: "8px 0", color: colors.text.secondary }}>☐ Área externa</li>
          </>
        ) : (
          cleaningTasks.slice(0, 10).map((t) => (
            <li
              key={t.id}
              style={{
                padding: "10px 12px",
                background: colors.surface.layer1,
                borderRadius: 8,
                border: `1px solid ${colors.border.subtle}`,
                color: colors.text.primary,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{t.status === "done" ? "☑" : "☐"}</span>
              <span>{t.title}</span>
            </li>
          ))
        )}
      </ul>
      {/* Foco + obrigatórios: Tarefas, Alertas, Turno */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/tasks")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 16px",
            background: colors.action.base,
            color: colors.action.text,
            border: "none",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          🧹 Tarefas
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate("/app/staff/mode/alerts")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "12px",
              background: colors.surface.layer1,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
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
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "12px",
              background: colors.surface.layer1,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              color: colors.text.primary,
              cursor: "pointer",
            }}
          >
            ⏱️ Turno
          </button>
        </div>
      </div>
    </div>
  );
}
