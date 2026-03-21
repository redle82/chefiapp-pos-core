/**
 * EmailOTPLoginPage -- Two-step email OTP login (no password).
 *
 * Step 1: User enters email, clicks "Enviar codigo".
 * Step 2: User enters 6-digit OTP from email, clicks "Verificar".
 *
 * On success the AuthProvider picks up the new Supabase session via
 * onAuthStateChange, so we just need to navigate to the right place.
 *
 * Post-verification routing:
 *   - If user has no restaurant membership -> /welcome (onboarding)
 *   - If user has restaurant -> /admin/home or last route
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailOtp, verifyEmailOtp } from "../../core/auth/supabaseAuth";
import { identifyAuthenticatedUser } from "../../bootstrap/analytics";
import { useAuth } from "../../core/auth/useAuth";
import { CONFIG } from "../../config";
import { getBackendConfigured } from "../../core/infra/backendAdapter";
import { GlobalLoadingView } from "../../ui/design-system/components";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMAIL_STORAGE_KEY = "chefiapp_auth_email";
const RESEND_COOLDOWN_SEC = 30;

// ---------------------------------------------------------------------------
// Styles (inline, matching dark theme from AuthPage / PhoneLoginPage)
// ---------------------------------------------------------------------------

const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #0a0a0a 0%, #171717 50%, #1c1917 100%)",
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
  logo: {
    width: 48,
    height: 48,
    objectFit: "contain" as const,
    borderRadius: 12,
  },
  title: { fontSize: 22, fontWeight: 700, marginTop: 12, marginBottom: 8, color: "#fafafa" },
  subtitle: { fontSize: 14, color: "#a3a3a3", marginBottom: 24 },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "#a3a3a3", marginBottom: 6 },
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
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" as const },
  error: { fontSize: 13, color: "#f87171", marginBottom: 12 },
  link: { color: "#eab308", textDecoration: "none", fontWeight: 500 },
  center: { textAlign: "center" as const },
  hint: { marginTop: 16, fontSize: 13, textAlign: "center" as const, color: "#a3a3a3" },
  resendBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: "8px 0",
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLastRoute(): string {
  try {
    const stored = sessionStorage.getItem("chefiapp_lastRoute");
    const allowed = ["/admin/home", "/admin/modules", "/op/tpv", "/op/kds", "/op/cash", "/app/dashboard"];
    if (stored && allowed.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return CONFIG.isSupabaseBackend ? "/admin/home" : "/app/dashboard";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmailOTPLoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  // Step: "email" (enter email) or "otp" (enter code)
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend cooldown
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // Already authenticated -> redirect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (session) {
      navigate(getLastRoute(), { replace: true });
    }
  }, [session, authLoading, navigate]);

  // ---------------------------------------------------------------------------
  // Restore email from storage (e.g. if user refreshed on step 2)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
      if (stored) setEmail(stored);
    } catch {
      // ignore
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Cooldown timer
  // ---------------------------------------------------------------------------
  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_SEC);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Step 1: Send OTP
  // ---------------------------------------------------------------------------
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = email.trim().toLowerCase();
    if (!cleaned || !cleaned.includes("@")) {
      setError("Introduz um email valido.");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmailOtp(cleaned);
      if ("error" in result) {
        setError(result.error.message);
        return;
      }
      // Persist email for step 2
      try {
        localStorage.setItem(EMAIL_STORAGE_KEY, cleaned);
      } catch {
        // ignore
      }
      setEmail(cleaned);
      setStep("otp");
      startCooldown();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar codigo. Tenta de novo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Step 2: Verify OTP
  // ---------------------------------------------------------------------------
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = otp.trim().replace(/\s/g, "");
    if (!cleaned || cleaned.length < 6) {
      setError("Introduz o codigo de 6 digitos.");
      return;
    }

    const savedEmail = email || localStorage.getItem(EMAIL_STORAGE_KEY) || "";
    if (!savedEmail) {
      setError("Email nao encontrado. Volta ao passo anterior.");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmailOtp(savedEmail, cleaned);
      if ("error" in result) {
        // Friendly messages for common errors
        const msg = result.error.message;
        if (msg.toLowerCase().includes("expired")) {
          setError("Codigo expirado. Pede um novo codigo.");
        } else if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("incorrect")) {
          setError("Codigo incorreto. Verifica e tenta de novo.");
        } else {
          setError(msg);
        }
        return;
      }

      // Session is now active -- AuthProvider will pick it up via onAuthStateChange.
      // Identify user across analytics providers (Sentry + PostHog).
      if (result.user) {
        identifyAuthenticatedUser(result.user.id, { email: result.user.email });
      }

      // Navigate based on context. The AuthProvider + CoreFlow will handle the
      // final destination (setup/start if no restaurant, admin/tpv if ready).
      navigate("/setup/start", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao verificar codigo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Resend code
  // ---------------------------------------------------------------------------
  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const savedEmail = email || localStorage.getItem(EMAIL_STORAGE_KEY) || "";
      if (!savedEmail) {
        setError("Email nao encontrado.");
        return;
      }
      const result = await signInWithEmailOtp(savedEmail);
      if ("error" in result) {
        setError(result.error.message);
      } else {
        startCooldown();
      }
    } catch {
      setError("Erro ao reenviar codigo.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Guards: backend not configured / auth loading / already logged in
  // ---------------------------------------------------------------------------
  if (!getBackendConfigured()) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <h1 style={S.title}>Backend nao configurado</h1>
          <p style={{ ...S.subtitle, marginBottom: 16 }}>
            Define <code style={{ fontSize: 12, color: "#a3a3a3" }}>VITE_CORE_URL</code> e{" "}
            <code style={{ fontSize: 12, color: "#a3a3a3" }}>VITE_CORE_ANON_KEY</code>.
          </p>
          <Link to="/" style={S.link}>Voltar</Link>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <GlobalLoadingView
        message="A verificar sessao..."
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Header */}
        <div style={S.center}>
          <img src="/logo-chefiapp-clean.png" alt="ChefIApp" style={S.logo} />
          <h1 style={S.title}>Entrar no ChefIApp</h1>
          <p style={S.subtitle}>
            {step === "email"
              ? "Sem password. Enviamos um codigo por email."
              : (
                <>
                  Enviamos um codigo de 6 digitos para{" "}
                  <strong style={{ color: "#fafafa" }}>{email}</strong>.
                  <br />
                  Verifica a caixa de entrada (e spam).
                </>
              )}
          </p>
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendCode}>
            {error && <p style={S.error}>{error}</p>}
            <label style={S.label} htmlFor="otp-email-input">Email</label>
            <input
              id="otp-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="o-teu@email.com"
              required
              style={S.input}
              autoComplete="email"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              style={{ ...S.button, ...(loading ? S.buttonDisabled : {}) }}
            >
              {loading ? "A enviar codigo..." : "Enviar codigo"}
            </button>
          </form>
        )}

        {/* Step 2: OTP verification */}
        {step === "otp" && (
          <form onSubmit={handleVerify}>
            {error && <p style={S.error}>{error}</p>}
            <label style={S.label} htmlFor="otp-code-input">Codigo de verificacao</label>
            <input
              id="otp-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123 456"
              required
              style={S.input}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              style={{ ...S.button, ...(loading ? S.buttonDisabled : {}) }}
            >
              {loading ? "A verificar..." : "Verificar"}
            </button>

            {/* Resend */}
            <div style={S.hint}>
              {cooldown > 0 ? (
                <span style={{ color: "#737373" }}>
                  Reenviar codigo em {cooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  style={{ ...S.resendBtn, color: "#f59e0b" }}
                >
                  Reenviar codigo
                </button>
              )}
            </div>

            {/* Use different email */}
            <div style={S.hint}>
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); setError(null); }}
                style={{ ...S.resendBtn, color: "#a3a3a3" }}
              >
                Usar outro email
              </button>
            </div>
          </form>
        )}

        {/* Back to landing */}
        <Link
          to="/"
          style={{
            ...S.link,
            display: "block",
            marginTop: 24,
            textAlign: "center",
            fontSize: 13,
          }}
        >
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
