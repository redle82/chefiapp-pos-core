/**
 * ConfigStatusPage - Status e Publicação
 *
 * Mostra status do restaurante, estado do sistema (Core) e permite republicar/desativar.
 */

import React from "react";
import { useCoreHealth, getHealthMessage } from "../../core/health/useCoreHealth";
import { PublishSection } from "../Onboarding/sections/PublishSection";

function SystemHealthBlock() {
  const { status, lastChecked, check } = useCoreHealth();
  const lastCheckStr =
    lastChecked != null
      ? new Date(lastChecked).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—";

  return (
    <section
      style={{
        marginBottom: 24,
        padding: 16,
        borderRadius: 8,
        border: "1px solid #333",
        backgroundColor: "#18181b",
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0" }}>
        Estado do sistema
      </h2>
      <p style={{ fontSize: 14, color: "#a1a1aa", margin: "0 0 8px 0" }}>
        Core (servidor operacional):{" "}
        <strong style={{ color: status === "UP" ? "#22c55e" : "#f59e0b" }}>
          {status === "UP" ? "Acessível" : getHealthMessage(status)}
        </strong>
      </p>
      <p style={{ fontSize: 12, color: "#71717a", margin: 0 }}>
        Última verificação às {lastCheckStr}.
      </p>
      <button
        type="button"
        onClick={() => void check()}
        style={{
          marginTop: 8,
          padding: "6px 12px",
          fontSize: 12,
          border: "1px solid #404040",
          borderRadius: 6,
          background: "#27272a",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Verificar agora
      </button>
    </section>
  );
}

export function ConfigStatusPage() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Estado do Restaurante
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
          Veja o estado atual e gerencie a publicação do restaurante.
        </p>
      </div>

      <SystemHealthBlock />

      {/* Reutiliza a mesma secção do onboarding */}
      <PublishSection />
    </div>
  );
}
