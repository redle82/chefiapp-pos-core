/**
 * Barra de aviso quando o dispositivo está offline.
 * Mostra: "Modo offline — as alterações serão sincronizadas quando a ligação voltar."
 */

import React, { useEffect, useState } from "react";
import { colors } from "./design-system/tokens/colors";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "6px 12px",
        backgroundColor: colors.surface.layer2,
        borderBottom: `1px solid ${colors.border.subtle}`,
        color: colors.text.secondary,
        fontSize: 12,
      }}
    >
      <span aria-hidden>📡</span>
      <span>
        Modo offline — as alterações serão sincronizadas quando a ligação
        voltar.
      </span>
    </div>
  );
}
