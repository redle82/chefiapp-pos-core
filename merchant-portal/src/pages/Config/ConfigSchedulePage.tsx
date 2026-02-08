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
          }}
        >
          Tempo e Horários
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#666",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Configure horários de funcionamento e gerencie turnos.
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#059669",
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
          backgroundColor: "#f0f7ff",
          borderRadius: "8px",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
          💡 Para gerenciar escalas de funcionários, acesse{" "}
          <button
            onClick={() => navigate("/manager/schedule")}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
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
