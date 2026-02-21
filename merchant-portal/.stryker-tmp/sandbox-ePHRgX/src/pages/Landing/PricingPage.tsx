/**
 * PUBLIC_SITE_CONTRACT: /pricing — Site do sistema (marketing).
 * NÃO carrega Runtime nem Core. Funciona offline.
 * Ref: Bloco 4 item 20 — ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md
 */
// @ts-nocheck

import { Link } from "react-router-dom";
import {
  CANONICAL_MONTHLY_PRICE_EUR,
  CANONICAL_MONTHLY_PRICE_LABEL,
} from "../../core/pricing/canonicalPrice";

const P = {
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceHover: "#1a1a1a",
  border: "#262626",
  borderAccent: "#22c55e",
  text: "#fafafa",
  muted: "#a3a3a3",
  accent: "#22c55e",
  accentHover: "#16a34a",
  radius: 14,
} as const;

const FEATURES = [
  "TPV completo (caixa + mesa + balcão)",
  "KDS — ecrã de cozinha em tempo real",
  "Dashboard do dono com métricas do dia",
  "Alertas operacionais automáticos",
  "Gestão de cardápio e categorias",
  "Histórico de turnos e vendas",
  "Funciona offline (PWA)",
  "Sem hardware extra — funciona no browser",
  "Suporte por WhatsApp",
] as const;

export function PricingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: P.bg,
        color: P.text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 24px 64px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: 520, marginBottom: 48 }}>
        <Link
          to="/"
          style={{
            fontSize: 13,
            color: P.muted,
            textDecoration: "none",
            marginBottom: 24,
            display: "inline-block",
          }}
        >
          ← Voltar ao início
        </Link>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            margin: "24px 0 12px",
            lineHeight: 1.2,
          }}
        >
          Um plano. Tudo incluído.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: P.muted,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Sem surpresas, sem módulos extra. O preço é o mesmo para todos.
        </p>
      </div>

      {/* Plan Card */}
      <div
        style={{
          background: P.surface,
          border: `2px solid ${P.borderAccent}`,
          borderRadius: P.radius,
          padding: "40px 32px",
          maxWidth: 420,
          width: "100%",
          position: "relative",
        }}
      >
        {/* Badge */}
        <div
          style={{
            position: "absolute",
            top: -13,
            left: "50%",
            transform: "translateX(-50%)",
            background: P.accent,
            color: "#000",
            fontSize: 12,
            fontWeight: 700,
            padding: "5px 16px",
            borderRadius: 20,
            letterSpacing: 0.5,
          }}
        >
          14 DIAS GRÁTIS
        </div>

        {/* Price */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 28,
            paddingTop: 8,
          }}
        >
          <div style={{ fontSize: 14, color: P.muted, marginBottom: 4 }}>
            Plano Profissional
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {CANONICAL_MONTHLY_PRICE_EUR}
            <span style={{ fontSize: 20, fontWeight: 500, color: P.muted }}>
              {" "}
              €/mês
            </span>
          </div>
          <div style={{ fontSize: 13, color: P.muted }}>
            após o período de teste gratuito
          </div>
        </div>

        {/* Features */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 28px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {FEATURES.map((f, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                lineHeight: 1.4,
                color: P.text,
              }}
            >
              <span
                style={{
                  color: P.accent,
                  fontSize: 16,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          to="/auth"
          style={{
            display: "block",
            textAlign: "center",
            padding: "14px 24px",
            background: P.accent,
            color: "#000",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
            transition: "background 150ms",
          }}
          onMouseOver={(e) =>
            ((e.target as HTMLElement).style.background = P.accentHover)
          }
          onMouseOut={(e) =>
            ((e.target as HTMLElement).style.background = P.accent)
          }
        >
          Testar 14 dias grátis
        </Link>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#666",
            marginTop: 14,
            lineHeight: 1.4,
          }}
        >
          Sem cartão de crédito · Sem compromisso · Cancela a qualquer
          momento
        </p>
      </div>

      {/* FAQ compact */}
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          marginTop: 48,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Perguntas frequentes
        </h2>
        {[
          {
            q: "Preciso de hardware especial?",
            a: "Não. Funciona em qualquer dispositivo com browser — tablet, telemóvel ou PC.",
          },
          {
            q: "E se não gostar?",
            a: "Cancela quando quiseres. Sem períodos mínimos, sem multas. Os teus dados ficam disponíveis para exportar.",
          },
          {
            q: `Porquê ${CANONICAL_MONTHLY_PRICE_LABEL}?`,
            a: "Inclui tudo: TPV, KDS, dashboard, alertas, métricas e suporte. Sem módulos extra nem custos escondidos.",
          },
          {
            q: "Posso usar durante o período de teste sem pagar?",
            a: "Sim. 14 dias completos, sem restrições de funcionalidade. Se fizer sentido, escolhes o plano. Se não, paras sem compromisso.",
          },
        ].map((faq, i) => (
          <div
            key={i}
            style={{
              marginBottom: 16,
              padding: "16px 18px",
              background: P.surface,
              borderRadius: 10,
              border: `1px solid ${P.border}`,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: P.text,
                marginBottom: 6,
              }}
            >
              {faq.q}
            </div>
            <div
              style={{
                fontSize: 13,
                color: P.muted,
                lineHeight: 1.5,
              }}
            >
              {faq.a}
            </div>
          </div>
        ))}
      </div>

      {/* Footer links */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          gap: 20,
          fontSize: 13,
        }}
      >
        <Link to="/" style={{ color: P.muted, textDecoration: "none" }}>
          Início
        </Link>
        <Link to="/auth" style={{ color: P.accent, textDecoration: "none" }}>
          Entrar
        </Link>
      </div>
    </main>
  );
}
