import { colors } from "@/constants/designTokens";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AppStaffConfigDesktopOnlyScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configuração avançada</Text>
      <Text style={styles.subtitle}>
        Este módulo permanece separado do fluxo móvel e deve ser operado no
        ambiente desktop oficial para garantir segurança e governança.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Disponível no desktop</Text>
        <Text style={styles.infoText}>- Gestão de equipa e permissões</Text>
        <Text style={styles.infoText}>
          - Horários e parâmetros operacionais
        </Text>
        <Text style={styles.infoText}>
          - Configurações sensíveis de pagamento
        </Text>
      </View>

      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/manager/operation")}
        >
          <Text style={styles.primaryBtnText}>Voltar à operação</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/(tabs)/manager")}
        >
          <Text style={styles.secondaryBtnText}>Abrir dashboard manager</Text>
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
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 14,
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
