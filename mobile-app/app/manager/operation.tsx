import { TestBadge } from "@/components/TestBadge";
import { colors } from "@/constants/designTokens";
import { useAppStaff } from "@/context/AppStaffContext";
import { useOrder } from "@/context/OrderContext";
import { buildOperationSummaryModel } from "@/features/manager/operationSummaryModel";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ManagerOperationScreen() {
  const router = useRouter();
  const { orders } = useOrder();
  const { tasks, shiftId, shiftState, operationalContext } = useAppStaff();

  const summary = useMemo(
    () =>
      buildOperationSummaryModel({
        orders: orders.map((order) => ({
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          shiftId: order.shiftId,
        })),
        tasks: tasks.map((task) => ({
          id: task.id,
          status:
            task.status === ("completed" as typeof task.status)
              ? "completed"
              : task.status,
          priority: task.priority,
        })),
        shiftId,
      }),
    [orders, tasks, shiftId],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Operação</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={styles.subtitle}>
          {operationalContext.businessName} ·{" "}
          {shiftState === "active" ? "turno ativo" : "sem turno ativo"}
        </Text>
        <TestBadge />
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Fila ativa</Text>
          <Text style={styles.metricValue}>{summary.queue}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Prontos</Text>
          <Text style={styles.metricValue}>{summary.ready}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pagos</Text>
          <Text style={styles.metricValue}>{summary.paid}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Tarefas pendentes</Text>
          <Text style={styles.metricValue}>{summary.pendingTasks}</Text>
        </View>
        <View style={styles.metricCardWide}>
          <Text style={styles.metricLabel}>Tarefas urgentes</Text>
          <Text style={styles.metricValue}>{summary.urgentTasks}</Text>
        </View>
        <View style={styles.metricCardWide}>
          <Text style={styles.metricLabel}>Receita do turno</Text>
          <Text style={styles.metricValue}>
            €{(summary.revenue / 100).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/manager/pv")}
        >
          <Text style={styles.primaryBtnText}>Abrir PV mobile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/manager/kds-mobile")}
        >
          <Text style={styles.secondaryBtnText}>Abrir KDS mobile</Text>
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
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
  metricCardWide: {
    width: "100%",
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
