/**
 * RunbookCorePage — Instruções para subir e verificar o Core local (Docker).
 * Ligado ao estado CORE_OFFLINE no TPV e no Dashboard (cartão Operação).
 */

import { Link } from "react-router-dom";

export function RunbookCorePage() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 20px",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#1a1a1a",
      }}
    >
      <h1 style={{ fontSize: "22px", marginBottom: "8px" }}>
        Runbook — Core local (Docker)
      </h1>
      <p style={{ color: "#555", fontSize: "14px", marginBottom: "24px" }}>
        Como subir o Docker Core, verificar saúde e confirmar restaurante e
        menu.
      </p>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
          1. Subir o Docker Core
        </h2>
        <pre
          style={{
            padding: "12px 16px",
            backgroundColor: "#f4f4f5",
            borderRadius: "8px",
            fontSize: "13px",
            overflow: "auto",
          }}
        >
          {`cd docker-core
docker compose -f docker-compose.core.yml up -d`}
        </pre>
        <p style={{ fontSize: "13px", color: "#555", marginTop: "8px" }}>
          Serviços: Postgres (54320), PostgREST (3001), Realtime (4000).
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
          2. Verificar saúde (PostgREST)
        </h2>
        <pre
          style={{
            padding: "12px 16px",
            backgroundColor: "#f4f4f5",
            borderRadius: "8px",
            fontSize: "13px",
            overflow: "auto",
          }}
        >
          {`curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
# Esperado: 200 ou 404`}
        </pre>
        <p style={{ fontSize: "13px", color: "#555", marginTop: "8px" }}>
          Ou abrir no browser: <code>http://localhost:3001/</code> — deve
          responder (não 502 / connection refused).
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
          3. Confirmar restaurante e menu
        </h2>
        <p style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
          O menu está publicado quando o restaurante está <em>active</em> e tem
          produtos em <code>gm_products</code>. O caixa deve estar aberto para
          operar no TPV (botão &quot;Abrir Turno&quot; no TPV).
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
          4. Reset completo (volume limpo)
        </h2>
        <pre
          style={{
            padding: "12px 16px",
            backgroundColor: "#f4f4f5",
            borderRadius: "8px",
            fontSize: "13px",
            overflow: "auto",
          }}
        >
          {`cd docker-core
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d`}
        </pre>
        <p style={{ fontSize: "13px", color: "#555", marginTop: "8px" }}>
          Os scripts de init só correm na primeira criação do volume.
        </p>
      </section>

      <p style={{ fontSize: "12px", color: "#888", marginTop: "24px" }}>
        Documento completo: <code>docs/ops/RUNBOOK_CORE_LOCAL.md</code>. Setup
        ENTERPRISE: <code>docs/strategy/ENTERPRISE_LOCAL_SETUP.md</code>.
      </p>

      <div style={{ marginTop: "24px" }}>
        <Link
          to="/op/tpv"
          style={{
            color: "#059669",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          Voltar ao TPV
        </Link>
        {" · "}
        <Link
          to="/dashboard"
          style={{
            color: "#059669",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
