/**
 * NowActionCard - UI única do AppStaff 2.0
 *
 * Mostra APENAS UMA COISA POR VEZ
 */

import { UrgencyColors } from "@/constants/urgencyColors";
import { useAppStaff } from "@/context/AppStaffContext";
import { NowAction } from "@/services/NowEngine";
import { HapticFeedback } from "@/services/haptics";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NowActionCardProps {
  action: NowAction | null;
  onComplete: (actionId: string) => void;
  loading?: boolean;
  pendingCount?: number; // ERRO-008 Fix: Contador de ações pendentes
}

const ACTION_ICONS: Record<string, string> = {
  collect_payment: "💰",
  deliver: "🍽️",
  check: "👀",
  resolve: "⚠️",
  acknowledge: "📋",
  check_kitchen: "⏱️",
  prioritize_drinks: "🔥",
  routine_clean: "🧹",
  resolve_error: "⚠️",
  silent: "✅",
};

const ACTION_LABELS: Record<string, string> = {
  collect_payment: "COBRAR",
  deliver: "ENTREGAR",
  check: "VERIFICAR",
  resolve: "RESOLVER",
  acknowledge: "VER PEDIDO", // ERRO-003 Fix: Linguagem humana clara
  check_kitchen: "VERIFICAR",
  prioritize_drinks: "PRIORIZAR",
  routine_clean: "FAZER",
  resolve_error: "RESOLVER",
};

// ERRO-008 Fix: Usar paleta de cores operacional consistente
const PRIORITY_COLORS = {
  critical: {
    icon: UrgencyColors.critical.icon,
    title: "#ffffff",
    message: UrgencyColors.critical.text,
    button: UrgencyColors.critical.primary,
    background: UrgencyColors.critical.background,
  },
  urgent: {
    icon: UrgencyColors.warning.icon,
    title: "#ffffff",
    message: UrgencyColors.warning.text,
    button: UrgencyColors.warning.primary,
    background: UrgencyColors.warning.background,
  },
  attention: {
    icon: UrgencyColors.info.icon,
    title: "#ffffff",
    message: UrgencyColors.info.text,
    button: UrgencyColors.info.primary,
    background: UrgencyColors.info.background,
  },
  silent: {
    icon: "#888888",
    title: "#888888",
    message: null,
    button: null,
    background: "#1a1a1a",
  },
};

