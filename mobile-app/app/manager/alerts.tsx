import { colors } from "@/constants/designTokens";
import { useNotices } from "@/hooks/useNotices";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ManagerAlertsScreen() {
  const router = useRouter();
  const { notices } = useNotices();

  const criticalNotices = useMemo(
    () =>
      notices.filter(
        (notice) =>
          notice.severity === "critical" || notice.severity === "attention",
      ),
    [notices],
  );

  const hasAlerts = criticalNotices.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.title}>Exceções</Text>
        <Text style={styles.subtitle}>
          Há algo que precisa de ação imediata?
        </Text>
      </View>

      {hasAlerts ? (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>
            {criticalNotices.length} alerta
            {criticalNotices.length !== 1 ? "s" : ""} ativo
            {criticalNotices.length !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.alertBody}>
            Resolver no fluxo operacional (TPV, KDS, Tarefas).
          </Text>
        </View>
      ) : null}

      <View style={styles.blockCard}>
        <Text style={styles.blockTitle}>Falhas</Text>
        <Text style={styles.blockBody}>Nenhuma falha ativa.</Text>
      </View>

      <View style={styles.blockCard}>
        <Text style={styles.blockTitle}>Dispositivos offline</Text>
        <Text style={styles.blockBody}>Todos os dispositivos ligados.</Text>
      </View>

      <View style={styles.blockCard}>
        <Text style={styles.blockTitle}>Bloqueios</Text>
        <Text style={styles.blockBody}>Nenhum bloqueio ativo.</Text>
      </View>

      {!hasAlerts && (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateIcon}>✅</Text>
          <Text style={styles.emptyStateTitle}>Tudo em ordem</Text>
          <Text style={styles.emptyStateBody}>
            Sem exceções ativas. Volte à operação.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}
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
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: 16,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  alertBody: {
    fontSize: 14,
    color: colors.textMuted,
  },
  blockCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  blockBody: {
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyStateCard: {
    backgroundColor: colors.surfaceOverlay,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  emptyStateBody: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtnText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: "600",
  },
});
