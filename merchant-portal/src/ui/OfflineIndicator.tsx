/**
 * Barra de aviso quando o dispositivo está offline ou o Core não está acessível.
 * Mostra: "Modo offline — as alterações serão sincronizadas quando a ligação voltar."
 * Fonte única: ConnectivityService (offline + degraded = Core inacessível).
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { useConnectivity } from "../core/sync/useConnectivity";
import { colors } from "./design-system/tokens/colors";

export function OfflineIndicator() {
  const { t } = useTranslation("common");
  const connectivity = useConnectivity();
  const showBar = connectivity !== "online";

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
