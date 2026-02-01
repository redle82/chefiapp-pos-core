/**
 * Card explicativo do Modo Demo (MODO_DEMO_EXPLICATIVO_SPEC).
 * Exibido quando o usuário está em modo demo e acede a uma rota bloqueada (TPV, KDS, etc.).
 * Padrão: O que é / Por que existe / Como se conecta / Quando ativado.
 */

import type { DemoExplicativoModuleId } from "./demoExplicativoContent";
import {
  DEMO_EXPLICATIVO_CONTENT,
  type DemoExplicativoBloco,
} from "./demoExplicativoContent";

const defaultBloco: DemoExplicativoBloco = {
  titulo: "Este módulo",
  oQueE: "Faz parte do sistema operacional do restaurante.",
  porQueExiste: "Resolve uma necessidade específica da operação.",
  comoSeConecta: "Conecta-se com outros módulos e com o Core.",
  quandoAtivado: "Em piloto ou ao vivo, funciona com dados reais.",
};

export function DemoExplicativoCard({
  moduleId,
  style: styleProp,
}: {
  moduleId: DemoExplicativoModuleId | string;
  style?: React.CSSProperties;
}) {
  const bloco =
    DEMO_EXPLICATIVO_CONTENT[moduleId as DemoExplicativoModuleId] ??
    defaultBloco;

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 12,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        maxWidth: 560,
        ...styleProp,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#667eea",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 8,
        }}
      >
        Modo demo — explicação
      </div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#1a1a1a",
          marginBottom: 16,
        }}
      >
        {bloco.titulo}
      </h2>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 4,
            }}
          >
            O que é
          </div>
          <p
            style={{
              fontSize: 14,
              color: "#334155",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {bloco.oQueE}
          </p>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 4,
            }}
          >
            Por que existe
          </div>
          <p
            style={{
              fontSize: 14,
              color: "#334155",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {bloco.porQueExiste}
          </p>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 4,
            }}
          >
            Como se conecta
          </div>
          <p
            style={{
              fontSize: 14,
              color: "#334155",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {bloco.comoSeConecta}
          </p>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 4,
            }}
          >
            Quando ativado (piloto ou ao vivo)
          </div>
          <p
            style={{
              fontSize: 14,
              color: "#334155",
              margin: "0 0 20px 0",
              lineHeight: 1.5,
            }}
          >
            {bloco.whenAtivado ?? bloco.quandoAtivado}
          </p>
          <button
            onClick={async () => {
              // Trigger the Pilot activation by setting the product mode
              // This bypasses the blocker effectively
              const res = await window.confirm(
                "Deseja ativar o Modo Piloto para testar este módulo agora?",
              );
              if (res) {
                // We'll rely on the parent or window global for simplicity in B1 phase
                // if the setter is available
                // @ts-ignore
                if (window.__CHEF_SET_PILOT) {
                  // @ts-ignore
                  window.__CHEF_SET_PILOT();
                } else {
                  // Fallback: navigate to dashboard to activate
                  window.location.href = "/dashboard?demo=true&activate=pilot";
                }
              }
            }}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ativar Piloto e Explorar
          </button>
        </div>
      </section>
    </div>
  );
}
