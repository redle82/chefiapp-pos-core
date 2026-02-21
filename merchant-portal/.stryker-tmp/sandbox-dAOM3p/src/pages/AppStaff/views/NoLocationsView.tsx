/**
 * NoLocationsView — Nenhuma ubicación ativa (edge case).
 * Ref: STAFF_SESSION_LOCATION_CONTRACT — 0 locais ativos: não entra em operação; mensagem clara.
 */
// @ts-nocheck


import React from "react";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";

export const NoLocationsView: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        backgroundColor: colors.surface.base,
        color: colors.text.primary,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <Text size="2xl" weight="bold" color="primary">
          Nenhuma ubicación ativa
        </Text>
        <Text
          size="sm"
          color="tertiary"
          style={{ marginTop: 16, display: "block" }}
        >
          Configure pelo menos um local em Configuração → Ubicaciones e active-o
          para poder operar.
        </Text>
      </div>
    </div>
  );
};
