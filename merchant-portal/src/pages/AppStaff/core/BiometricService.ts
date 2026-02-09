const isNativePlatform = (): boolean => {
  const capacitor = (
    globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor;
  return typeof capacitor?.isNativePlatform === "function"
    ? capacitor.isNativePlatform()
    : false;
};

const BIOMETRIC_MODULE_ID = "@capgo/capacitor-native-biometric";

const loadNativeBiometric = async () => {
  if (!isNativePlatform()) {
    return null;
  }
  try {
    return await import(/* @vite-ignore */ BIOMETRIC_MODULE_ID);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[BiometricService] Native biometric unavailable:", error);
    }
    return null;
  }
};

/**
 * 🧬 BiometricService (Staff App)
 *
 * Wrapper around Capacitor Native Biometric for Staff Authentication.
 * Allows quick login for waiters/managers using FaceID/TouchID.
 */
export const BiometricService = {
  /**
   * Check if hardware supports biometrics (and is enrolled)
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const module = await loadNativeBiometric();
      if (!module) {
        return false;
      }
      const result = await module.NativeBiometric.isAvailable();
      // result also contains biometricType (face, finger, etc.)
      return result.isAvailable;
    } catch (error) {
      console.warn("[BiometricService] Not available:", error);
      return false;
    }
  },

  /**
   * Register current user for biometric login.
   * Stores the username securely in Keychain/Keystore.
   */
  async registerUser(username: string): Promise<boolean> {
    try {
      const module = await loadNativeBiometric();
      if (!module) {
        return false;
      }
      // Delete existing first to ensure clean state
      await module.NativeBiometric.deleteCredentials({
        server: "chefiapp.pos",
      }).catch(() => {});

      await module.NativeBiometric.setCredentials({
        username: username,
        password: "biometric-active", // Placeholder token
        server: "chefiapp.pos",
      });
      return true;
    } catch (error) {
      console.error("[BiometricService] Registration failed:", error);
      return false;
    }
  },

  /**
   * Verify identity and retrieve stored username.
   * Triggers the native FaceID/TouchID prompt.
   */
  async verifyUser(): Promise<string | null> {
    try {
      const module = await loadNativeBiometric();
      if (!module) {
        return null;
      }
      const result = await module.NativeBiometric.getCredentials({
        server: "chefiapp.pos",
      });
      return result.username;
    } catch {
      // User cancelled or failed
      console.warn("[BiometricService] Verification failed/cancelled");
      return null;
    }
  },

  /**
   * Clear credentials
   */
  async clearCredentials(): Promise<void> {
    try {
      const module = await loadNativeBiometric();
      if (!module) {
        return;
      }
      await module.NativeBiometric.deleteCredentials({
        server: "chefiapp.pos",
      });
    } catch {
      // Ignore error if not found
    }
  },
};
