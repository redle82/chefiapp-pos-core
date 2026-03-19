/**
 * OfflineIndicator — Fixed top banner when the device is offline.
 *
 * - Shows: "You're offline -- changes will sync when connected"
 * - Amber background, dismissable but reappears on new offline event
 * - Shows queue count from SyncEngine
 * - Smooth slide-in/slide-out animation
 *
 * Note: This component enhances the existing ui/OfflineIndicator with
 * queue count and dismissal behavior. The original simple indicator
 * in ui/OfflineIndicator.tsx remains for backward compatibility.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectivity } from '../../core/sync/useConnectivity';
import { useOfflineQueue } from '../../core/sync/useOfflineQueue';

export function OfflineIndicatorEnhanced() {
  const { t } = useTranslation('pwa');
  const connectivity = useConnectivity();
  const { pendingCount } = useOfflineQueue();
  const isOffline = connectivity !== 'online';
  const [dismissed, setDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Reset dismissal when transitioning back to offline
  useEffect(() => {
    if (isOffline && !wasOffline) {
      setDismissed(false);
    }
    setWasOffline(isOffline);
  }, [isOffline, wasOffline]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const show = isOffline && !dismissed;

  if (!show) return null;

  const queueLabel =
    pendingCount > 0
      ? ` (${pendingCount} ${t('pendingChanges', 'pending')})`
      : '';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '8px 16px',
        backgroundColor: '#92400e',
        color: '#fef3c7',
        fontSize: 13,
        fontFamily: 'system-ui, sans-serif',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <span style={{ flex: 1, textAlign: 'center' }}>
        {t(
          'offlineBanner',
          "You're offline -- changes will sync when connected",
        )}
        {queueLabel}
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('dismiss', 'Dismiss')}
        style={{
          background: 'none',
          border: 'none',
          color: '#fef3c7',
          fontSize: 16,
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1,
        }}
      >
        x
      </button>
    </div>
  );
}
