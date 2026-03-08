import { colors } from "@/constants/designTokens";
import { useAppStaff } from "@/context/AppStaffContext";
import { useAuth } from "@/context/AuthContext";
import { buildAppStaffProfileModel } from "@/features/manager/appStaffProfileModel";
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

export default function AppStaffProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { userName, roleConfig, operationalContext, shiftState, shiftStart } =
    useAppStaff();

  const profile = useMemo(
    () =>
      buildAppStaffProfileModel({
        userName,
        userId: session?.user?.id ?? "-",
        email: session?.user?.email,
        roleLabel: roleConfig.label,
        businessName: operationalContext.businessName,
        shiftState,
        shiftStart,
      }),
    [
      userName,
      session?.user?.id,
      session?.user?.email,
      roleConfig.label,
      operationalContext.businessName,
      shiftState,
      shiftStart,
    ],
  );

  const handleSignOut = () => {
    Alert.alert("Sair", "Pretende terminar sessão neste dispositivo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Perfil AppStaff</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{profile.displayName}</Text>
        <Text style={styles.row}>Email: {profile.email}</Text>
        <Text style={styles.row}>ID: {profile.userId}</Text>
        <Text style={styles.row}>Função: {profile.roleLabel}</Text>
        <Text style={styles.row}>Unidade: {profile.businessName}</Text>
        <Text style={styles.row}>Turno: {profile.shiftStatusLabel}</Text>
        <Text style={styles.row}>Início: {profile.shiftStartedAtLabel}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/(tabs)/staff")}
        >
          <Text style={styles.secondaryBtnText}>Voltar ao turno</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/(tabs)/manager")}
        >
          <Text style={styles.secondaryBtnText}>Abrir gestão</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dangerBtn} onPress={handleSignOut}>
        <Text style={styles.dangerBtnText}>Terminar sessão</Text>
      </TouchableOpacity>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  row: {
    color: colors.textSecondary,
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
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  dangerBtn: {
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerBtnText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
});
