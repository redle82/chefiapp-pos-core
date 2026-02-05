import { Link, useLocation } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";

/**
 * Banner quando o Core (3001) está em baixo e o modo é offline-erro (falha real).
 * Não mostra em offline-intencional (exploração/onboarding).
 * Fonte de verdade: runtime.coreMode (SETUP vs erro real).
 * OPERATIONAL_SURFACES_CONTRACT: TPV/KDS não mostram estado de sistema — escondido em /op/tpv e /op/kds.
 */
export function CoreUnavailableBanner() {
  const { runtime, refresh } = useRestaurantRuntime();
  const location = useLocation();
  const isOperationalSurface =
    location.pathname.startsWith("/op/tpv") ||
    location.pathname.startsWith("/op/kds");
  if (isOperationalSurface) return null;

  if (runtime.coreMode !== "offline-erro") {
    return null;
  }

  return (
    <div
      style={{
        background: "#262626",
        color: "#a3a3a3",
        padding: "6px 12px",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        borderBottom: "1px solid #404040",
      }}
      role="status"
    >
      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      <span>Servidor operacional offline. Inicie o Docker Core.</span>
      <button
        onClick={() => refresh()}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          textDecoration: "underline",
          opacity: 0.7,
        }}
      >
        Tentar novamente
      </button>
      <Link
        to="/help/start-local"
        style={{
          marginLeft: "8px",
          color: "#71717a",
          textDecoration: "none",
          fontSize: "11px",
        }}
      >
        Ver instruções
      </Link>
    </div>
  );
}
