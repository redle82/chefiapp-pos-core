/**
 * BillingSuccessPage — Página exibida após checkout Stripe concluído
 *
 * Mensagem clara "Assinatura ativa" e links para Dashboard e TPV.
 */

import { Link, useNavigate } from "react-router-dom";

export function BillingSuccessPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f0fdf4",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          textAlign: "center",
          padding: "32px 24px",
          borderRadius: 16,
          backgroundColor: "#fff",
          border: "1px solid #bbf7d0",
          boxShadow: "0 4px 20px rgba(34, 197, 94, 0.12)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#166534",
            marginBottom: 8,
          }}
        >
          Assinatura ativa
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#15803d",
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          O modo ao vivo foi ativado. O seu restaurante está pronto para operar.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              backgroundColor: "#22c55e",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Ir ao Dashboard
          </button>
          <Link
            to="/op/tpv"
            style={{
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              color: "#166534",
              backgroundColor: "transparent",
              border: "1px solid #22c55e",
              borderRadius: 10,
              textDecoration: "none",
              display: "block",
            }}
          >
            Ir ao TPV
          </Link>
        </div>
      </div>
    </div>
  );
}
