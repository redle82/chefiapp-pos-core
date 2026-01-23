import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const HapticFeedback = {
    light: async () => {
        if (isWeb) return; // Web typically doesn't support subtle ticks well
        try {
            await Haptics.selectionAsync();
        } catch (e) {
            // Ignore (device might not support)
        }
    },
    medium: async () => {
        if (isWeb) {
            if (navigator?.vibrate) navigator.vibrate(10);
            return;
        }
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) { }
    },
    heavy: async () => {
        if (isWeb) {
            if (navigator?.vibrate) navigator.vibrate(20);
            return;
        }
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (e) { }
    },
    success: async () => {
        if (isWeb) {
            if (navigator?.vibrate) navigator.vibrate([10, 30, 10]);
            return;
        }
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) { }
    },
    error: async () => {
        if (isWeb) {
            if (navigator?.vibrate) navigator.vibrate([50, 100, 50]);
            return;
        }
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) { }
    }
};
