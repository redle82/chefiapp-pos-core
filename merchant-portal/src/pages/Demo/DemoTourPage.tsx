/**
 * DemoTourPage — "Explorar demonstração"
 *
 * Tour guiado em 4 passos (Observe, Pense, Sugira, Como tudo se conecta) acionado pelo CTA da landing.
 * Demonstração interativa, sem dados reais. LANDING_STATE_ROUTING_CONTRACT: Demo nunca cria restaurante;
 * CTA "Explorar o Sistema (Demo)" leva a /auth para operar de verdade.
 */

import { useNavigate } from "react-router-dom";
import { OSCopy } from "../../ui/design-system/sovereign/OSCopy";

const STEPS = [
  {
    num: 1,
    title: "Observe",
    desc: "O sistema lê o contexto operacional em tempo real: mesas, pedidos, cozinha, tempo de espera.",
    icon: "👁️",
  },
  {
    num: 2,
    title: "Pense",
    desc: "Analisa impacto, urgência e risco. Prioriza o que mais importa agora.",
    icon: "🧠",
  },
  {
    num: 3,
    title: "Sugira",
    desc: "Recomenda uma ação por vez, com explicação clara. Ex.: «Mesa 5 quer pagar há 5 minutos.»",
    icon: "💡",
  },
  {
    num: 4,
    title: "Como tudo se conecta",
    desc: "O próprio sistema é o mapa: o Dashboard é a porta de entrada; TPV, KDS e Tarefas falam entre si; a Configuração alimenta tudo. Em demo você vê explicações; em piloto ou ao vivo, opera com dados reais.",
    icon: "🧭",
  },
];

const CONECTA_NODES = [
  { label: "Dashboard", desc: "Porta de entrada e estado do sistema" },
  { label: "TPV / Caixa", desc: "Pedidos e pagamentos" },
  { label: "KDS", desc: "Cozinha vê pedidos e tempos" },
  { label: "Tarefas", desc: "Sugestões prioritárias" },
  { label: "Configuração", desc: "Cardápio, mesas, equipe" },
  { label: "Modos", desc: "Demo, piloto ou ao vivo" },
];

export function DemoTourPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: "640px", width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "9999px",
              border: "1px solid #667eea",
              color: "#667eea",
              backgroundColor: "rgba(102, 126, 234, 0.08)",
            }}
            aria-live="polite"
          >
            {OSCopy.demo.modoDemo}
          </span>
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#667eea",
            fontWeight: 600,
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Como funciona
        </div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: "12px",
          }}
        >
          Como o sistema operacional organiza decisões no restaurante
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#666",
            marginBottom: "40px",
            lineHeight: 1.5,
          }}
        >
          Quatro passos: observar, priorizar, sugerir e ver como tudo se
          conecta.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            marginBottom: "48px",
          }}
        >
          {STEPS.map((step) => (
            <div
              key={step.num}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                padding: "20px",
                backgroundColor: "#fff",
                borderRadius: "12px",
                border: "1px solid #e0e0e0",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#667eea",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#667eea",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Passo {step.num}
                </div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    marginBottom: "6px",
                  }}
                >
                  {step.title}
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    lineHeight: 1.5,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginBottom: "32px",
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            border: "1px solid #e0e0e0",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#667eea",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            Como tudo se conecta
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              fontSize: "14px",
              color: "#334155",
              lineHeight: 1.8,
            }}
          >
            {CONECTA_NODES.map((node) => (
              <li key={node.label}>
                <strong>{node.label}</strong> — {node.desc}
              </li>
            ))}
          </ul>
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "#999",
            marginBottom: "16px",
          }}
        >
          Demonstração interativa. Sem dados reais.
        </p>
        <button
          type="button"
          onClick={() => navigate("/op/tpv?mode=demo")}
          style={{
            padding: "16px 32px",
            fontSize: "16px",
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#667eea",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            marginRight: "12px",
            marginBottom: "8px",
          }}
        >
          {OSCopy.demo.explorarTpvDemo}
        </button>
        <button
          type="button"
          onClick={() => navigate("/auth")}
          style={{
            padding: "16px 32px",
            fontSize: "16px",
            fontWeight: 600,
            color: "#667eea",
            backgroundColor: "transparent",
            border: "2px solid #667eea",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "8px",
          }}
        >
          {OSCopy.demo.criarContaOperar}
        </button>
        <p style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
          Para operar com dados reais, crie conta e entre.
        </p>
        <div style={{ marginTop: "24px" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              color: "#666",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← {OSCopy.demo.voltarLanding}
          </button>
        </div>
      </div>
    </div>
  );
}
