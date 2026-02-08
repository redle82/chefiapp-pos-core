import { BottomActionBar } from "@/components/BottomActionBar";
import { FinancialVault } from "@/components/FinancialVault";
import { NowActionCard } from "@/components/NowActionCard";
import { PaymentMethod, QuickPayModal } from "@/components/QuickPayModal";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/constants/designTokens";
import { useAppStaff } from "@/context/AppStaffContext";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";
import { useNowEngine } from "@/hooks/useNowEngine";
import { HapticFeedback } from "@/services/haptics";
import { logError } from "@/services/logging";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function StaffScreen() {
  const router = useRouter();
  const {
    operationalContext,
    activeRole,
    roleConfig,
    shiftState,
    shiftStart,
    shiftId,
    startShift,
    endShift,
    canAccess,
  } = useAppStaff();

  const { orders, quickPay, splitOrder } = useOrder(); // ERRO-009 Fix
  const { nowAction, loading, completeAction, pendingCount } = useNowEngine(); // ERRO-008 Fix
  const { session } = useAuth(); // FASE 4: Para passar userId ao completeAction
  const [isVaultVisible, setIsVaultVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  // ERRO-004 Fix: Estado de processamento para prevenir duplo clique
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const handleCompleteAction = async (actionId: string) => {
    // ERRO-004 Fix: Prevenir duplo clique em qualquer ação
    if (isProcessingAction) return;
    setIsProcessingAction(true);

    try {
      // Para pagamentos, abrir QuickPayModal
      if (nowAction?.action === "collect_payment" && nowAction.orderId) {
        setIsPaymentModalVisible(true);
        // O pagamento será processado via QuickPayModal
        // O NowEngine será atualizado via realtime quando o status mudar
        setIsProcessingAction(false);
        return;
      }

      // ERRO-003 Fix: Para ação "acknowledge", mostrar feedback antes de processar
      if (nowAction?.action === "acknowledge") {
        HapticFeedback.success();
        // Feedback visual: mostrar mensagem de confirmação
        // O feedback será mostrado pelo NowEngine quando próxima ação aparecer
      }

      // Para outras ações, processar diretamente
      // FASE 4: Passar userId para gamificação
      // FASE 5: Haptic feedback em ação crítica
      HapticFeedback.medium();
      HapticFeedback.medium();
      // User ID fetched internally by service if needed
      await completeAction(actionId);

      // ERRO-003 Fix: Feedback visual após ação completa
      // A próxima ação aparecerá automaticamente via realtime
      // Se não houver próxima ação, mostrará "Tudo em ordem"
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, {
        action: "completeAction",
        actionId,
        actionType: nowAction?.type,
      });
      console.error("[StaffScreen] Error completing action:", error);
      Alert.alert("Erro", "Falha ao completar ação. Tente novamente.");
    } finally {
      // ERRO-004 Fix: Unlock após processamento
      setIsProcessingAction(false);
    }
  };

  const handlePaymentConfirm = async (method: PaymentMethod, tip: number) => {
    // ERRO-004 Fix: Lock imediato para prevenir duplo clique
    if (isProcessingPayment) return;
    if (!nowAction?.orderId) return;

    // ERRO-004 Fix: Lock antes de processar
    setIsProcessingPayment(true);

    try {
      const order = orders.find((o) => o.id === nowAction.orderId);
      if (!order) {
        setIsProcessingPayment(false); // Unlock se erro
        Alert.alert("Erro", "Pedido não encontrado");
        return;
      }

      // Processar pagamento via OrderContext
      const success = await quickPay(nowAction.orderId, method);

      if (success) {
        setIsPaymentModalVisible(false);
        // O NowEngine será atualizado via realtime quando o status mudar
        // Não precisamos chamar completeAction aqui, o realtime fará isso
      } else {
        Alert.alert("Erro", "Falha ao processar pagamento");
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, {
        action: "processPayment",
        orderId: nowAction?.orderId,
        method,
        tip,
      });
      console.error("[StaffScreen] Error processing payment:", error);
      Alert.alert("Erro", "Falha ao processar pagamento");
    } finally {
      // ERRO-004 Fix: Unlock após processamento
      setIsProcessingPayment(false);
    }
  };

  // --- Shift Closing Logic ---
  // Bug #6 Fix: Validar ações pendentes antes de encerrar turno
  const handleRequestCloseShift = async () => {
    // Validar ações pendentes
    if (
      nowAction &&
      (nowAction.type === "critical" || nowAction.type === "urgent")
    ) {
      Alert.alert(
        "Ações Pendentes",
        `Há uma ação ${
          nowAction.type === "critical" ? "crítica" : "urgente"
        } pendente. Resolva antes de encerrar o turno.`,
        [{ text: "OK" }],
      );
      return;
    }

    // Verificar pedidos pendentes (se necessário)
    // Nota: Validação completa requereria buscar do Supabase, mas por ora validamos ação atual

    Alert.alert(
      "Encerrar Turno",
      "Deseja realmente encerrar seu turno de trabalho?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Encerrar",
          style: "destructive",
          onPress: () => endShift(0, 0),
        },
      ],
    );
  };

  // =========================================================================
  // APPSTAFF 2.0 - TELA ÚNICA
  // =========================================================================

  // Se turno não iniciado, mostrar tela de início simplificada
  if (shiftState === "offline") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.shiftStartContainer}>
          <Text style={styles.businessName}>
            {operationalContext.businessName}
          </Text>
          <Text style={styles.roleLabel}>
            {roleConfig.emoji} {roleConfig.label}
          </Text>
        </View>

        <BottomActionBar
          primary={{
            label: "INICIAR TURNO",
            onPress: () => startShift(),
          }}
        />
      </SafeAreaView>
    );
  }

  // Tela única do AppStaff 2.0
  return (
    <SafeAreaView style={styles.container}>
      {/* NOW ACTION CARD - Tela única */}
      <NowActionCard
        action={nowAction}
        onComplete={handleCompleteAction}
        loading={loading}
        pendingCount={pendingCount} // ERRO-008 Fix
      />

      {/* CORE_APPSTAFF_CONTRACT §9: quando "Tudo em ordem", acesso rápido a mini KDS e mini TPV */}
      {!nowAction && !loading && (
        <View style={styles.quickAccess}>
          <Text style={styles.quickAccessTitle}>Acesso rápido</Text>
          <View style={styles.quickAccessRow}>
            <TouchableOpacity
              style={styles.quickAccessBtn}
              onPress={() => router.push("/(tabs)/orders")}
              activeOpacity={0.8}
            >
              <Ionicons name="list" size={24} color={colors.accent} />
              <Text style={styles.quickAccessLabel}>Pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAccessBtn}
              onPress={() => router.push("/(tabs)/kitchen")}
              activeOpacity={0.8}
            >
              <Ionicons name="flame" size={24} color={colors.accent} />
              <Text style={styles.quickAccessLabel}>Cozinha</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAccessBtn}
              onPress={() => router.push("/(tabs)/cardapio")}
              activeOpacity={0.8}
            >
              <Ionicons name="restaurant" size={24} color={colors.accent} />
              <Text style={styles.quickAccessLabel}>Cardápio</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* VAULT ACCESS - Apenas se necessário e permitido */}
      {canAccess("cash:handle") && nowAction?.action === "collect_payment" && (
        <TouchableOpacity
          onPress={() => setIsVaultVisible(true)}
          style={styles.vaultButton}
        >
          <Ionicons name="wallet" size={24} color={colors.warning} />
        </TouchableOpacity>
      )}

      {/* BOTTOM ACTION BAR - End Shift (apenas se não há ação crítica) */}
      {(!nowAction || nowAction.type !== "critical") && (
        <BottomActionBar
          primary={{
            label: "Encerrar Turno",
            onPress: handleRequestCloseShift,
            variant: "destructive",
            icon: "log-out-outline",
          }}
        />
      )}

      {/* FINANCIAL VAULT MODAL */}
      <Modal
        visible={isVaultVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVaultVisible(false)}
      >
        <View
          style={[styles.modalFull, { backgroundColor: colors.background }]}
        >
          <View
            style={[styles.modalHeader, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity onPress={() => setIsVaultVisible(false)}>
              <Text style={[styles.modalHeaderBtn, { color: colors.info }]}>
                Concluído
              </Text>
            </TouchableOpacity>
          </View>
          <FinancialVault />
        </View>
      </Modal>

      {/* QUICK PAY MODAL */}
      {nowAction?.action === "collect_payment" &&
        nowAction.orderId &&
        (() => {
          const order = orders.find((o) => o.id === nowAction.orderId);
          return (
            <QuickPayModal
              visible={isPaymentModalVisible}
              total={order?.total || 0}
              orderId={nowAction.orderId}
              order={order || undefined} // Bug #4 Fix: Passar order para validação
              onClose={() => setIsPaymentModalVisible(false)}
              onConfirm={handlePaymentConfirm}
              onSplitBill={async (itemIds: string[]) => {
                // ERRO-009 Fix: Dividir conta
                if (nowAction.orderId) {
                  const newOrderId = await splitOrder(
                    nowAction.orderId,
                    itemIds,
                  );
                  if (newOrderId) {
                    Alert.alert("Sucesso", "Conta dividida com sucesso!");
                  }
                }
              }}
            />
          );
        })()}
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  shiftStartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[8],
  },
  businessName: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    color: colors.accent,
    marginBottom: spacing[2],
  },
  roleLabel: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing[12],
  },
  startButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[12],
    borderRadius: radius.lg,
    marginBottom: spacing[4],
  },
  startButtonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  quickAccess: {
    marginHorizontal: spacing[6],
    marginTop: spacing[6],
    padding: spacing[5],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderActive,
  },
  quickAccessTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing[4],
  },
  quickAccessRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickAccessBtn: {
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    minWidth: 90,
  },
  quickAccessLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.accent,
    marginTop: spacing[2],
  },
  vaultButton: {
    position: "absolute",
    top: spacing[4],
    right: spacing[4],
    padding: spacing[2],
    backgroundColor: colors.surfaceOverlay,
    borderRadius: radius.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: "center",
    padding: spacing[6],
  },
  modalFull: { flex: 1 },
  modalHeader: { padding: spacing[4], alignItems: "flex-end" },
  modalHeaderBtn: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[6],
    alignItems: "center",
  },
  modalTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[6],
  },
  warningBox: {
    backgroundColor: colors.surfaceOverlay,
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    marginBottom: spacing[5],
    width: "100%",
  },
  warningTitle: {
    color: colors.error,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
    marginBottom: spacing[1],
    textAlign: "center",
  },
  warningText: {
    color: colors.error,
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: spacing[8],
  },
  statItem: { alignItems: "center", flex: 1 },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing[1],
    textTransform: "uppercase",
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 10 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.base },
  modalActions: {
    flexDirection: "row",
    gap: spacing[3],
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: spacing[4],
    borderRadius: radius.lg,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: colors.surface },
  confirmButton: { backgroundColor: colors.error },
  cancelButtonText: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  confirmButtonText: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
});
