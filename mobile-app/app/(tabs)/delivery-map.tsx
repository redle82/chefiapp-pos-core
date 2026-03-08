/**
 * Módulo Entregador — Map: mapa com pins/clusters de entregas e condutores.
 * Referencial ChipDay. Placeholder até integrar react-native-maps.
 */
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/constants/designTokens";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function DeliveryMapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <FontAwesome name="map" size={48} color={colors.textMuted} />
        <Text style={styles.placeholderTitle}>Mapa</Text>
        <Text style={styles.placeholderSubtitle}>
          Pins de entregas e condutores em tempo real. Integrar react-native-maps quando necessário.
        </Text>
      </View>
      <View style={styles.overlayButtons}>
        <View style={styles.fab}>
          <FontAwesome name="sliders" size={20} color={colors.textPrimary} />
        </View>
        <View style={styles.fab}>
          <FontAwesome name="cog" size={20} color={colors.textPrimary} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    margin: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginTop: spacing[3],
  },
  placeholderSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing[2],
    paddingHorizontal: spacing[6],
  },
  overlayButtons: {
    position: "absolute",
    top: spacing[6],
    right: spacing[4],
    gap: spacing[2],
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
