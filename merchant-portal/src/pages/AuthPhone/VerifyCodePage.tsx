import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "./AuthPhone.module.css";

/** E2E only: session key used by Keycloak auth (must match authKeycloak.ts). */
const SESSION_KEY = "chefiapp_keycloak_session";
const TOKEN_EXPIRY_KEY = "chefiapp_keycloak_expiry";

export function VerifyCodePage() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // E2E only: mock OTP for Playwright (signup → bootstrap flow). Requires ?e2e_mock_otp=1 in URL.
    if (
      searchParams.get("e2e_mock_otp") === "1" &&
      code.trim().replace(/\s/g, "") === "123456"
    ) {
      const state = {
        session: { access_token: "e2e-mock-token" },
        user: { id: "e2e-mock-user", email: "e2e@example.com" },
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 3600_000));
      window.location.href = "/welcome";
      return;
    }
    // A verificação real do código é feita pelo provedor de autenticação (ex.: Keycloak).
    // Esta tela existe apenas como representação UX do fluxo \"/auth/verify\".
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img
            src="/logo-chefiapp-clean.png"
            alt="ChefIApp"
            className={styles.logo}
          />
          <h1 className={styles.title}>Confirmar código</h1>
          <p className={styles.subtitle}>
            Introduz o código que recebeste por SMS.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className={styles.label}>Código SMS</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123 456"
            required
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Entrar
          </button>
        </form>

        <div className={styles.centerHint}>
          <Link to="/auth/phone" className={styles.link}>
            Voltar ao login por telefone
          </Link>
        </div>
      </div>
    </div>
  );
}
