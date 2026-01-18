import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

/**
 * 📷 ScannerService (Staff App)
 * 
 * Wrapper around Capacitor ML Kit Barcode Scanner.
 * Allows waiters to scan Table QRs or Product Barcodes.
 */
export const ScannerService = {
    /**
     * Check if camera permission is granted.
     */
    async checkPermission(): Promise<boolean> {
        try {
            const status = await BarcodeScanner.checkPermissions();
            return status.camera === 'granted';
        } catch {
            return false;
        }
    },

    /**
     * Request camera permission.
     */
    async requestPermission(): Promise<boolean> {
        try {
            const status = await BarcodeScanner.requestPermissions();
            return status.camera === 'granted';
        } catch {
            return false;
        }
    },

    /**
     * Start a single scan session.
     * Returns the raw value of the barcode/QR.
     */
    async scan(): Promise<string | null> {
        try {
            const allowed = await this.checkPermission();
            if (!allowed) {
                const granted = await this.requestPermission();
                if (!granted) {
                    alert('Camera permission denied.');
                    return null;
                }
            }

            // Start scanning
            const { barcodes } = await BarcodeScanner.scan({
                formats: [], // All formats by default
            });

            if (barcodes.length > 0) {
                return barcodes[0].rawValue;
            }
            return null;
        } catch (error) {
            console.error('[ScannerService] Scan failed:', error);
            return null;
        }
    },

    /**
     * Install Google Barcode Scanner Module (Android only, usually auto-handled)
     */
    async installGoogleModule(): Promise<void> {
        try {
            await BarcodeScanner.installGoogleBarcodeScannerModule();
        } catch (error) {
            // Ignore, might be iOS or already installed
        }
    }
};
