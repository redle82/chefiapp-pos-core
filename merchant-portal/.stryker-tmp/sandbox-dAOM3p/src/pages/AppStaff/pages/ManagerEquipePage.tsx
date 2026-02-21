/**
 * Equipe (/manager/equipe).
 * Uma tela = pessoas em operação: quem está em turno, papéis, alertas.
 */
// @ts-nocheck


import React from "react";
import { useStaff } from "../context/StaffContext";
import { LiveRosterWidget } from "../components/LiveRosterWidget";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";

export function ManagerEquipePage() {
  const { coreRestaurantId } = useStaff();

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        width: "100%",
        paddingBottom: 80,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 0, color: colors.text.primary }}>
        Equipe em turno
      </h1>

      {coreRestaurantId ? (
        <LiveRosterWidget restaurantId={coreRestaurantId} />
      ) : (
        <div
          style={{
            padding: 24,
            backgroundColor: colors.surface.layer1,
            borderRadius: 12,
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          <Text size="sm" color="tertiary">
            Selecione uma localização para ver a equipa em turno.
          </Text>
        </div>
      )}
    </div>
  );
}
