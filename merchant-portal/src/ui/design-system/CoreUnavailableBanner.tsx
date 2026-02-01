import React from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { cn } from "./tokens";
import "./CoreStatusBanner.css";

/**
 * Banner fixo quando o backend é Docker e o Core está em baixo.
 * Mostra instrução para dev: npm run docker:core:up
 */
export function CoreUnavailableBanner() {
  const { runtime, refresh } = useRestaurantRuntime();

  if (runtime.loading || runtime.coreReachable) {
    return null;
  }

  return (
    <div
      className={cn("core-status-banner", "core-status-banner--error")}
      role="status"
      aria-live="polite"
    >
      <div className="core-status-banner__content">
        <span className="core-status-banner__icon" aria-hidden="true">
          ⚠
        </span>
        <span className="core-status-banner__message">
          Core indisponível — na raiz do repo: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4 }}>npm run docker:core:up</code>
        </span>
      </div>
      <button
        className="core-status-banner__retry"
        onClick={() => refresh()}
        aria-label="Tentar novamente"
      >
        Tentar novamente
      </button>
    </div>
  );
}
