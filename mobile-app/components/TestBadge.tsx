import React from "react";
import { Text, View } from "react-native";

import { useAppStaff } from "@/context/AppStaffContext";

/**
 * Inline TEST / Sandbox badge — mirrors web merchant-portal behaviour.
 * Renders nothing when the restaurant is not in a test-like environment.
 */
export function TestBadge() {
  const { operationalContext } = useAppStaff();
  if (!operationalContext.environmentLabel) return null;

  return (
    <View
      style={{
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: "rgba(245, 158, 11, 0.15)",
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: "#F59E0B",
          letterSpacing: 0.5,
        }}
      >
        {operationalContext.environmentLabel}
      </Text>
    </View>
  );
}
