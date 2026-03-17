/**
 * ConfigIntegrationsPage - Integration Hub
 *
 * Espaço oficial onde qualquer integração existe sem contaminar o Core.
 * Ver docs/CHEFIAPP_INTEGRATIONS_HUB_SPEC.md
 *
 * Fase 1: stubs por tipo (Pagamentos, WhatsApp, APIs & Webhooks, Delivery, Outros).
 */

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styles from "./ConfigIntegrationsPage.module.css";

const INTEGRATIONS_BASE = "/admin/config/integrations";

const HUB_SECTIONS: Array<{
  id: string;
  icon: string;
  i18nKey: string;
  status: "stub" | "available";
  path?: string;
}> = [
  {
    id: "payments",
    icon: "💳",
    i18nKey: "payments",
    status: "stub",
    path: `${INTEGRATIONS_BASE}/payments`,
  },
  {
    id: "whatsapp",
    icon: "📱",
    i18nKey: "whatsapp",
    status: "available",
    path: `${INTEGRATIONS_BASE}/whatsapp`,
  },
  {
    id: "webhooks",
    icon: "🔗",
    i18nKey: "webhooks",
    status: "stub",
    path: `${INTEGRATIONS_BASE}/webhooks`,
  },
  {
    id: "delivery",
    icon: "🛵",
    i18nKey: "delivery",
    status: "available",
    path: `${INTEGRATIONS_BASE}/delivery`,
  },
  {
    id: "google-business",
    icon: "📍",
    i18nKey: "googleBusiness",
    status: "available",
    path: `${INTEGRATIONS_BASE}/google-business`,
  },
  {
    id: "instagram",
    icon: "📸",
    i18nKey: "instagram",
    status: "available",
    path: `${INTEGRATIONS_BASE}/instagram`,
  },
  {
    id: "other",
    icon: "📦",
    i18nKey: "other",
    status: "stub",
    path: `${INTEGRATIONS_BASE}/other`,
  },
];

type ConfigIntegrationsPageProps = {
  /** Quando true, não mostra o header (ex.: quando o pai já usa AdminPageHeader). */
  hideHeader?: boolean;
};

export function ConfigIntegrationsPage({
  hideHeader,
}: ConfigIntegrationsPageProps = {}) {
  const { t } = useTranslation("config");
  const navigate = useNavigate();

  return (
    <div>
      {!hideHeader && (
        <div className={styles.headerContainer}>
          <h1 className={styles.title}>{t("integrations.title")}</h1>
          <p className={styles.subtitle}>
            {t("integrations.subtitle")}
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
            <div className={styles.sectionHeader}>
              <div className={styles.sectionLabel}>{t(`integrations.section.${section.i18nKey}.label`)}</div>
              {section.status === "stub" && (
                <span className={styles.sectionStatus}>{t("integrations.comingSoon")}</span>
              )}
              {section.status === "available" && (
                <span className={styles.sectionStatusAvailable}>
                  {t("integrations.available")}
                </span>
              )}
            </div>
            <p className={styles.sectionDescription}>{t(`integrations.section.${section.i18nKey}.description`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
