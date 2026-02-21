/**
 * LocationSelectView — Seleção de local antes de operação.
 * Ref: STAFF_SESSION_LOCATION_CONTRACT — Staff não opera sem Location; se >1 ativo, mostrar esta vista.
 */
// @ts-nocheck


import React from "react";
import type { Location } from "../../../features/admin/locations/types";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { radius } from "../../../ui/design-system/tokens/radius";
import { useStaff } from "../context/StaffContext";

export const LocationSelectView: React.FC = () => {
  const { activeLocations, setActiveLocation } = useStaff();

  const handleSelect = (loc: Location) => {
    setActiveLocation(loc);
  };

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
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Text size="2xl" weight="bold" color="primary">
            Selecionar local
          </Text>
          <Text size="sm" color="tertiary" style={{ marginTop: 8 }}>
            Em qual local está a operar agora?
          </Text>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {activeLocations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => handleSelect(loc)}
              style={{
                width: "100%",
                padding: 16,
                textAlign: "left",
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radius.md,
                backgroundColor: colors.surface.layer1,
                color: colors.text.primary,
                cursor: "pointer",
              }}
            >
              <Text size="base" weight="semibold" color="primary">
                {loc.name}
              </Text>
              {(loc.address || loc.city) && (
                <Text
                  size="sm"
                  color="tertiary"
                  style={{ marginTop: 4, display: "block" }}
                >
                  {loc.address || loc.city}
                </Text>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
