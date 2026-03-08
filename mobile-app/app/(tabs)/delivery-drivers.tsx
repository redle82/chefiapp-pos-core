/**
 * Módulo Entregador — Drivers: lista de motoristas com estado (online/offline).
 * Referencial ChipDay.
 */
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/constants/designTokens";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface Driver {
  id: string;
  initials: string;
  name: string;
  online: boolean;
}

const MOCK_DRIVERS: Driver[] = [
  { id: "1", initials: "DA", name: "Diogo Andrade", online: true },
  { id: "2", initials: "SG", name: "Sofia GastroBar", online: false },
];

export default function DeliveryDriversScreen() {
  const [drivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [search, setSearch] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={16} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <FontAwesome name="sliders" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn}>
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>
              {item.online && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{item.name}</Text>
              <View style={styles.driverRole}>
                <FontAwesome name="car" size={12} color={colors.textMuted} />
                <Text style={styles.driverRoleText}>Driver</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.moreBtn}>
              <FontAwesome name="ellipsis-v" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  iconBtn: {
    padding: spacing[2],
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  onlineDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  driverInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  driverName: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  driverRole: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    marginTop: spacing[1],
  },
  driverRoleText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  moreBtn: {
    padding: spacing[2],
  },
});
