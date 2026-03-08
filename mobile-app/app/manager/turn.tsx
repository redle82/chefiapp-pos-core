import { colors } from "@/constants/designTokens";
import { useAppStaff } from "@/context/AppStaffContext";
import { useOrder } from "@/context/OrderContext";
import { buildTurnSummaryModel } from "@/features/manager/turnSummaryModel";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ManagerTurnScreen() {
  const router = useRouter();
  const { orders } = useOrder();
  const { shiftState, shiftStart, shiftId, startShift, endShift } =
    useAppStaff();

  const summary = useMemo(
    () =>
      buildTurnSummaryModel({
        shiftState,
        shiftStart,
        now: Date.now(),
      }),
    [shiftState, shiftStart],
  );

  const shiftRevenue = useMemo(
    () =>
      orders
        .filter((order) => !shiftId || order.shiftId === shiftId)
        .reduce((sum, order) => sum + order.total, 0),
    [orders, shiftId],
  );

  const handlePrimaryAction = () => {
    if (shiftState === "active") {
      Alert.alert("Encerrar turno", "Deseja encerrar o turno atual?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Encerrar",
          style: "destructive",
          onPress: async () => {
            await endShift(shiftRevenue, shiftRevenue);
          },
        },
      ]);
      return;
    }

    Alert.alert("Iniciar turno", "Deseja iniciar um novo turno?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Iniciar",
        onPress: async () => {
          await startShift();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Turno</Text>
      <Text style={styles.subtitle}>Estado atual do turno operacional</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Status</Text>
        <Text style={styles.cardValue}>{summary.shiftStatusLabel}</Text>
        <Text style={styles.cardLabel}>ID do turno</Text>
        <Text style={styles.cardValueSmall}>{shiftId ?? "-"}</Text>
        <Text style={styles.cardLabel}>Duração</Text>
        <Text style={styles.cardValueSmall}>{summary.durationMinutes} min</Text>
        <Text style={styles.cardLabel}>Receita acumulada</Text>
        <Text style={styles.cardValueSmall}>€{shiftRevenue.toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handlePrimaryAction}>
        <Text style={styles.primaryBtnText}>{summary.primaryActionLabel}</Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/(tabs)/staff")}
        >
          <Text style={styles.secondaryBtnText}>Abrir staff</Text>
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
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  cardValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardValueSmall: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
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
});
