/**
 * Módulo Entregador — Orders: lista com UNASSIGNED/STARTED, Assign, filtros.
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

type OrderStatus = "UNASSIGNED" | "STARTED";

interface DeliveryOrder {
  id: string;
  status: OrderStatus;
  orderNumber: string;
  customerName: string;
  address: string;
  distance: string;
  deadline: string;
  pickupName?: string;
  pickupAddress?: string;
}

const MOCK_ORDERS: DeliveryOrder[] = [
  {
    id: "1",
    status: "UNASSIGNED",
    orderNumber: "8A762",
    customerName: "Jaime L.",
    address: "Carrer de la Vénda des Poble, 9",
    distance: "21.4 km",
    deadline: "03:34 PM",
  },
  {
    id: "2",
    status: "UNASSIGNED",
    orderNumber: "13B97",
    customerName: "Rebeca K.",
    address: "Carrer de la Vénda des Poble, 9",
    distance: "26.0 km",
    deadline: "11:04 PM 24 February",
  },
  {
    id: "3",
    status: "UNASSIGNED",
    orderNumber: "4A8D1",
    customerName: "Louis M.",
    address: "Carrer de la Vénda des Poble, 9",
    distance: "39.3 km",
    deadline: "11:09 PM 22 February",
  },
  {
    id: "4",
    status: "STARTED",
    orderNumber: "DA1DD",
    customerName: "Gregor R.",
    address: "Carrer Camí de sa Torre, 71",
    distance: "39.4 km",
    deadline: "03:59 PM 24 July",
    pickupName: "Sofia Gastrobar",
    pickupAddress: "Carrer des Caló, 109, 07829 Sant Agu...",
  },
];

export default function DeliveryOrdersScreen() {
  const [selectMode, setSelectMode] = useState(false);
  const [orders] = useState<DeliveryOrder[]>(MOCK_ORDERS);

  const handleAssign = (order: DeliveryOrder) => {
    if (order.status === "UNASSIGNED") {
      // TODO: assign order to current driver
    }
  };

  const statusBg = (s: OrderStatus) =>
    s === "UNASSIGNED" ? "#ea580c" : colors.success;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={() => setSelectMode(!selectMode)}
          style={styles.toolbarBtn}
        >
          <Text
            style={[
              styles.toolbarBtnText,
              selectMode && styles.toolbarBtnTextActive,
            ]}
          >
            Select
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <FontAwesome name="search" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <FontAwesome name="sliders" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn}>
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.badge, { backgroundColor: statusBg(item.status) }]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
            <Text style={styles.orderId}># {item.orderNumber}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.address}>{item.address}</Text>
            {item.pickupName && (
              <>
                <Text style={styles.pickupLabel}>{item.pickupName}</Text>
                <Text style={styles.address}>{item.pickupAddress}</Text>
              </>
            )}
            <View style={styles.meta}>
              <Text style={styles.distance}>{item.distance}</Text>
              <Text style={styles.deadline}>{item.deadline}</Text>
            </View>
            <View style={styles.actions}>
              {item.status === "UNASSIGNED" && (
                <TouchableOpacity
                  style={styles.assignBtn}
                  onPress={() => handleAssign(item)}
                >
                  <FontAwesome name="truck" size={14} color="#fff" />
                  <Text style={styles.assignBtnText}>Assign</Text>
                </TouchableOpacity>
              )}
              {item.status === "STARTED" && (
                <TouchableOpacity style={styles.assignBtn}>
                  <Text style={styles.assignBtnText}>Repartos I.</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.moreBtn}>
                <FontAwesome name="ellipsis-v" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
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
  toolbarBtn: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  toolbarBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  toolbarBtnTextActive: {
    color: colors.accent,
    fontWeight: fontWeight.semibold,
  },
  iconBtn: {
    padding: spacing[2],
  },
  addBtn: {
    marginLeft: "auto",
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.sm,
    marginBottom: spacing[2],
  },
  badgeText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  orderId: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing[1],
  },
  customerName: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[1],
  },
  address: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing[1],
  },
  pickupLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing[2],
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing[2],
  },
  distance: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  deadline: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[3],
    gap: spacing[2],
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    backgroundColor: colors.accent,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
  },
  assignBtnText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  moreBtn: {
    padding: spacing[2],
  },
});
