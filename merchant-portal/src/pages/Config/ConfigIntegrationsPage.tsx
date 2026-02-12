/**
 * ConfigIntegrationsPage - Integration Hub
 *
 * Espaço oficial onde qualquer integração existe sem contaminar o Core.
 * Ver docs/CHEFIAPP_INTEGRATIONS_HUB_SPEC.md
 *
 * Fase 1: stubs por tipo (Pagamentos, WhatsApp, APIs & Webhooks, Delivery, Outros).
 */

import { useNavigate } from "react-router-dom";

const HUB_SECTIONS: Array<{
  id: string;
  icon: string;
  label: string;
  description: string;
  status: "stub" | "available";
  path?: string;
}> = [
  {
    id: "payments",
    icon: "💳",
    label: "Pagamentos",
    description: "Stripe e outros; config, status, logs.",
    status: "stub",
  },
  {
    id: "whatsapp",
    icon: "📱",
    label: "WhatsApp",
    description: "Canal de entrada, notificações, automações.",
    status: "stub",
  },
  {
    id: "webhooks",
    icon: "🔗",
    label: "APIs & Webhooks",
    description: "Webhooks OUT (endpoint, eventos); API IN (chaves, limites).",
    status: "stub",
  },
  {
    id: "delivery",
    icon: "🛵",
    label: "Delivery",
    description: "GloriaFood, Glovo, Uber Eats; ativar/desativar por adapter.",
    status: "stub",
  },
  {
    id: "other",
    icon: "📦",
    label: "Outros sistemas",
    description: "ERP, fiscal, BI, analytics.",
    status: "stub",
  },
];

export function ConfigIntegrationsPage() {
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
          Integrações
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
          Ligue TPV, delivery e outros serviços ao seu restaurante.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {HUB_SECTIONS.map((section) => (
          <div
            key={section.id}
            style={{
              padding: "20px",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              backgroundColor: "#fff",
              cursor: section.path ? "pointer" : "default",
            }}
            onClick={() => section.path && navigate(section.path)}
            onKeyDown={(e) =>
              section.path &&
              (e.key === "Enter" || e.key === " ") &&
              navigate(section.path!)
            }
            role={section.path ? "button" : undefined}
            tabIndex={section.path ? 0 : undefined}
          >
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>
              {section.icon}
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "6px",
                color: "#1e293b",
              }}
            >
              {section.label}
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                margin: "0 0 12px 0",
                lineHeight: 1.4,
              }}
            >
              {section.description}
            </p>
            {section.status === "stub" && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  fontWeight: 500,
                }}
              >
                Em breve
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
