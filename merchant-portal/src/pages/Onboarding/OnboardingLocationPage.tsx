/**
 * Onboarding 5min — Tela 2: Local & Contacto (cidade, email, telefone, idioma).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { Button, Card, Input } from "../../ui/design-system/primitives";
import styles from "./OnboardingLocationPage.module.css";

export function OnboardingLocationPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["onboarding", "common"]);
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locale, setLocale] = useState("pt-PT");

  const handleNext = () => {
    navigate("/onboarding/day-profile");
  };

  return (
    <div data-onboarding-step="2" className={styles.pageRoot}>
      <OnboardingStepIndicator step={3} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.headline}>{t("fiveMin.location.headline")}</h1>
        <Card padding="lg" className={styles.formCard}>
          <div className={styles.fieldSet}>
            <Input
              label={t("fiveMin.location.cityLabel")}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("fiveMin.location.cityPlaceholder")}
            />
            <Input
              label={t("fiveMin.location.emailLabel")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("fiveMin.location.emailPlaceholder")}
            />
            <Input
              label={t("fiveMin.location.phoneLabel")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("fiveMin.location.phonePlaceholder")}
            />
            <label className={styles.localeLabel}>
              {t("fiveMin.location.languageLabel")}
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className={styles.localeSelect}
              >
                <option value="pt-PT">Português (PT)</option>
                <option value="pt-BR">Português (BR)</option>
                <option value="es-ES">Español</option>
                <option value="en-US">English</option>
              </select>
            </label>
          </div>
        </Card>
        <div className={styles.actionRow}>
          <Button
            type="button"
            tone="neutral"
            variant="outline"
            onClick={() => navigate("/onboarding/identity")}
          >
            {t("common:back")}
          </Button>
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={handleNext}
          >
            {t("fiveMin.location.cta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
