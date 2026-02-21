/**
 * Onboarding 5min — Indicador de passo (Passo X de 9).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */
// @ts-nocheck


const TOTAL_STEPS = 9;

export function OnboardingStepIndicator({
  step,
  total = TOTAL_STEPS,
}: {
  step: number;
  total?: number;
}) {
  const y = Math.min(total, TOTAL_STEPS);
  const label = `Passo ${step} de ${y} — Configuração`;
  return (
    <div
      role="status"
      aria-label={label}
      data-onboarding-5min
      data-step={step}
      data-total={y}
      style={{
        width: "100%",
        padding: "12px 16px",
        background: "rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        fontSize: 13,
        color: "#a3a3a3",
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      Passo {step} de {y}
    </div>
  );
}

export { TOTAL_STEPS as ONBOARDING_TOTAL_STEPS };
