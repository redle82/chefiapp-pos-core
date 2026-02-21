import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getAuthActions } from "../../core/auth/authAdapter";
import {
  BackendType,
  getBackendConfigured,
  getBackendType,
} from "../../core/infra/backendAdapter";
import { GlobalLoadingView } from "../../ui/design-system/components";

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
  },
  buttonPrimary: { backgroundColor: "#eab308", color: "#0a0a0a" },
  link: { color: "#eab308", textDecoration: "none", fontWeight: 500 },
  error: { fontSize: 13, color: "#f87171", marginBottom: 12 },
};

const SIGNUP_INTENT_KEY = "chefiapp_signup_intent";

export function PhoneLoginPage() {
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      try {
        sessionStorage.setItem(SIGNUP_INTENT_KEY, "1");
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  const hasBackend = getBackendConfigured();
  const isDocker = getBackendType() === BackendType.docker;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError("Indica o teu telefone.");
      return;
    }

    if (!hasBackend || !isDocker) {
      setError(
        "Backend não configurado para login por telefone. Verifica a configuração do Core.",
      );
      return;
    }

    setLoading(true);
    try {
      try {
        window.localStorage.setItem("chefiapp_owner_phone", phone.trim());
      } catch {
        // ignore storage errors
      }
      getAuthActions().signIn();
      navigate("/auth/verify", { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao entrar. Tente de novo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!hasBackend) {
    return (
      <div data-testid="auth-backend-missing">
        <GlobalLoadingView
          message="Backend não configurado. Define VITE_CORE_URL e VITE_CORE_ANON_KEY."
          layout="operational"
          variant="fullscreen"
        />
      </div>
    );
  }

  return (
    <div style={styles.page} data-testid="auth-phone-form">
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/logo-chefiapp-clean.png"
            alt="ChefIApp"
            style={{
              width: 48,
              height: 48,
              objectFit: "contain",
              borderRadius: 12,
            }}
          />
          <h1 style={{ ...styles.title, marginTop: 12 }}>
            Entrar com telefone
          </h1>
          <p style={styles.subtitle}>
            Introduz o teu número. Enviamos um código por SMS.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p style={styles.error}>{error}</p>}
          <label style={styles.label}>Telefone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+351 912 345 678"
            required
            style={styles.input}
            data-testid="auth-phone-input"
          />
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...styles.buttonPrimary }}
          >
            {loading ? "A enviar..." : "Receber código"}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 13, textAlign: "center" }}>
          <Link to="/auth/email" style={styles.link}>
            Prefiro entrar com email
          </Link>
        </div>

        <Link
          to="/"
          style={{
            ...styles.link,
            display: "block",
            marginTop: 24,
            textAlign: "center",
            fontSize: 13,
          }}
        >
          ← Voltar à landing
        </Link>
      </div>
    </div>
  );
}
