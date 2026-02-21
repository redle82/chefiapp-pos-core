/**
 * P5-10: Mobile Native Service
 * 
 * Serviço para recursos nativos do mobile app
 */

import { Logger } from '../logger';

export interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    badge?: number;
}

class MobileNativeService {
    private registration: ServiceWorkerRegistration | null = null;
    private pushSubscription: PushSubscription | null = null;

    /**
     * Initialize service worker for push notifications
     */
    async initializeServiceWorker(): Promise<boolean> {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return false;
        }

        try {
            this.registration = await navigator.serviceWorker.ready;
            return true;
        } catch (err) {
            Logger.error('Failed to initialize service worker', err);
            return false;
        }
    }

    /**
     * Request push notification permission
     */
    async requestPushPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPush(): Promise<PushSubscription | null> {
        if (!this.registration) {
            await this.initializeServiceWorker();
        }

        if (!this.registration) {
            return null;
        }

        try {
            this.pushSubscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY'), // Replace with actual key
            });

            return this.pushSubscription;
        } catch (err) {
            Logger.error('Failed to subscribe to push', err);
            return null;
        }
    }

    /**
     * Send push notification
     */
    async sendNotification(payload: PushNotificationPayload): Promise<void> {
        if (!('Notification' in window)) {
            return;
        }

        if (Notification.permission === 'granted') {
            const notification = new Notification(payload.title, {
                body: payload.body,
                badge: payload.badge?.toString(),
                data: payload.data,
                icon: '/icon-192x192.png',
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }

    /**
     * Check if camera is available
     */
    async checkCameraAvailable(): Promise<boolean> {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return false;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Scan QR code using camera
     */
    async scanQRCode(): Promise<string | null> {
        // This would integrate with a QR code scanning library
        // For now, return placeholder
        return null;
    }

    /**
     * Check if Bluetooth is available
     */
    async checkBluetoothAvailable(): Promise<boolean> {
        return 'bluetooth' in navigator;
    }

    /**
     * Connect to Bluetooth printer
     */
    async connectBluetoothPrinter(): Promise<boolean> {
        if (!this.checkBluetoothAvailable()) {
            return false;
        }

        // This would integrate with Web Bluetooth API
        // For now, return placeholder
        return false;
    }

    /**
     * Helper: Convert VAPID key
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

export const mobileNativeService = new MobileNativeService();
