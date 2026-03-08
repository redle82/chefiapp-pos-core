import { colors } from "@/constants/designTokens";
import { useAppStaff } from "@/context/AppStaffContext";
import { useOrder } from "@/context/OrderContext";
import {
  OwnerSectorKind,
  buildOwnerSectorSummaryModel,
} from "@/features/manager/ownerSectorSummaryModel";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type SectorScreenProps = {
  sector: OwnerSectorKind;
  primaryHref: string;
  primaryLabel: string;
};

export function SectorScreen({
  sector,
  primaryHref,
  primaryLabel,
}: SectorScreenProps) {
  const router = useRouter();
  const { orders } = useOrder();
  const { tasks, shiftId } = useAppStaff();

  const summary = useMemo(
    () =>
      buildOwnerSectorSummaryModel({
        sector,
        shiftId,
        tasks: tasks.map((task) => ({
          id: task.id,
          status:
            String(task.status) === "completed"
              ? "completed"
              : String(task.status) === "done"
              ? "done"
              : String(task.status) === "in_progress"
              ? "in_progress"
              : "pending",
          priority: task.priority,
        })),
        orders: orders.map((order) => ({
          id: order.id,
          status: order.status,
          total: order.total,
          shiftId: order.shiftId,
        })),
      }),
    [sector, shiftId, tasks, orders],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{summary.title}</Text>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Tarefas abertas</Text>
          <Text style={styles.metricValue}>{summary.openTasks}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Urgentes</Text>
          <Text style={styles.metricValue}>{summary.urgentOpenTasks}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Fila</Text>
          <Text style={styles.metricValue}>{summary.orderQueue}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Prontos</Text>
          <Text style={styles.metricValue}>{summary.readyOrders}</Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.metricLabel}>Receita do turno</Text>
        <Text style={styles.metricValue}>€{summary.revenue.toFixed(2)}</Text>
      </View>

      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push(primaryHref as never)}
        >
          <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/manager/operation")}
        >
          <Text style={styles.secondaryBtnText}>Abrir operação</Text>
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
