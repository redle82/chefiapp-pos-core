/**
 * Barra de aviso quando o dispositivo está offline ou o Core não está acessível.
 * Mostra: "Modo offline — as alterações serão sincronizadas quando a ligação voltar."
 * Usa navigator.onLine e, quando disponível, useCoreHealth (Core DOWN/UNKNOWN = mostrar barra).
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCoreHealth } from "../core/health/useCoreHealth";
import { colors } from "./design-system/tokens/colors";

export function OfflineIndicator() {
  const { t } = useTranslation("common");
  const [isNetworkOffline, setIsNetworkOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine,
  );
  const { status: coreStatus } = useCoreHealth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setIsNetworkOffline(false);
    const onOffline = () => setIsNetworkOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const coreUnreachable = coreStatus === "DOWN";
  const showBar = isNetworkOffline || coreUnreachable;

  if (!showBar) return null;

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
      <span>{t("offlineMessage")}</span>
    </div>
  );
}
