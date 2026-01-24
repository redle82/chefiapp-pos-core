import { CapacitorNfc } from '@capgo/capacitor-nfc';

/**
 * 📡 NFCService (Staff App)
 * 
 * Wrapper for Native NFC interactions.
 * Used for "Proof of Presence" (Cleaning tasks, Security rounds).
 */
export const NFCService = {
    /**
     * Check if NFC is available on this device.
     */
    async isAvailable(): Promise<boolean> {
        try {
            // Note: Capgo NFC doesn't have a direct 'isAvailable' on all platforms in the same way,
            // but we can try a soft check or assume true if enabled.
            // A common pattern is checking status.
            const status = await CapacitorNfc.isEnabled();
            return status.enabled;
        } catch (error) {
            console.warn('[NFCService] Availability check failed:', error);
            return false;
        }
    },

    /**
     * Start a session to read a single tag.
     * Returns the tag ID (UID) as a string.
     */
    async scanTag(): Promise<string | null> {
        return new Promise(async (resolve) => {
            try {
                // Remove any existing listeners first
                await CapacitorNfc.removeAllListeners();

                // Start listening
                await CapacitorNfc.startScan();

                // Set up the listener
                const listener = await CapacitorNfc.addListener('nfcTag', (data) => {
                    // Stop scanning after first tag
                    this.stopScan();

                    // Capgo returns data.tag which might have an id array
                    const tagId = data.tag?.id || [];
                    // Convert byte array to hex string
                    const hexId = tagId.map((i: number) => i.toString(16).padStart(2, '0')).join('').toUpperCase();

                    resolve(hexId);
                });

                // Timeout after 15 seconds if no tag found
                setTimeout(() => {
                    this.stopScan();
                    resolve(null);
                }, 15000);

            } catch (error) {
                console.error('[NFCService] Scan failed:', error);
                this.stopScan();
                resolve(null);
            }
        });
    },

    /**
     * Stop any active scan manually.
     */
    async stopScan(): Promise<void> {
        try {
            await CapacitorNfc.stopScan();
            await CapacitorNfc.removeAllListeners();
        } catch (e) {
            // ignore
        }
    }
};
