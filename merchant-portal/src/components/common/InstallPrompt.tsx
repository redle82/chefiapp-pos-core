/**
 * InstallPrompt — Catches `beforeinstallprompt` and shows a subtle install banner.
 *
 * Behavior:
 * - Catches the browser's `beforeinstallprompt` event
 * - Shows "Install ChefIApp for faster access" banner
 * - "Install" and "Later" buttons
 * - Remembers dismissal for 7 days (localStorage)
 * - Only shows on mobile/tablet or when not already installed (standalone)
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isStandaloneMode } from '../../core/pwa/standaloneMode';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'chefiapp_install_dismissed_at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Non-fatal: storage may be full
  }
}

/**
 * Detects if the device is mobile or tablet based on screen width and touch support.
 */
function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTouch =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 1024;
  return hasTouch || isSmallScreen;
}

export function InstallPrompt() {
  const { t } = useTranslation('pwa');
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed, recently dismissed, or not mobile
    if (isStandaloneMode()) return;
    if (wasDismissedRecently()) return;
    if (!isMobileOrTablet()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    markDismissed();
    setVisible(false);
    setDeferredPrompt(null);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="banner"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '10px 16px',
        backgroundColor: '#1c1917',
        borderTop: '1px solid #292524',
        color: '#fafaf9',
        fontSize: 13,
        fontFamily: 'system-ui, sans-serif',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <span style={{ flex: 1 }}>
        {t('installBanner', 'Install ChefIApp for faster access')}
      </span>
      <button
        type="button"
        onClick={handleInstall}
        style={{
          padding: '6px 16px',
          backgroundColor: '#f59e0b',
          color: '#0a0a0a',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {t('installButton', 'Install')}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          padding: '6px 12px',
          backgroundColor: 'transparent',
          color: '#a8a29e',
          border: '1px solid #44403c',
          borderRadius: 6,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {t('installLater', 'Later')}
      </button>
    </div>
  );
}
