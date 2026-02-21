/**
 * BootstrapStepIndicator — Progresso na Sequência Canônica v1.0 (8 passos).
 *
 * Ref: docs/contracts/FUNIL_VIDA_CLIENTE.md#sequência-canônica-oficial-v10
 * Usado em /bootstrap (passo 3) e /onboarding/first-product (passo 4).
 */
// @ts-nocheck


const CANONICAL_SUBTITLE: Record<number, string> = {
  3: "Bootstrap — Criar restaurante",
  4: "Primeiro produto (opcional — pode continuar sem adicionar)",
};

export function BootstrapStepIndicator({
  step,
  total = 8,
}: {
  step: number;
  total?: number;
}) {
  const y = total ?? 8;
  const subtitle = y === 8 ? (CANONICAL_SUBTITLE[step] ?? `Passo ${step} de 8`) : "A configurar o seu restaurante";
  const label = y === 8 ? `Passo ${step} de 8 — ${subtitle}` : `Passo ${step} de ${y} — A configurar o seu restaurante`;
  return (
    <div
      role="status"
      aria-label={label}
      data-canonical-flow="v1.0"
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
      Passo {step} de {y} — {subtitle}
    </div>
  );
}
