/**
 * AuthPage — Login e Registo (CAMINHO_DO_CLIENTE)
 *
 * /auth = login (já tenho conta)
 * /signup = registo (entrar em operação)
 * Sem Runtime/Core. Após sucesso → /app/dashboard.
 * Backend único: Docker Core (Keycloak + mock). Trial/pilot: link ou mensagem.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getAuthActions } from "../core/auth/authAdapter";
import { useAuth } from "../core/auth/useAuth";
import {
  BackendType,
  getBackendConfigured,
  getBackendType,
} from "../core/infra/backendAdapter";
import { GlobalLoadingView } from "../ui/design-system/components";
import { OSCopy } from "../ui/design-system/sovereign/OSCopy";

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
  buttonSecondary: {
    backgroundColor: "transparent",
    color: "#a3a3a3",
    border: "1px solid #404040",
  },
  error: { fontSize: 13, color: "#f87171", marginBottom: 12 },
  link: { color: "#eab308", textDecoration: "none", fontWeight: 500 },
  tabs: { display: "flex", gap: 8, marginBottom: 24 },
  tab: {
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  tabActive: { backgroundColor: "#262626", color: "#fafafa" },
  tabInactive: { color: "#737373" },
  trialGuideBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    border: "1px solid #404040",
    backgroundColor: "#171717",
    fontSize: 14,
    color: "#a3a3a3",
  },
};

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const modeFromUrl =
    searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(modeFromUrl);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  // Backend único: Docker Core (Keycloak + mock). Sem Supabase.
  const hasCore = getBackendType() === BackendType.docker;

  const getLastRoute = (): string => {
    try {
      const stored = sessionStorage.getItem("chefiapp_lastRoute");
      const allowed = [
        "/dashboard",
        "/app/dashboard",
        "/op/tpv",
        "/op/kds",
        "/op/cash",
      ];
      if (stored && allowed.includes(stored)) return stored;
    } catch {
      // ignore
    }
    return "/app/dashboard";
  };

  useEffect(() => {
    setMode(modeFromUrl);
  }, [modeFromUrl]);

  useEffect(() => {
    if (authLoading) return;
    if (session) {
      navigate(getLastRoute(), { replace: true });
    }
  }, [session, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      // Docker Core only: Keycloak redirect or mock; no Supabase auth.
      if (hasCore) {
        getAuthActions().signIn();
        return;
      }
      setError(
        "Backend não configurado. Defina VITE_CORE_URL e VITE_CORE_ANON_KEY.",
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro ao entrar. Tente de novo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!getBackendConfigured()) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Backend não configurado</h1>
          <p style={{ ...styles.subtitle, marginBottom: 16 }}>
            Em produção é preciso definir as variáveis de ambiente{" "}
            <code style={{ fontSize: 12, color: "#a3a3a3" }}>
              VITE_CORE_URL
            </code>{" "}
            e{" "}
            <code style={{ fontSize: 12, color: "#a3a3a3" }}>
              VITE_CORE_ANON_KEY
            </code>{" "}
            (Docker Core). Ver{" "}
            <code style={{ fontSize: 12, color: "#a3a3a3" }}>
              docs/DEPLOY_VERCEL.md
            </code>
            .
          </p>
          <Link to="/" style={styles.link}>
            ← Voltar à landing
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <GlobalLoadingView
        message="A verificar sessão..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  if (session) {
    return (
      <GlobalLoadingView
        message="A redirecionar..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

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
          <h1 style={{ ...styles.title, marginTop: 12 }}>ChefIApp</h1>
          <p style={styles.subtitle}>TPV que pensa antes do humano</p>
        </div>

        {hasCore ? (
          <div style={styles.trialGuideBox}>
            <p style={{ margin: "0 0 12px 0" }}>
              Em modo local não há registo na web. Para criar conta e comprar o
              produto, use a aplicação em produção (URL real).
            </p>
            <p style={{ margin: 0 }}>
              Pode continuar com{" "}
              <Link to="/op/tpv?mode=trial" style={styles.link}>
                Ver Demo Guide (3 min)
              </Link>
              .
            </p>
            <button
              onClick={() => {
                localStorage.setItem("chefiapp_pilot_mode", "true");
                navigate("/bootstrap");
              }}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                marginTop: 16,
                backgroundColor: "rgba(50, 215, 75, 0.1)",
                borderColor: "#32d74b",
                color: "#32d74b",
              }}
            >
              Simular Registo (Piloto)
            </button>
            <Link
              to="/"
              style={{ ...styles.link, display: "inline-block", marginTop: 12 }}
            >
              ← Voltar à landing
            </Link>
          </div>
        ) : (
          <>
            <div style={styles.tabs}>
              <button
                type="button"
                style={{
                  ...styles.tab,
                  ...(mode === "login" ? styles.tabActive : styles.tabInactive),
                }}
                onClick={() => setMode("login")}
              >
                Entrar
              </button>
              <button
                type="button"
                style={{
                  ...styles.tab,
                  ...(mode === "signup"
                    ? styles.tabActive
                    : styles.tabInactive),
                }}
                onClick={() => setMode("signup")}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <p style={styles.error}>{error}</p>}
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={styles.input}
                autoComplete="email"
              />
              <label style={styles.label}>Palavra-passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
              {mode === "signup" && (
                <>
                  <label style={styles.label}>Confirmar palavra-passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={styles.input}
                    autoComplete="new-password"
                  />
                </>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{ ...styles.button, ...styles.buttonPrimary }}
              >
                {loading
                  ? "A processar..."
                  : mode === "signup"
                  ? "Criar conta"
                  : "Entrar"}
              </button>
            </form>

            <p
              style={{
                fontSize: 13,
                color: "#737373",
                marginTop: 20,
                textAlign: "center",
              }}
            >
              {mode === "login" ? (
                <>
                  Ainda não tem conta?{" "}
                  <Link
                    to="/signup"
                    style={styles.link}
                    onClick={() => setMode("signup")}
                  >
                    Criar conta
                  </Link>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <Link
                    to="/auth"
                    style={styles.link}
                    onClick={() => setMode("login")}
                  >
                    Entrar
                  </Link>
                </>
              )}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#737373",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              <Link to="/auth" style={styles.link}>
                {OSCopy.landing.ctaVerSistema3Min}
              </Link>
            </p>
          </>
        )}

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
