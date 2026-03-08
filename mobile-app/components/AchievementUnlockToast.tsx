/**
 * AchievementUnlockToast — animated banner shown when a staff member
 * earns a new achievement.
 *
 * Renders at the top of the screen, auto-dismisses after 3 s, and
 * sequences multiple unlocks (one at a time via a FIFO queue).
 *
 * Usage: mount once inside the root layout — it manages itself.
 *   <AchievementUnlockToast />
 */

import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Achievement } from "../services/GamificationService";
import { onAchievementUnlocked } from "../utils/achievementEvents";

const DISPLAY_DURATION_MS = 3000;
const ANIMATION_DURATION_MS = 300;

export function AchievementUnlockToast() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<Achievement | null>(null);
  const queueRef = useRef<Achievement[]>([]);
  const isShowingRef = useRef(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const hideToast = useCallback(
    (onDone?: () => void) => {
      clearDismissTimer();
      Animated.timing(translateY, {
        toValue: -100,
        duration: ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }).start(() => {
        setCurrent(null);
        isShowingRef.current = false;
        onDone?.();
      });
    },
    [translateY],
  );

  const showNext = useCallback(() => {
    if (isShowingRef.current || queueRef.current.length === 0) return;

    const next = queueRef.current.shift()!;
    isShowingRef.current = true;
    setCurrent(next);
    translateY.setValue(-100);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
    }).start(() => {
      dismissTimerRef.current = setTimeout(() => {
        hideToast(() => {
          // Show next queued achievement (if any)
          setTimeout(showNext, 200);
        });
      }, DISPLAY_DURATION_MS);
    });
  }, [hideToast, translateY]);

  // Subscribe to achievement events
  useEffect(() => {
    const unsub = onAchievementUnlocked((achievement) => {
      queueRef.current.push(achievement);
      showNext();
    });
    return unsub;
  }, [showNext]);

  // Clean up timer on unmount
  useEffect(() => {
    return clearDismissTimer;
  }, []);

  if (!current) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY }] },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`Achievement desbloqueado: ${current.name}`}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{current.icon}</Text>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Achievement Desbloqueado!</Text>
          <Text style={styles.name}>{current.name}</Text>
          <Text style={styles.description}>{current.description}</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>+{current.points}</Text>
          <Text style={styles.pointsUnit}>pts</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.dismissArea}
        onPress={() => hideToast(() => setTimeout(showNext, 200))}
        accessibilityRole="button"
        accessibilityLabel="Fechar notificação"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    borderRadius: 14,
    backgroundColor: "#1A1A2E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    fontSize: 32,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 1,
  },
  description: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  pointsBadge: {
    alignItems: "center",
    backgroundColor: "#FFD70022",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FFD700",
    marginLeft: 4,
  },
  pointsText: {
    color: "#FFD700",
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 18,
  },
  pointsUnit: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "600",
  },
  dismissArea: {
    paddingLeft: 10,
  },
  dismissText: {
    color: "#666",
    fontSize: 14,
  },
});
