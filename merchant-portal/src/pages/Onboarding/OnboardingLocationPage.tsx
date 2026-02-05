/**
 * Onboarding 5min — Tela 2: Local & Contacto (cidade, email, telefone, idioma).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { Button, Card, Input } from "../../ui/design-system/primitives";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";

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
    <div
      data-onboarding-step="2"
      style={{
        background: colors.surface.base,
        minHeight: "100vh",
        color: colors.text.primary,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `0 ${spacing[6]} ${spacing[6]} ${spacing[6]}`,
      }}
    >
      <OnboardingStepIndicator step={3} total={9} />
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            marginBottom: spacing[4],
            color: colors.text.primary,
          }}
        >
          {ONBOARDING_5MIN_COPY.location.headline}
        </h1>
        <Card padding="lg" style={{ marginBottom: spacing[6] }}>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
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
            <label style={{ fontSize: 14, color: colors.text.secondary }}>
              Idioma
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                style={{
                  marginLeft: spacing[2],
                  padding: spacing[2],
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: colors.surface.layer1,
                  color: colors.text.primary,
                }}
              >
                <option value="pt-PT">Português (PT)</option>
                <option value="pt-BR">Português (BR)</option>
                <option value="es-ES">Español</option>
                <option value="en-US">English</option>
              </select>
            </label>
          </div>
        </Card>
        <div style={{ display: "flex", gap: spacing[4], justifyContent: "flex-end" }}>
          <Button type="button" tone="neutral" variant="outline" onClick={() => navigate("/onboarding/identity")}>
            Voltar
          </Button>
          <Button type="button" tone="success" variant="solid" onClick={handleNext}>
            {ONBOARDING_5MIN_COPY.location.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
