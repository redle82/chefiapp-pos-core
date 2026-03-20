import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AuthPhone.module.css";

/**
 * OAuth callback handler.
 * Supabase Auth redirects here after Google OAuth.
 * The Supabase client (with detectSessionInUrl: true) automatically
 * picks up the tokens from the URL hash/query params.
 * We just wait for the session to be established, then redirect.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Give Supabase a moment to process the URL tokens
    const timer = setTimeout(() => {
      // If we're still here after 5s, something went wrong
      setError("Timeout ao processar autenticação. Tenta novamente.");
    }, 5000);

    // The AuthProvider's onAuthStateChange will detect the new session
    // and redirect to the appropriate page. We just show a loading state.
    const checkSession = setInterval(async () => {
      try {
        const { getSupabaseSession } = await import("../../core/auth/supabaseAuth");
        const session = await getSupabaseSession();
        if (session) {
          clearTimeout(timer);
          clearInterval(checkSession);
          navigate("/welcome", { replace: true });
        }
      } catch {
        // keep waiting
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(checkSession);
    };
  }, [navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img
            src="/logo-chefiapp-clean.png"
            alt="ChefIApp"
            className={styles.logo}
          />
          <h1 className={styles.title}>
            {error ? "Erro" : "A processar..."}
          </h1>
          <p className={styles.subtitle}>
            {error ?? "A completar o login com Google. Um momento..."}
          </p>
        </div>
        {error && (
          <button
            onClick={() => navigate("/auth/phone")}
            className={styles.button}
          >
            Voltar ao login
          </button>
        )}
      </div>
    </div>
  );
}
