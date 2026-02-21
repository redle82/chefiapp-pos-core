// @ts-nocheck
import React from "react";
import {
  useRestaurantRuntime,
  type ProductMode,
} from "../context/RestaurantRuntimeContext";

type ModeGateProps = {
  allow: ProductMode[];
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/** CORREÇÃO 3: modo derivado de systemState (UI não lê productMode). ACTIVE→live, TRIAL→pilot, resto→trial. */
function modeFromSystemState(systemState: string | undefined): ProductMode {
  if (systemState === "ACTIVE") return "live";
  if (systemState === "TRIAL") return "pilot";
  return "trial";
}

export function ModeGate({
  allow,
  moduleId,
  children,
  fallback,
}: ModeGateProps) {
  const { runtime } = useRestaurantRuntime();
  const mode: ProductMode = modeFromSystemState(runtime?.systemState);

  if (!allow.includes(mode)) {
    return (
      fallback ?? (
        <div
          style={{
            padding: 24,
            borderRadius: 8,
            background: "#f8fafc",
            border: "1px dashed #cbd5f5",
            textAlign: "center",
          }}
        >
          <strong>{moduleId.toUpperCase()}</strong> indisponível no modo{" "}
          <code>{mode}</code>.
        </div>
      )
    );
  }

  return <>{children}</>;
}
