/**
 * WelcomeOverlay — Post-signup 3-step welcome screen.
 *
 * Shows once after the first restaurant creation.
 * Persisted via localStorage key `chefiapp_welcome_seen`.
 * Ref: Bloco 4 item 19 — ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md
 */

import { useCallback, useEffect, useState } from "react";

const WELCOME_KEY = "chefiapp_welcome_seen";

const STEPS = [
  {
    icon: "🏪",
    title: "Restaurante registado",
    description: "Nome, tipo e país configurados.",
    done: true,
  },
  {
    icon: "🍽️",
    title: "Criar primeiro produto",
    description: "Adiciona pelo menos 1 item ao cardápio (nome + preço).",
    done: false,
    cta: "Ir ao cardápio",
    path: "/app/menu",
  },
  {
    icon: "💰",
    title: "Fazer a primeira venda",
    description:
      "Abre o TPV, escolhe mesa/balcão, adiciona itens e fecha a conta.",
    done: false,
    cta: "Abrir TPV",
    path: "/op/tpv",
  },
] as const;

export function WelcomeOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay for mount animation
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      // storage not available
    }
    setTimeout(onDismiss, 250);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 250ms ease",
      }}
      onClick={handleDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#141414",
          border: "1px solid #262626",
          borderRadius: 16,
          padding: "40px 32px",
          maxWidth: 440,
          width: "90vw",
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "transform 300ms ease",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "rgba(50, 215, 75, 0.1)",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              marginBottom: 16,
              border: "1px solid rgba(50, 215, 75, 0.3)",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#fafafa",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            Bem-vindo ao ChefIApp
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "#a3a3a3",
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Em 3 passos estás a vender. Sem instalações complexas.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                padding: "14px 16px",
                background: step.done
                  ? "rgba(50, 215, 75, 0.06)"
                  : "rgba(255,255,255,0.03)",
                borderRadius: 10,
                border: `1px solid ${
                  step.done ? "rgba(50, 215, 75, 0.2)" : "#262626"
                }`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: step.done
                    ? "rgba(50, 215, 75, 0.15)"
                    : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {step.done ? "✓" : step.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: step.done ? "#32d74b" : "#fafafa",
                    lineHeight: 1.3,
                  }}
                >
                  {i + 1}. {step.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#a3a3a3",
                    marginTop: 3,
                    lineHeight: 1.4,
                  }}
                >
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleDismiss}
          style={{
            width: "100%",
            marginTop: 28,
            padding: "14px 24px",
            background: "#22c55e",
            color: "#000",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            transition: "background 150ms",
          }}
          onMouseOver={(e) =>
            ((e.target as HTMLButtonElement).style.background = "#16a34a")
          }
          onMouseOut={(e) =>
            ((e.target as HTMLButtonElement).style.background = "#22c55e")
          }
        >
          Começar agora
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#666",
            marginTop: 14,
            lineHeight: 1.4,
          }}
        >
          14 dias grátis · Sem compromisso · Cancela quando quiseres
        </p>
      </div>
    </div>
  );
}
