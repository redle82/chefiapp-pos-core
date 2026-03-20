import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyPhoneOtp } from "../../core/auth/supabaseAuth";
import { signInWithPhoneOtp } from "../../core/auth/supabaseAuth";
import styles from "./AuthPhone.module.css";

export function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();

  const phone =
    typeof window !== "undefined"
      ? window.localStorage.getItem("chefiapp_owner_phone") ?? ""
      : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = code.trim().replace(/\s/g, "");
    if (!cleaned || cleaned.length < 6) {
      setError("Introduz o código de 6 dígitos.");
      return;
    }

    if (!phone) {
      setError("Número de telefone não encontrado. Volta ao login.");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyPhoneOtp(phone, cleaned);
      if ("error" in result) {
        setError(result.error.message);
        return;
      }
      // Success — session is now active via Supabase auth state change
      navigate("/welcome", { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao verificar código.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone || resending) return;
    setResending(true);
    setError(null);
    try {
      const result = await signInWithPhoneOtp(phone);
      if ("error" in result) {
        setError(result.error.message);
      } else {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch {
      setError("Erro ao reenviar código.");
    } finally {
      setResending(false);
    }
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
            Introduz o código de 6 dígitos enviado para{" "}
            <strong>{phone || "o teu telefone"}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          <label className={styles.label}>Código SMS</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123 456"
            required
            className={styles.input}
            autoFocus
          />
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "A verificar..." : "Entrar"}
          </button>
        </form>

        <div className={styles.centerHint}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              background: "none",
              border: "none",
              color: resent ? "#22c55e" : "#f59e0b",
              cursor: resending ? "not-allowed" : "pointer",
              fontSize: "14px",
              padding: "8px 0",
            }}
          >
            {resent
              ? "✓ Código reenviado!"
              : resending
                ? "A reenviar..."
                : "Reenviar código"}
          </button>
        </div>

        <div className={styles.centerHint}>
          <Link to="/auth/phone" className={styles.link}>
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
