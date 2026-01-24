import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface PushToken {
    token: string;
    platform: 'ios' | 'android';
}

export const PushNotifications = {
    /**
     * Request permission and get push token
     */
    async registerForPushNotifications(): Promise<PushToken | null> {
        if (!Device.isDevice) {
            console.log('[Push] Must use physical device for push notifications');
            return null;
        }

        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Push] Permission denied');
            return null;
        }

        // Get Expo push token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

        // Android-specific channel
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
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
     * Schedule local notification
     */
    async scheduleLocalNotification(
        title: string,
        body: string,
        data?: Record<string, any>,
        seconds = 1
    ): Promise<string> {
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
     * Cancel all scheduled notifications
     */
    async cancelAll(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    },
};

export default PushNotifications;
