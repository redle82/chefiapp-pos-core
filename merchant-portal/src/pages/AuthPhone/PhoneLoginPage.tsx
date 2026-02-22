import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getAuthActions } from "../../core/auth/authAdapter";
import {
  BackendType,
  getBackendConfigured,
  getBackendType,
} from "../../core/infra/backendAdapter";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./AuthPhone.module.css";

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
    <div className={styles.page} data-testid="auth-phone-form">
      <div className={styles.card}>
        <div className={styles.header}>
          <img
            src="/logo-chefiapp-clean.png"
            alt="ChefIApp"
            className={styles.logo}
          />
          <h1 className={styles.title}>Entrar com telefone</h1>
          <p className={styles.subtitle}>
            Introduz o teu número. Enviamos um código por SMS.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          <label className={styles.label}>Telefone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+351 912 345 678"
            required
            className={styles.input}
            data-testid="auth-phone-input"
          />
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "A enviar..." : "Receber código"}
          </button>
        </form>

        <div className={styles.centerHint}>
          <Link to="/auth/email" className={styles.link}>
            Prefiro entrar com email
          </Link>
        </div>

        <Link to="/" className={styles.backLink}>
          ← Voltar à landing
        </Link>
      </div>
    </div>
  );
}
