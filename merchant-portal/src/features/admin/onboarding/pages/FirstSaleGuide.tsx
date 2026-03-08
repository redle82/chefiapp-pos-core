/**
 * FirstSaleGuide — Tutorial de Primeira Venda (FASE 2)
 *
 * Guia visual passo a passo para que o utilizador faça a sua primeira venda
 * em menos de 10 minutos desde o login.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStatus } from "../../../../hooks/useOnboardingStatus";
import { Button } from "../../../../ui/design-system/Button";

interface Step {
  id: number;
  title: string;
  description: string;
  emoji: string;
  action?: {
    label: string;
    href: string;
  };
  tip?: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: "Cria ou importa um menu",
    description:
      "Para poder vender, precisas de ter produtos no teu menu. Usa um menu de exemplo ou cria os teus próprios produtos.",
    emoji: "📋",
    action: {
      label: "Ir para Menu Builder",
      href: "/menu-builder",
    },
    tip: "Podes usar o menu de exemplo para começar rapidamente.",
  },
  {
    id: 2,
    title: "Abre o TPV (Ponto de Venda)",
    description:
      "O TPV é o teu terminal de vendas. Aqui vais selecionar produtos e processar pagamentos.",
    emoji: "🖥️",
    action: {
      label: "Abrir TPV",
      href: "/tpv",
    },
    tip: "Podes usar o TPV em qualquer dispositivo com um browser.",
  },
  {
    id: 3,
    title: "Adiciona itens ao pedido",
    description:
      "No TPV, clica nos produtos que o cliente quer comprar. Eles aparecem automaticamente no painel do pedido.",
    emoji: "🛒",
    tip: "Podes ajustar quantidades e adicionar notas por item.",
  },
  {
    id: 4,
    title: "Processa o pagamento",
    description:
      'Quando o pedido estiver completo, clica em "Pagar" e seleciona o método de pagamento (numerário, cartão, etc.).',
    emoji: "💳",
    tip: "O recibo pode ser impresso ou enviado por email.",
  },
];

export function FirstSaleGuide() {
  const navigate = useNavigate();
  const { hasMenu, hasFirstSale, loading } = useOnboardingStatus();
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "0 0 8px 0",
          }}
        >
          🎯 Guia de Primeira Venda
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>
          Segue estes passos para fazer a tua primeira venda em menos de 10
          minutos.
        </p>
      </div>

      {/* Status banners */}
      {!loading && (
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <StatusBadge
            done={hasMenu}
            label={hasMenu ? "Menu criado ✓" : "Menu ainda não criado"}
            color={hasMenu ? "#32d74b" : "#ffa500"}
          />
          <StatusBadge
            done={hasFirstSale}
            label={
              hasFirstSale
                ? "Primeira venda feita ✓"
                : "Primeira venda ainda não feita"
            }
            color={hasFirstSale ? "#32d74b" : "#888"}
          />
        </div>
      )}

      {/* Completed state */}
      {hasMenu && hasFirstSale && !loading && (
        <div
          style={{
            padding: "24px 20px",
            borderRadius: 14,
            border: "2px solid #32d74b",
            background: "rgba(50, 215, 75, 0.08)",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            Onboarding completo!
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Tens menu criado e uma venda registada. Estás pronto para operar!
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/app/dashboard")}
            style={{ marginTop: 16 }}
          >
            Ir para o Dashboard
          </Button>
        </div>
      )}

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {STEPS.map((step) => {
          const isActive = activeStep === step.id;
          const isDone =
            (step.id === 1 && hasMenu) || (step.id === 4 && hasFirstSale);

          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              style={{
                border: isActive
                  ? "2px solid var(--accent)"
                  : isDone
                  ? "2px solid #32d74b"
                  : "2px solid var(--surface-border)",
                borderRadius: 14,
                background: isActive
                  ? "rgba(var(--accent-rgb, 255,165,0), 0.06)"
                  : "var(--card-bg-on-dark)",
                cursor: "pointer",
                overflow: "hidden",
                transition: "all 0.15s",
              }}
            >
              {/* Step header */}
              <div
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: isDone
                      ? "#32d74b"
                      : isActive
                      ? "var(--accent)"
                      : "var(--surface-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isDone ? 18 : 20,
                    flexShrink: 0,
                    fontWeight: 700,
                    color:
                      isDone || isActive ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {isDone ? "✓" : step.emoji}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: isDone
                        ? "#32d74b"
                        : isActive
                        ? "var(--accent)"
                        : "var(--text-primary)",
                    }}
                  >
                    Passo {step.id}: {step.title}
                  </div>
                </div>
                <span
                  style={{ marginLeft: "auto", fontSize: 18, opacity: 0.4 }}
                >
                  {isActive ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded content */}
              {isActive && (
                <div
                  style={{
                    padding: "0 20px 20px 20px",
                    borderTop: "1px solid var(--surface-border)",
                  }}
                >
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 14,
                      lineHeight: 1.6,
                      margin: "16px 0",
                    }}
                  >
                    {step.description}
                  </p>

                  {step.tip && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 16,
                        borderLeft: "3px solid var(--accent)",
                      }}
                    >
                      💡 {step.tip}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {step.action && (
                      <Button
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(step.action!.href);
                        }}
                      >
                        {step.action.label}
                      </Button>
                    )}
                    {step.id < STEPS.length && (
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStep(step.id + 1);
                        }}
                      >
                        Próximo passo →
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Demo mode shortcut */}
      <div
        style={{
          marginTop: 32,
          padding: "20px",
          borderRadius: 14,
          border: "1px dashed var(--surface-border)",
          background: "rgba(255,255,255,0.02)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          Queres experimentar sem dados reais?
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 16,
          }}
        >
          Usa o modo demonstração — o TPV é carregado com produtos de exemplo e
          o pagamento é simulado.
        </div>
        <Button variant="secondary" onClick={() => navigate("/tpv?demo=1")}>
          🎮 Abrir TPV em Modo Demo
        </Button>
      </div>

      {/* Back link */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button
          onClick={() => navigate("/app/onboarding/menu-demo")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 13,
            textDecoration: "underline",
          }}
        >
          ← Ver menu de exemplo
        </button>
      </div>
    </div>
  );
}

/* ---- Sub-components ----------------------------------------------------- */

function StatusBadge({
  done,
  label,
  color,
}: {
  done: boolean;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: 20,
        border: `1px solid ${color}`,
        background: `${color}18`,
        fontSize: 13,
        fontWeight: 600,
        color,
        width: "fit-content",
      }}
    >
      <span>{done ? "✓" : "○"}</span>
      {label}
    </div>
  );
}
