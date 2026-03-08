/**
 * PublishSection - Seção de Publicação
 *
 * Última seção: valida tudo e permite publicar o restaurante
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useBootstrapState } from "../../../hooks/useBootstrapState";
import styles from "./PublishSection.module.css";

export function PublishSection() {
  const { t } = useTranslation("onboarding");
  const { state, canPublish } = useOnboarding();
  const bootstrap = useBootstrapState();
  const { publishRestaurant: publishRuntime } = useRestaurantRuntime();
  const [isPublishing, setIsPublishing] = React.useState(false);
  const navigate = useNavigate();
  const publishEnabled =
    canPublish() && bootstrap.coreStatus === "online" && !isPublishing;

  const requiredSections: Array<{ id: string; labelKey: string }> = [
    { id: "identity", labelKey: "publish.sectionIdentity" },
    { id: "location", labelKey: "publish.sectionLocation" },
    { id: "schedule", labelKey: "publish.sectionSchedule" },
    { id: "menu", labelKey: "publish.sectionMenu" },
    { id: "people", labelKey: "publish.sectionPeople" },
  ];

  const handlePublish = async () => {
    if (!canPublish()) {
      alert(t("publish.completeAllAlert"));
      return;
    }

    setIsPublishing(true);
    try {
      await publishRuntime();
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro ao publicar:", error);
      alert(t("publish.errorPublish", { message: error?.message || "Erro desconhecido" }));
      setIsPublishing(false);
    }
  };

  const buttonLabel = isPublishing
    ? t("publish.publishing")
    : bootstrap.coreStatus !== "online"
    ? t("publish.coreWait")
    : canPublish()
    ? `🚀 ${t("publish.publishButton")}`
    : t("publish.completeSections");

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🚀 {t("publish.title")}</h1>
      <p className={styles.subtitle}>{t("publish.subtitle")}</p>

      {/* Resumo */}
      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>{t("publish.summaryTitle")}</h3>
        <div className={styles.summaryList}>
          {requiredSections.map((section) => {
            const sectionState =
              state.sections[section.id as keyof typeof state.sections];
            const isComplete = sectionState.status === "COMPLETE";

            return (
              <div key={section.id} className={styles.summaryItem}>
                <span className={styles.summaryIcon}>
                  {isComplete ? "✅" : "❌"}
                </span>
                <span className={styles.summaryLabel}>{t(section.labelKey)}</span>
                <span
                  className={`${styles.summaryStatus} ${
                    isComplete ? styles.statusComplete : styles.statusIncomplete
                  }`}
                >
                  {isComplete ? t("publish.complete") : t("publish.incomplete")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* O que acontece ao publicar */}
      <div className={`${styles.panel} ${styles.infoPanel}`}>
        <h3 className={styles.sectionTitleCompact}>
          {t("publish.whatHappensTitle")}
        </h3>
        <ul className={styles.infoList}>
          <li>{t("publish.whatHappens1")}</li>
          <li>{t("publish.whatHappens2")}</li>
          <li>{t("publish.whatHappens3")}</li>
          <li>{t("publish.whatHappens4")}</li>
        </ul>
      </div>

      {bootstrap.coreStatus === "offline-erro" && (
        <div className={styles.errorBanner}>
          {t("publish.coreOffline")}
        </div>
      )}

      <button
        onClick={handlePublish}
        disabled={
          !canPublish() || isPublishing || bootstrap.coreStatus !== "online"
        }
        className={`${styles.publishButton} ${
          publishEnabled
            ? styles.publishButtonEnabled
            : styles.publishButtonDisabled
        }`}
      >
        {buttonLabel}
      </button>

      {!canPublish() && (
        <p className={styles.publishHint}>{t("publish.completeSectionsHint")}</p>
      )}

      <div className={`${styles.panel} ${styles.accessPanel}`}>
        <h3 className={styles.sectionTitle}>
          🧩 {t("publish.accessTitle")}
        </h3>
        <p className={styles.accessDescription}>{t("publish.accessDescription")}</p>

        <div className={styles.systemsGrid}>
          <button onClick={() => navigate("/tpv")} className={styles.systemButton}>
            <span>🖥️</span>
            <span>{t("publish.systemTPV")}</span>
          </button>
          <button onClick={() => navigate("/tasks")} className={styles.systemButton}>
            <span>✅</span>
            <span>{t("publish.systemTasks")}</span>
          </button>
          <button onClick={() => navigate("/people")} className={styles.systemButton}>
            <span>👥</span>
            <span>{t("publish.systemPeople")}</span>
          </button>
          <button onClick={() => navigate("/health")} className={styles.systemButton}>
            <span>💚</span>
            <span>{t("publish.systemHealth")}</span>
          </button>
          <button onClick={() => navigate("/mentor")} className={styles.systemButton}>
            <span>🤖</span>
            <span>{t("publish.systemMentor")}</span>
          </button>
          <button onClick={() => navigate("/purchases")} className={styles.systemButton}>
            <span>🛒</span>
            <span>{t("publish.systemPurchases")}</span>
          </button>
          <button onClick={() => navigate("/financial")} className={styles.systemButton}>
            <span>💰</span>
            <span>{t("publish.systemFinancial")}</span>
          </button>
          <button onClick={() => navigate("/reservations")} className={styles.systemButton}>
            <span>📅</span>
            <span>{t("publish.systemReservations")}</span>
          </button>
          <button onClick={() => navigate("/auth")} className={styles.systemButton}>
            <span>🧭</span>
            <span>{t("publish.systemHowItConnects")}</span>
          </button>
          <button onClick={() => navigate("/admin/config")} className={styles.systemButton}>
            <span>⚙️</span>
            <span>{t("publish.systemConfigTree")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
