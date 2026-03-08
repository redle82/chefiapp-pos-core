/**
 * Módulo Entregador — Home: KPIs (entregas completas, tempos médios, on-time, rating).
 * Referencial ChipDay.
 */
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/constants/designTokens";
import { useAppStaff } from "@/context/AppStaffContext";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Period = "This Week" | "This Month";

const MOCK_KPIS = {
  completedDeliveries: 0,
  avgPlacementToDelivery: null as number | null,
  avgPickupToDelivery: null as number | null,
  onTimeDeliveries: null as number | null,
  averageRating: null as number | null,
};

export default function DeliveryHomeScreen() {
  const { operationalContext } = useAppStaff();
  const [period, setPeriod] = useState<Period>("This Week");
  const [dateRange] = useState("02 Mar - 02 Mar");
  const kpis = MOCK_KPIS;

  const formatNumeric = (v: number | null) => (v == null ? "N/A" : String(v));

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterRow}>
          <Text style={styles.periodLabel}>{period}</Text>
          <Text style={styles.dateRange}>{dateRange}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.kpiValue}>{kpis.completedDeliveries}</Text>
          <Text style={styles.kpiLabel}>Completed Deliveries</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.kpiValue}>
              {formatNumeric(kpis.avgPlacementToDelivery)}
            </Text>
            <Text style={styles.kpiLabel}>Avg. placement to delivery time</Text>
          </View>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.kpiValue}>
              {formatNumeric(kpis.avgPickupToDelivery)}
            </Text>
            <Text style={styles.kpiLabel}>Avg. pickup to delivery time</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.kpiValue}>
              {formatNumeric(kpis.onTimeDeliveries)}
            </Text>
            <Text style={styles.kpiLabel}>On-time deliveries</Text>
          </View>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.kpiValue}>
              {formatNumeric(kpis.averageRating)}
            </Text>
            <Text style={styles.kpiLabel}>Average Rating</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  periodLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  dateRange: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  halfCard: {
    flex: 1,
    marginHorizontal: spacing[1],
    marginBottom: spacing[4],
  },
  row: {
    flexDirection: "row",
    marginHorizontal: -spacing[1],
  },
  kpiValue: {
    color: colors.textPrimary,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    marginBottom: spacing[1],
  },
  kpiLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
