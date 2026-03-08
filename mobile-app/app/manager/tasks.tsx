import { colors } from "@/constants/designTokens";
import { useAppStaff } from "@/context/AppStaffContext";
import { buildTasksSummaryModel } from "@/features/manager/tasksSummaryModel";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ManagerTasksScreen() {
  const router = useRouter();
  const { tasks, updateTaskStatus } = useAppStaff();

  const summary = useMemo(
    () =>
      buildTasksSummaryModel({
        tasks: tasks.map((task) => ({
          id: task.id,
          status: (() => {
            const taskStatus = String(task.status);
            return taskStatus === "completed"
              ? "completed"
              : taskStatus === "done"
              ? "done"
              : taskStatus === "in_progress"
              ? "in_progress"
              : "pending";
          })(),
          priority: task.priority,
        })),
      }),
    [tasks],
  );

  const openTasks = tasks.filter((task) => {
    const taskStatus = String(task.status);
    return taskStatus !== "done" && taskStatus !== "completed";
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tarefas</Text>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Abertas</Text>
          <Text style={styles.metricValue}>{summary.open}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pendentes</Text>
          <Text style={styles.metricValue}>{summary.pending}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Em progresso</Text>
          <Text style={styles.metricValue}>{summary.inProgress}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Urgentes</Text>
          <Text style={styles.metricValue}>{summary.urgentOpen}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/manager/team")}
        >
          <Text style={styles.secondaryBtnText}>Ver equipa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/manager/alerts")}
        >
          <Text style={styles.secondaryBtnText}>Ver alertas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        {openTasks.length === 0 ? (
          <View style={styles.itemCard}>
            <Text style={styles.itemTitle}>Sem tarefas abertas</Text>
            <Text style={styles.itemMeta}>Operação em dia.</Text>
          </View>
        ) : (
          openTasks.slice(0, 8).map((task) => (
            <View key={task.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{task.title}</Text>
              <Text style={styles.itemMeta}>
                Prioridade: {task.priority} · Estado: {task.status}
              </Text>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.itemBtn}
                  onPress={() => updateTaskStatus(task.id, "in_progress")}
                >
                  <Text style={styles.itemBtnText}>Em progresso</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.itemBtn}
                  onPress={() => updateTaskStatus(task.id, "completed")}
                >
                  <Text style={styles.itemBtnText}>Concluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  metricLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
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
  listSection: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  itemMeta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  itemBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  itemBtnText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
});
