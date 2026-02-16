import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

// SDK 53+: expo-notifications (remote push) was removed from Expo Go. Only load in dev/build.
function isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
}

async function getNotifications(): Promise<typeof import('expo-notifications') | null> {
    if (isExpoGo()) return null;
    return await import('expo-notifications');
}

export interface PushToken {
    token: string;
    platform: 'ios' | 'android';
}

export const PushNotifications = {
    /**
     * Request permission and get push token. No-op in Expo Go (SDK 53+).
     */
    async registerForPushNotifications(): Promise<PushToken | null> {
        const Notifications = await getNotifications();
        if (!Notifications) {
            if (__DEV__) console.log('[Push] Skipped in Expo Go (use a development build for push)');
            return null;
        }

        if (!Device.isDevice) {
            console.log('[Push] Must use physical device for push notifications');
            return null;
        }

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Push] Permission denied');
            return null;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'ChefIApp',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#32d74b',
            });
        }

        console.log('[Push] Token:', token);
        return {
            token,
            platform: Platform.OS as 'ios' | 'android',
        };
    },

    /**
     * Save push token to user profile
     */
    async savePushToken(userId: string, token: string): Promise<void> {
        try {
            await supabase
                .from('gm_push_tokens')
                .upsert({
                    user_id: userId,
                    token,
                    platform: Platform.OS,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,token' });

            console.log('[Push] Token saved');
        } catch (error) {
            console.error('[Push] Failed to save token:', error);
        }
    },

    /**
     * Schedule local notification. No-op in Expo Go (SDK 53+).
     */
    async scheduleLocalNotification(
        title: string,
        body: string,
        data?: Record<string, any>,
        seconds = 1
    ): Promise<string> {
        const Notifications = await getNotifications();
        if (!Notifications) return '';
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
        });
        return id;
    },

    /**
     * Cancel all scheduled notifications. No-op in Expo Go (SDK 53+).
     */
    async cancelAll(): Promise<void> {
        const Notifications = await getNotifications();
        if (!Notifications) return;
        await Notifications.cancelAllScheduledNotificationsAsync();
    },
};

export default PushNotifications;
