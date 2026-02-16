/**
 * ConfigIntegrationsPage - Integration Hub
 *
 * Espaço oficial onde qualquer integração existe sem contaminar o Core.
 * Ver docs/CHEFIAPP_INTEGRATIONS_HUB_SPEC.md
 *
 * Fase 1: stubs por tipo (Pagamentos, WhatsApp, APIs & Webhooks, Delivery, Outros).
 */

import { useNavigate } from "react-router-dom";
import styles from "./ConfigIntegrationsPage.module.css";

const INTEGRATIONS_BASE = "/admin/config/integrations";

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
    path: `${INTEGRATIONS_BASE}/payments`,
  },
  {
    id: "whatsapp",
    icon: "📱",
    label: "WhatsApp",
    description: "Canal de entrada, notificações, automações.",
    status: "stub",
    path: `${INTEGRATIONS_BASE}/whatsapp`,
  },
  {
    id: "webhooks",
    icon: "🔗",
    label: "APIs & Webhooks",
    description: "Webhooks OUT (endpoint, eventos); API IN (chaves, limites).",
    status: "stub",
    path: `${INTEGRATIONS_BASE}/webhooks`,
  },
  {
    id: "delivery",
    icon: "🛵",
    label: "Delivery",
    description: "GloriaFood, Glovo, Uber Eats; ativar/desativar por adapter.",
    status: "stub",
    path: `${INTEGRATIONS_BASE}/delivery`,
  },
  {
    id: "other",
    icon: "📦",
    label: "Outros sistemas",
    description: "ERP, fiscal, BI, analytics.",
    status: "stub",
    path: `${INTEGRATIONS_BASE}/other`,
  },
];

type ConfigIntegrationsPageProps = {
  /** Quando true, não mostra o header (ex.: quando o pai já usa AdminPageHeader). */
  hideHeader?: boolean;
};

export function ConfigIntegrationsPage({ hideHeader }: ConfigIntegrationsPageProps = {}) {
  const navigate = useNavigate();

  return (
    <div>
      {!hideHeader && (
        <div className={styles.headerContainer}>
          <h1 className={styles.title}>Integrações</h1>
          <p className={styles.subtitle}>
            Ligue TPV, delivery e outros serviços ao seu restaurante.
          </p>
        </div>
      )}

      <div className={styles.sectionsGrid}>
        {HUB_SECTIONS.map((section) => (
          <div
            key={section.id}
            className={styles.sectionCard}
            data-clickable={section.path ? "true" : "false"}
            onClick={() => section.path && navigate(section.path)}
            onKeyDown={(e) =>
              section.path &&
              (e.key === "Enter" || e.key === " ") &&
              navigate(section.path!)
            }
            {...(section.path && { role: "button", tabIndex: 0 })}
          >
            <div className={styles.sectionIcon}>{section.icon}</div>
            <div className={styles.sectionLabel}>{section.label}</div>
            <p className={styles.sectionDescription}>{section.description}</p>
            {section.status === "stub" && (
              <span className={styles.sectionStatus}>Em breve</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
