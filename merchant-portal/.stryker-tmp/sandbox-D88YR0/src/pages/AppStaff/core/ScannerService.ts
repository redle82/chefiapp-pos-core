const isNativePlatform = (): boolean => {
  const capacitor = (
    globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor;
  return typeof capacitor?.isNativePlatform === "function"
    ? capacitor.isNativePlatform()
    : false;
};

const BARCODE_SCANNER_MODULE_ID = "@capacitor-mlkit/barcode-scanning";

const loadBarcodeScanner = async () => {
  if (!isNativePlatform()) {
    return null;
  }
  try {
    return await import(/* @vite-ignore */ BARCODE_SCANNER_MODULE_ID);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[ScannerService] Barcode scanner unavailable:", error);
    }
    return null;
  }
};

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
      const module = await loadBarcodeScanner();
      if (!module) {
        return false;
      }
      const status = await module.BarcodeScanner.checkPermissions();
      return status.camera === "granted";
    } catch {
      return false;
    }
  },

  /**
   * Request camera permission.
   */
  async requestPermission(): Promise<boolean> {
    try {
      const module = await loadBarcodeScanner();
      if (!module) {
        return false;
      }
      const status = await module.BarcodeScanner.requestPermissions();
      return status.camera === "granted";
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
      const module = await loadBarcodeScanner();
      if (!module) {
        return null;
      }
      const allowed = await this.checkPermission();
      if (!allowed) {
        const granted = await this.requestPermission();
        if (!granted) {
          alert("Camera permission denied.");
          return null;
        }
      }

      // Start scanning
      const { barcodes } = await module.BarcodeScanner.scan({
        formats: [], // All formats by default
      });

      if (barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
      return null;
    } catch (error) {
      // Capacitor scanner not available on web — expected, silently return null
      if (
        import.meta.env.DEV &&
        !(error instanceof Error && error.message?.includes("not implemented"))
      ) {
        console.error("[ScannerService] Scan failed:", error);
      }
      return null;
    }
  },

  /**
   * Install Google Barcode Scanner Module (Android only, usually auto-handled)
   */
  async installGoogleModule(): Promise<void> {
    try {
      const module = await loadBarcodeScanner();
      if (!module) {
        return;
      }
      await module.BarcodeScanner.installGoogleBarcodeScannerModule();
    } catch {
      // Ignore, might be iOS or already installed
    }
  },
};
