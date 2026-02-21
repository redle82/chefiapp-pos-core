import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../core/auth/useAuth";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";

/**
 * RequireSession - Auth Gate (Nível 1)
 *
 * Garante APENAS que existe uma sessão válida.
 * NÃO verifica tenant, role ou onboarding status.
 *
 * Uso: /bootstrap, /login (inverse)
 */
export function RequireSession({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // 1. Loading State (Spinner)
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: "2px solid #32d74b",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. Auth Check
  const isTrial = getTabIsolated("chefiapp_trial_mode") === "true";
  if (!session && !isTrial) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
