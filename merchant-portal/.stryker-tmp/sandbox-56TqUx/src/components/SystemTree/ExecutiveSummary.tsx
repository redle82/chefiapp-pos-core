/**
 * ExecutiveSummary - Visão Nível 1 (Executiva)
 *
 * Responde: Onde estou? Está bom ou ruim? O que faço agora?
 * Mesmo tree, mesmo dados — colapsado, traduzido, orientado a ação.
 */
// @ts-nocheck


import { useContext } from "react";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import {
  getExecutiveChecklist,
  getExecutiveState,
  getRecommendedAction,
} from "./systemTreeHumanLabels";

export function ExecutiveSummary() {
  const runtime = useContext(RestaurantRuntimeContext)?.runtime;
  const setupStatus = runtime?.setup_status ?? {};
  const installedModules = runtime?.installed_modules ?? [];

  const { state, label } = getExecutiveState(
    runtime?.status ?? null,
    setupStatus,
  );
  const action = getRecommendedAction(setupStatus);
  const checklist = getExecutiveChecklist(
    setupStatus,
    installedModules,
    runtime?.plan,
    runtime?.status,
  );

  const stateEmoji =
    state === "operando" ? "🟢" : state === "atencao" ? "🟡" : "🔴";
  const stateBg =
    state === "operando"
      ? "#dcfce7"
      : state === "atencao"
      ? "#fef9c3"
      : "#fee2e2";
  const stateColor =
    state === "operando"
      ? "#166534"
      : state === "atencao"
      ? "#854d0e"
      : "#991b1b";

  return (
    <div
      style={{
        flex: 1,
        padding: "32px 40px",
        overflowY: "auto",
        backgroundColor: "#fafafa",
        maxWidth: "560px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "20px",
          fontWeight: 600,
          color: "#1a1a1a",
        }}
      >
        Mapa resumido
      </h1>
      <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#666" }}>
        O que importa agora — o resto existe, mas pode dormir.
      </p>

      {/* 1. Onde estou? / Está bom ou ruim? */}
      <div
        style={{
          marginBottom: "24px",
          padding: "16px 20px",
          borderRadius: "12px",
          backgroundColor: stateBg,
          border: `1px solid ${stateColor}33`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "4px",
          }}
        >
          <span style={{ fontSize: "24px" }}>{stateEmoji}</span>
          <span
            style={{ fontSize: "18px", fontWeight: 600, color: stateColor }}
          >
            {label}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>
          Estado geral do restaurante
        </p>
      </div>

      {/* 2. Checklist humano */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          Operação
        </h2>
        <ul style={{ margin: 0, paddingLeft: "20px", listStyle: "none" }}>
          {checklist.map((item, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                fontSize: "14px",
                color: item.ok ? "#166534" : "#78716c",
              }}
            >
              {item.ok ? "✔" : "○"} {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* 3. O que faço agora? */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "12px",
          backgroundColor: "#eff6ff",
          border: "1px solid #93c5fd",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#1e40af",
            fontWeight: 600,
            marginBottom: "4px",
          }}
        >
          Próximo passo recomendado
        </div>
        <p style={{ margin: 0, fontSize: "15px", color: "#1e3a8a" }}>
          👉 {action.charAt(0).toUpperCase() + action.slice(1)}
        </p>
      </div>
    </div>
  );
}
