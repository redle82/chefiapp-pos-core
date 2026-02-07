import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../core/auth/useAuth";
import {
  getTabIsolated,
  setTabIsolated,
} from "../core/storage/TabIsolatedStorage";

/**
 * RequireAuth - Guarda de rotas protegidas
 *
 * Usa Supabase Auth como única fonte de verdade.
 *
 * Princípio: "Supabase Auth é a única fonte de verdade de identidade"
 */
export function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();

  // Demo mode check (legacy support)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("demo") === "true") {
      setTabIsolated("chefiapp_demo_mode", "true");
    }
  }, []);

  if (loading) {
    console.log("🛡️ [AUTH] Guard Active: Verifying identity session...");
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 16,
          background: "#0b0b0c",
          color: "#32d74b",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "2px solid rgba(50, 215, 75, 0.2)",
            borderTopColor: "#32d74b",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <span style={{ fontSize: "12px", letterSpacing: "1px", opacity: 0.8 }}>
          SOVEREIGN IDENTITY CHECK
        </span>
        <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
      </div>
    );
  }

  const isDemo = getTabIsolated("chefiapp_demo_mode") === "true";

  if (!session && !isDemo) {
    console.warn(
      "🛡️ [AUTH] Access Denied: No session found. Redirecting to /login",
    );
    return <Navigate to="/login" replace />;
  }

  console.log("🛡️ [AUTH] Access Granted: Session active.");
  return children;
}
