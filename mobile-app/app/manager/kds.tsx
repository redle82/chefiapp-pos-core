import { colors } from "@/constants/designTokens";
import { useAppStaff } from "@/context/AppStaffContext";
import { useOrder } from "@/context/OrderContext";
import { buildKdsMobileSummaryModel } from "@/features/manager/kdsMobileSummaryModel";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ManagerKdsScreen() {
  const router = useRouter();
  const { orders } = useOrder();
  const { shiftId } = useAppStaff();

  const summary = useMemo(
    () =>
      buildKdsMobileSummaryModel({
        orders: orders.map((order) => ({
          id: order.id,
          status: order.status,
          total: order.total,
          shiftId: order.shiftId,
        })),
        shiftId,
      }),
    [orders, shiftId],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>KDS</Text>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Fila ativa</Text>
          <Text style={styles.metricValue}>{summary.activeQueue}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pendente</Text>
          <Text style={styles.metricValue}>{summary.pending}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Preparando</Text>
          <Text style={styles.metricValue}>{summary.preparing}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Prontos</Text>
          <Text style={styles.metricValue}>{summary.ready}</Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.metricLabel}>Taxa de conclusão</Text>
        <Text style={styles.metricValue}>{summary.completionRate}%</Text>
      </View>

      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/(tabs)/kitchen")}
        >
          <Text style={styles.primaryBtnText}>Abrir cozinha</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/manager/tasks")}
        >
          <Text style={styles.secondaryBtnText}>Abrir tarefas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricCard: {
    width: "48.5%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  actionsColumn: {
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
});
