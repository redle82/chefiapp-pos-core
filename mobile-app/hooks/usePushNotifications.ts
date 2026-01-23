import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { PushNotifications, PushToken } from '@/lib/pushNotifications';
import { useAuth } from '@/context/AuthContext';

export function usePushNotifications() {
    const { session } = useAuth();
    const user = session?.user;
    const [pushToken, setPushToken] = useState<PushToken | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);

    const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
    const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

    useEffect(() => {
        // Register for push notifications
        PushNotifications.registerForPushNotifications().then(token => {
            if (token) {
                setPushToken(token);

                // Save token to backend if user is logged in
                if (user?.id) {
                    PushNotifications.savePushToken(user.id, token.token);
                }
            }
        });

        // Listen for incoming notifications (foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener(notif => {
            console.log('[Push] Received:', notif);
            setNotification(notif);
        });

        // Listen for notification responses (tapped)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('[Push] Tapped:', response);
            // Handle navigation based on notification data
            const data = response.notification.request.content.data;
            if (data?.type === 'ORDER_READY') {
                console.log('[Push] Navigate to order:', data.orderId);
            }
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [user?.id]);

    /**
     * Send a local notification for testing
     */
    const sendTestNotification = async () => {
        await PushNotifications.scheduleLocalNotification(
            '🍳 Pedido Pronto!',
            'Mesa 5 - Francesinha está pronta para servir',
            { type: 'ORDER_READY', orderId: 'test-123' }
        );
    };

    return {
        pushToken,
        notification,
        sendTestNotification,
    };
}
