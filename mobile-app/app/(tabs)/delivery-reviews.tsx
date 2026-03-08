/**
 * Módulo Entregador — Reviews: Order / Driver, filtros, empty state.
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

type ReviewTab = "Order" | "Driver";
type ContentTab = "Reviews" | "AI Insights";

export default function DeliveryReviewsScreen() {
  const [reviewType, setReviewType] = useState<ReviewTab>("Order");
  const [contentTab, setContentTab] = useState<ContentTab>("Reviews");

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.reviewTab, reviewType === "Order" && styles.reviewTabActive]}
          onPress={() => setReviewType("Order")}
        >
          <Text
            style={[
              styles.reviewTabText,
              reviewType === "Order" && styles.reviewTabTextActive,
            ]}
          >
            Order
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reviewTab, reviewType === "Driver" && styles.reviewTabActive]}
          onPress={() => setReviewType("Driver")}
        >
          <Text
            style={[
              styles.reviewTabText,
              reviewType === "Driver" && styles.reviewTabTextActive,
            ]}
          >
            Driver
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.countLabel}>0 reviews</Text>
      <View style={styles.starsRow}>
        {[5, 4, 3, 2, 1].map((n) => (
          <View key={n} style={styles.starLine}>
            <Text style={styles.starNum}>{n}</Text>
            <View style={styles.starBar} />
          </View>
        ))}
      </View>

      <View style={styles.contentTabs}>
        <TouchableOpacity
          onPress={() => setContentTab("Reviews")}
          style={styles.contentTabWrap}
        >
          <Text
            style={[
              styles.contentTabText,
              contentTab === "Reviews" && styles.contentTabTextActive,
            ]}
          >
            Reviews
          </Text>
          {contentTab === "Reviews" && <View style={styles.contentTabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setContentTab("AI Insights")}
          style={styles.contentTabWrap}
        >
          <Text
            style={[
              styles.contentTabText,
              contentTab === "AI Insights" && styles.contentTabTextActive,
            ]}
          >
            AI Insights
          </Text>
          {contentTab === "AI Insights" && <View style={styles.contentTabUnderline} />}
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.filterBtn}>
          <FontAwesome name="sliders" size={16} color={colors.textPrimary} />
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <FontAwesome name="sort" size={16} color={colors.textPrimary} />
          <Text style={styles.filterBtnText}>Sort</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.empty}>
        <FontAwesome name="star-o" size={40} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No reviews yet</Text>
        <Text style={styles.emptySubtitle}>
          Order and driver reviews will appear here as your customers share their experiences.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  tabs: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  reviewTab: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  reviewTabActive: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
  },
  reviewTabText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
  reviewTabTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  countLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing[2],
  },
  starsRow: {
    marginBottom: spacing[4],
  },
  starLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[1],
  },
  starNum: {
    width: 20,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  starBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginLeft: spacing[2],
  },
  contentTabs: {
    flexDirection: "row",
    marginBottom: spacing[3],
  },
  contentTabWrap: {
    marginRight: spacing[4],
  },
  contentTabText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
  },
  contentTabTextActive: {
    color: colors.accent,
    fontWeight: fontWeight.semibold,
  },
  contentTabUnderline: {
    height: 2,
    backgroundColor: colors.accent,
    marginTop: spacing[1],
    borderRadius: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing[2],
    lineHeight: 20,
  },
});
