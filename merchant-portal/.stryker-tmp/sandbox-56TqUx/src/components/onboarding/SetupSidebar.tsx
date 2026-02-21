/**
 * SetupSidebar - Sidebar Fixa do Setup Tree
 *
 * Inspirado no UX do GloriaFood:
 * - Sidebar fixa com áreas
 * - Status visual por seção
 * - Clicável a qualquer momento
 */
// @ts-nocheck


import {
  useOnboarding,
  type SetupSection,
} from "../../context/OnboardingContext";
import { SetupItem } from "./SetupItem";

export interface SetupSectionConfig {
  id: SetupSection;
  label: string;
  icon: string;
  description?: string;
}

const SECTIONS: SetupSectionConfig[] = [
  {
    id: "identity",
    label: "Identidade",
    icon: "🏢",
    description: "Nome, tipo, país",
  },
  {
    id: "location",
    label: "Localização",
    icon: "📍",
    description: "Endereço, mesas, zonas",
  },
  {
    id: "schedule",
    label: "Horários",
    icon: "⏰",
    description: "Funcionamento, turnos",
  },
  {
    id: "menu",
    label: "Cardápio",
    icon: "🍽️",
    description: "Produtos e receitas",
  },
  {
    id: "inventory",
    label: "Estoque",
    icon: "📦",
    description: "Ingredientes e quantidades",
  },
  {
    id: "people",
    label: "Pessoas",
    icon: "👥",
    description: "Gerente e funcionários",
  },
  {
    id: "payments",
    label: "Pagamentos",
    icon: "💳",
    description: "Métodos de pagamento",
  },
  {
    id: "integrations",
    label: "Integrações",
    icon: "🔌",
    description: "TPV, delivery, etc.",
  },
  {
    id: "publish",
    label: "Publicação",
    icon: "🚀",
    description: "Ativar restaurante",
  },
];

export function SetupSidebar() {
  const { state, setCurrentSection } = useOnboarding();

  return (
    <div
      style={{
        width: "280px",
        height: "100vh",
        backgroundColor: "#f8f9fa",
        borderRight: "1px solid #e0e0e0",
        padding: "24px 0",
        overflowY: "auto",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0 24px 24px",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 600,
            color: "#1a1a1a",
          }}
        >
          Configuração
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#666" }}>
          Configure seu restaurante
        </p>
      </div>

      {/* Seções */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: "0 12px",
        }}
      >
        {SECTIONS.map((section) => {
          const sectionState = state.sections[section.id];
          const isActive = state.currentSection === section.id;

          return (
            <SetupItem
              key={section.id}
              config={section}
              status={sectionState.status}
              isActive={isActive}
              onClick={() => setCurrentSection(section.id)}
            />
          );
        })}
      </div>

      {/* Progresso Geral */}
      <div
        style={{
          padding: "24px",
          marginTop: "auto",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
          Progresso Geral
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              flex: 1,
              height: "8px",
              backgroundColor: "#e0e0e0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${getOverallProgress(state.sections)}%`,
                height: "100%",
                backgroundColor: "#667eea",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#1a1a1a",
              minWidth: "40px",
            }}
          >
            {getOverallProgress(state.sections)}%
          </span>
        </div>

        {/* Link para "Como tudo se conecta" (TRIAL_GUIDE_SPEC: System Tree dissolvido no trial) */}
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <a
            href="/auth"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/auth";
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              fontSize: "13px",
              color: "#667eea",
              textDecoration: "none",
              borderRadius: "4px",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span>🧭</span>
            <span>Como tudo se conecta</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function getOverallProgress(sections: Record<SetupSection, any>): number {
  const total = Object.keys(sections).length;
  const complete = Object.values(sections).filter(
    (s) => s.status === "COMPLETE",
  ).length;
  return Math.round((complete / total) * 100);
}