export function NowActionCard({
  action,
  onComplete,
  loading = false,
  pendingCount,
}: NowActionCardProps) {
  const { roleConfig, shiftStart } = useAppStaff();

  const formatDuration = (startTime: number | null) => {
    if (!startTime) return "0m";
    const diffMs = Date.now() - startTime;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const handleAction = () => {
    if (!action || action.type === "silent") return;

    HapticFeedback.success();
    onComplete(action.id);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#888888" />
          <Text style={styles.loadingText}>Processando...</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {roleConfig.emoji} {roleConfig.label} • {formatDuration(shiftStart)}
          </Text>
        </View>
      </View>
    );
  }

  // Silent state
  if (!action || action.type === "silent") {
    const colors = PRIORITY_COLORS.silent;
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.icon, { color: colors.icon }]}>✅</Text>
          <Text style={[styles.title, { color: colors.title }]}>
            Tudo em ordem
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {roleConfig.emoji} {roleConfig.label} • {formatDuration(shiftStart)}
          </Text>
        </View>
      </View>
    );
  }

  // Action state
  const colors = PRIORITY_COLORS[action.type];
  const icon = ACTION_ICONS[action.action || "silent"] || "⚠️";
  const label = ACTION_LABELS[action.action || ""] || "FAZER";

  // FASE 3: Destacar ação principal com animação visual sutil
  const isCritical = action.type === "critical";
  const isUrgent = action.type === "urgent";

  // ERRO-002 Fix: Badge de origem do pedido
  const getOriginBadge = () => {
    const origin = action.orderOrigin || "GARÇOM";
    switch (origin) {
      case "WEB_PUBLIC":
      case "web":
        return { text: "🌐 WEB", color: "#0a84ff", bgColor: "#0a84ff20" };
      case "CAIXA":
      case "TPV":
        return { text: "💳 CAIXA", color: "#ffd60a", bgColor: "#ffd60a20" };
      case "GARÇOM":
      default:
        return { text: "👤 GARÇOM", color: "#32d74b", bgColor: "#32d74b20" };
    }
  };
  const originBadge = action.orderOrigin ? getOriginBadge() : null;
  const tableDisplay = action.tableNumber || action.tableId || "?";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        // FASE 3: Destaque visual para ações críticas/urgentes
        isCritical && styles.criticalGlow,
        isUrgent && styles.urgentGlow,
      ]}
    >
      <View style={styles.content}>
        {/* ERRO-002 Fix: Badge de origem e Mesa */}
        <View style={styles.topRow}>
          {originBadge && (
            <View
              style={[
                styles.originBadge,
                {
                  backgroundColor: originBadge.bgColor,
                  borderColor: originBadge.color,
                },
              ]}
            >
              <Text
                style={[styles.originBadgeText, { color: originBadge.color }]}
              >
                {originBadge.text}
              </Text>
            </View>
          )}
          <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>MESA {tableDisplay}</Text>
          </View>
        </View>

        {/* FASE 3: Ícone maior e mais destacado para ações críticas */}
        <Text
          style={[
            styles.icon,
            { color: colors.icon },
            isCritical && styles.iconCritical,
            isUrgent && styles.iconUrgent,
          ]}
        >
          {icon}
        </Text>
        <Text
          style={[
            styles.title,
            { color: colors.title },
            isCritical && styles.titleCritical,
            isUrgent && styles.titleUrgent,
          ]}
          numberOfLines={2}
        >
          {action.title}
        </Text>
        {action.message && (
          <Text
            style={[styles.message, { color: colors.message }]}
            numberOfLines={2}
          >
            {action.message}
          </Text>
        )}
        {/* REASON REMOVIDO: Funcionário não precisa de explicação, precisa de ação */}
        {/* Cores e ícones já indicam prioridade e tipo de ação */}
        {/* FASE 3: Botão mais destacado para ações críticas/urgentes */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.button },
            isCritical && styles.buttonCritical,
            isUrgent && styles.buttonUrgent,
          ]}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.buttonText, isCritical && styles.buttonTextCritical]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {roleConfig.emoji} {roleConfig.label} • {formatDuration(shiftStart)}
        </Text>
        {/* ERRO-008 Fix: Contador discreto de ações pendentes */}
        {pendingCount !== undefined && pendingCount > 0 && (
          <Text
            style={[
              styles.pendingCountText,
              action?.type === "critical" && styles.pendingCountTextCritical,
              pendingCount > 5 && styles.pendingCountTextUrgent,
            ]}
          >
            {pendingCount === 1
              ? "1 ação pendente"
              : `${pendingCount} ações pendentes`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 32,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    maxWidth: "100%",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    maxWidth: "100%",
  },
  // ERRO-003 Fix: Estilo para dica de ação
  actionHint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
    fontStyle: "italic",
  },
  // ERRO-009 Fix: Estilo para explicação do "porquê"
  reasonText: {
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 18,
    fontStyle: "italic",
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: "#666666",
  },
  loadingText: {
    fontSize: 16,
    color: "#888888",
    marginTop: 16,
  },
  // ERRO-008 Fix: Estilos para contador de ações pendentes
  pendingCountText: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  pendingCountTextCritical: {
    color: "#ff4444", // Vermelho se há ação crítica
  },
  pendingCountTextUrgent: {
    color: "#ff8800", // Laranja se há muitas ações (> 5)
  },
  // ERRO-002 Fix: Estilos para badge de origem e mesa
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    position: "absolute",
    top: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  originBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  tableBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#eee",
  },
  tableBadgeText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
  },
  originBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  // FASE 3: Estilos para destacar ações críticas/urgentes
  criticalGlow: {
    borderWidth: 2,
    borderColor: "#ff3b30",
    shadowColor: "#ff3b30",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  urgentGlow: {
    borderWidth: 1,
    borderColor: "#ffd60a",
    shadowColor: "#ffd60a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  iconCritical: {
    fontSize: 80,
    transform: [{ scale: 1.1 }],
  },
  iconUrgent: {
    fontSize: 72,
    transform: [{ scale: 1.05 }],
  },
  titleCritical: {
    fontSize: 28,
    fontWeight: "900",
  },
  titleUrgent: {
    fontSize: 26,
    fontWeight: "800",
  },
  buttonCritical: {
    height: 64,
    shadowColor: "#ff3b30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonUrgent: {
    height: 60,
    shadowColor: "#ffd60a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonTextCritical: {
    fontSize: 20,
    letterSpacing: 2,
  },
});
