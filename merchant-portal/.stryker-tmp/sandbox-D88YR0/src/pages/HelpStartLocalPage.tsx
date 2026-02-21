/**
 * Página "Como iniciar o servidor local?" — acessível quando Core está em baixo.
 * Mostra um único comando para dev/piloto; reduz medo e frustração do banner "Core indisponível".
 */

import { Link } from "react-router-dom";

export function HelpStartLocalPage() {
  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.25rem", marginBottom: 16 }}>
        Como iniciar o servidor local?
      </h1>
      <p style={{ marginBottom: 16 }}>
        O backend (Docker Core) não está em execução. Para ter o sistema a
        funcionar em local:
      </p>
      <ol style={{ marginLeft: 20, marginBottom: 16 }}>
        <li style={{ marginBottom: 8 }}>
          Garante que o <strong>Docker</strong> está em execução (ex.: Docker
          Desktop aberto).
        </li>
        <li style={{ marginBottom: 8 }}>
          Na <strong>raiz do repositório</strong>, corre:
        </li>
      </ol>
      <pre
        style={{
          background: "rgba(0,0,0,0.08)",
          padding: 12,
          borderRadius: 8,
          overflow: "auto",
          marginBottom: 16,
        }}
      >
        <code>./start-local.sh</code>
      </pre>
      <p style={{ marginBottom: 8 }}>ou</p>
      <pre
        style={{
          background: "rgba(0,0,0,0.08)",
          padding: 12,
          borderRadius: 8,
          overflow: "auto",
          marginBottom: 16,
        }}
      >
        <code>npm run start:local</code>
      </pre>
      <p style={{ marginBottom: 16 }}>
        O script sobe o Docker Core e o Merchant-portal e abre o browser. Quando
        o servidor estiver pronto, volta a esta app e clica em &quot;Tentar
        novamente&quot; no banner.
      </p>
      <p style={{ marginBottom: 16 }}>
        Documentação completa:{" "}
        <code>docs/implementation/FASE_5_COMO_INICIAR_1_MINUTO.md</code> no
        repositório.
      </p>
      <Link to="/" style={{ color: "var(--color-link, #0066cc)" }}>
        Voltar à landing
      </Link>
    </div>
  );
}
