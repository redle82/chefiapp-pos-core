import { colors } from "@/constants/designTokens";
import { useAppStaff } from "@/context/AppStaffContext";
import { supabase } from "@/services/supabase";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TeamMember = {
  user_id: string;
  active_role: string;
};

export default function ManagerTeamScreen() {
  const router = useRouter();
  const { operationalContext } = useAppStaff();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("gm_shifts")
        .select("user_id, active_role")
        .eq("status", "open")
        .eq("restaurant_id", operationalContext.businessId);

      setMembers((data as TeamMember[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [operationalContext.businessId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Equipe em turno</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryBtnText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={fetchTeam}>
          <Text style={styles.primaryBtnText}>
            {loading ? "A atualizar..." : "Atualizar"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>
            A carregar equipa em turno…
          </Text>
        </View>
      ) : members.length === 0 ? (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>
            Sem equipa ativa neste momento.
          </Text>
        </View>
      ) : (
        members.map((member) => (
          <View key={member.user_id} style={styles.memberCard}>
            <Text style={styles.memberName}>{member.user_id}</Text>
            <Text style={styles.memberRole}>{member.active_role}</Text>
          </View>
        ))
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
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  memberName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  memberRole: {
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: "uppercase",
  },
});
