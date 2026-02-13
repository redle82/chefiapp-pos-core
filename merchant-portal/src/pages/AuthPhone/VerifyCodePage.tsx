import { useState } from "react";
import { Link } from "react-router-dom";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #171717 50%, #1c1917 100%)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    padding: 32,
    borderRadius: 12,
    border: "1px solid #262626",
    backgroundColor: "rgba(23, 23, 23, 0.9)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#fafafa" },
  subtitle: { fontSize: 14, color: "#a3a3a3", marginBottom: 24 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#a3a3a3",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #404040",
    borderRadius: 8,
    backgroundColor: "#171717",
    color: "#fafafa",
    marginBottom: 16,
  },
  button: {
    width: "100%",
    minHeight: 44,
    padding: "14px 20px",
    fontSize: 15,
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 8,
    backgroundColor: "#eab308",
    color: "#0a0a0a",
  },
  link: { color: "#eab308", textDecoration: "none", fontWeight: 500 },
};

export function VerifyCodePage() {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // A verificação real do código é feita pelo provedor de autenticação (ex.: Keycloak).
    // Esta tela existe apenas como representação UX do fluxo \"/auth/verify\".
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/Logo Chefiapp.png"
            alt="ChefIApp"
            style={{
              width: 48,
              height: 48,
              objectFit: "contain",
              borderRadius: 12,
            }}
          />
          <h1 style={{ ...styles.title, marginTop: 12 }}>Confirmar código</h1>
          <p style={styles.subtitle}>
            Introduz o código que recebeste por SMS.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Código SMS</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123 456"
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Entrar
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 13, textAlign: "center" }}>
          <Link to="/auth/phone" style={styles.link}>
            Voltar ao login por telefone
          </Link>
        </div>
      </div>
    </div>
  );
}

