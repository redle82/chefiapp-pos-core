/**
 * LoginPage — Ecrã de login principal (CORPORATE WORLD)
 *
 * Fluxo: Landing → /auth/login → Google (Keycloak OIDC) → /admin/home
 * Design: dark, premium, alinhado com a estética ChefIApp.
 * Single CTA: "Entrar com Google" via Keycloak.
 * Alternativas: email/phone (links secundários).
 */

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";
import { getAuthActions } from "../../core/auth/authAdapter";
import { useAuth } from "../../core/auth/useAuth";
import {
  BackendType,
  getBackendConfigured,
  getBackendType,
} from "../../core/infra/backendAdapter";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { OSCopy } from "../../ui/design-system/sovereign/OSCopy";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const hasBackend = getBackendConfigured();
  const isDocker = getBackendType() === BackendType.docker;

  // Redirect if already authenticated
  useEffect(() => {
    if (authLoading) return;
    if (session) {
      navigate("/admin/home", { replace: true });
    }
  }, [session, authLoading, navigate]);

  const handleGoogleLogin = () => {
    if (hasBackend && isDocker) {
      getAuthActions().signIn();
    }
  };

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
    <div className={styles.page}>
      {/* Ambient glow */}
      <div className={styles.glowTop} />
      <div className={styles.glowBottom} />

      <div className={styles.card}>
        {/* Logo + branding */}
        <div className={styles.header}>
          <img
            src="/logo-chefiapp-clean.png"
            alt="ChefIApp"
            className={styles.logo}
          />
          <h1 className={styles.title}>{OSCopy.auth.loginTitle}</h1>
          <p className={styles.subtitle}>{OSCopy.auth.loginSubtitle}</p>
        </div>

        {/* Main CTA — Google */}
        {hasBackend && isDocker ? (
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className={styles.googleBtn}
            >
              <GoogleIcon />
              <span>{OSCopy.auth.googleButton}</span>
            </button>

            <p className={styles.privacyNote}>{OSCopy.auth.privacyNote}</p>

            <div className={styles.divider}>
              <span>ou</span>
            </div>

            {/* Secondary options */}
            <div className={styles.secondaryLinks}>
              <Link to="/auth/email" className={styles.secondaryLink}>
                Entrar com email
              </Link>
              <span className={styles.dot}>·</span>
              <Link to="/auth/phone" className={styles.secondaryLink}>
                Entrar com telefone
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.noBackend}>
            <p>
              Backend não configurado. Define <code>VITE_CORE_URL</code> e{" "}
              <code>VITE_CORE_ANON_KEY</code>.
            </p>
          </div>
        )}

        {/* Back to landing */}
        <Link to="/" className={styles.backLink}>
          ← {OSCopy.trialGuide.backToLanding}
        </Link>

        {/* Signature */}
        <div className={styles.signature}>
          <MadeWithLoveFooter variant="inline" />
        </div>
      </div>
    </div>
  );
}

/* ── Google "G" icon (inline SVG, no deps) ── */
function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.04 24.04 0 000 21.56l7.98-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
