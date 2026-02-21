/**
 * ConfigSchedulePage - Configuração de Horários e Turnos
 *
 * Gerencia horários de funcionamento e turnos.
 */

import { useNavigate } from "react-router-dom";
import { ScheduleSection } from "../Onboarding/sections/ScheduleSection";

export function ConfigSchedulePage() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            margin: 0,
            marginBottom: "8px",
            color: "var(--text-primary)",
          }}
        >
          Tempo e Horários
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Configure horários de funcionamento e gerencie turnos.
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-success)",
            margin: 0,
            fontWeight: 500,
          }}
        >
          Defina os dias e horários de abertura e fecho. As alterações são
          guardadas para o seu restaurante.
        </p>
      </div>

      {/* Reutiliza a mesma seção do onboarding */}
      <ScheduleSection />

      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          backgroundColor: "var(--status-primary-bg)",
          borderRadius: "8px",
          border: "1px solid var(--surface-border)",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
          💡 Para gerenciar escalas de funcionários, acesse{" "}
          <button
            onClick={() => navigate("/manager/schedule")}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Escalas
          </button>
        </p>
      </div>
    </div>
  );
}
