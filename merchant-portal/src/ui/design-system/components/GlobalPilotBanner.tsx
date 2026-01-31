/**
 * GlobalPilotBanner — Indicador modo piloto unificado
 *
 * "Podes explorar sem risco." Indicador visível mas não alarmante.
 * Alinhado a docs/product/GLOBAL_UI_STATE_MAP.md e DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.
 */

import React from "react";

export interface GlobalPilotBannerProps {
  /** Texto (default: mensagem canónica) */
  message?: string;
  style?: React.CSSProperties;
}

const DEFAULT_MESSAGE = "Modo piloto — pedidos de teste (marcados no sistema)";

export const GlobalPilotBanner: React.FC<GlobalPilotBannerProps> = ({
  message = DEFAULT_MESSAGE,
  style,
}) => {
  return (
    <div
      style={{
        padding: "12px 16px",
        backgroundColor: "#fef3c7",
        color: "#f59e0b",
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 500,
        ...style,
      }}
    >
      {message}
    </div>
  );
};
