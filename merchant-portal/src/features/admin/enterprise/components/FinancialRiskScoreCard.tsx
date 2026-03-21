import React from "react";
import type { OrgRiskScore } from "../../../../core/enterprise/riskEngine";

interface FinancialRiskScoreCardProps {
  riskScore: OrgRiskScore;
}

const LEVEL_CONFIG: Record<
  OrgRiskScore["level"],
  { label: string; bgColor: string; borderColor: string; description: string }
> = {
  stable: {
    label: "Estável",
    bgColor: "rgba(76, 175, 80, 0.15)",
    borderColor: "#2e7d32",
    description: "Risco financeiro baixo. Consolidação dentro do esperado.",
  },
  attention: {
    label: "Atenção",
    bgColor: "rgba(255, 152, 0, 0.15)",
    borderColor: "#e65100",
    description: "Discrepância moderada. Recomenda-se revisão.",
  },
  high_risk: {
    label: "Alto Risco",
    bgColor: "rgba(239, 83, 80, 0.15)",
    borderColor: "#c62828",
    description: "Risco financeiro elevado. Ação corretiva recomendada.",
  },
};

export function FinancialRiskScoreCard({ riskScore }: FinancialRiskScoreCardProps) {
  const config = LEVEL_CONFIG[riskScore.level];
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: `1px solid ${config.borderColor}`,
        backgroundColor: config.bgColor,
      }}
    >
      <h3 style={{ margin: "0 0 8px 0", fontSize: "0.875rem", fontWeight: 600 }}>
        Financial Risk Score
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          {riskScore.score}
        </span>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: "0.75rem",
            fontWeight: 600,
            backgroundColor: config.borderColor,
            color: "#fff",
          }}
        >
          {config.label}
        </span>
      </div>
      <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", opacity: 0.9 }}>
        {config.description}
      </p>
    </div>
  );
}
