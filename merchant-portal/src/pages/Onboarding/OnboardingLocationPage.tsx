/**
 * Onboarding 5min — Tela 2: Local & Contacto (cidade, email, telefone, idioma).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { Button, Card, Input } from "../../ui/design-system/primitives";
import styles from "./OnboardingLocationPage.module.css";

export function OnboardingLocationPage() {
  const navigate = useNavigate();
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
        <h1 className={styles.headline}>
          {ONBOARDING_5MIN_COPY.location.headline}
        </h1>
        <Card padding="lg" className={styles.formCard}>
          <div className={styles.fieldSet}>
            <Input
              label="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lisboa"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@restaurante.pt"
            />
            <Input
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+351 912 345 678"
            />
            <label className={styles.localeLabel}>
              Idioma
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
            Voltar
          </Button>
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={handleNext}
          >
            {ONBOARDING_5MIN_COPY.location.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
