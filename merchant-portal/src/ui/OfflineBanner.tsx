/**
 * OfflineBanner — Enhanced offline indicator for TPV.
 *
 * Displays contextual information based on connectivity state:
 * - Offline: "Modo offline — X pedidos pendentes"
 * - Syncing: Animated sync icon with progress
 * - Sync complete: Success toast (auto-dismisses)
 * - Sync error: Error badge with retry
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectivity } from '../core/sync/useConnectivity';
import { useOfflineQueue } from '../core/sync/useOfflineQueue';
import { colors } from './design-system/tokens/colors';

// ─── Styles ──────────────────────────────────────────────────────────────────

const bannerStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  transition: 'background-color 0.3s ease, color 0.3s ease',
};

const spinKeyframes = `
@keyframes offlineBannerSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

// ─── Sub-components ──────────────────────────────────────────────────────────

function SyncIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={spinning ? { animation: 'offlineBannerSpin 1s linear infinite' } : undefined}
      aria-hidden
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6" />
      <path d="M2.5 11.5a10 10 0 0 1 18.17-4.5M21.5 12.5a10 10 0 0 1-18.17 4.5" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type BannerState = 'hidden' | 'offline' | 'syncing' | 'success' | 'error';

export function OfflineBanner() {
  const { t } = useTranslation('common');
  const connectivity = useConnectivity();
  const { isProcessing, pendingCount, networkStatus } = useOfflineQueue();

  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const [showSuccess, setShowSuccess] = useState(false);
  const prevProcessingRef = useRef(false);
  const prevPendingRef = useRef(0);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inject keyframes once
  useEffect(() => {
    const id = 'offline-banner-keyframes';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = spinKeyframes;
      document.head.appendChild(style);
    }
  }, []);

  // Determine banner state from connectivity + sync state
  useEffect(() => {
    const isOffline = connectivity !== 'online';

    if (isOffline) {
      setBannerState('offline');
      setShowSuccess(false);
      return;
    }

    if (isProcessing && pendingCount > 0) {
      setBannerState('syncing');
      return;
    }

    // Detect sync completion: was processing, now done, count dropped
    if (
      prevProcessingRef.current &&
      !isProcessing &&
      prevPendingRef.current > 0 &&
      pendingCount === 0
    ) {
      setShowSuccess(true);
      setBannerState('success');

      // Auto-dismiss success after 3 seconds
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setShowSuccess(false);
        setBannerState('hidden');
      }, 3000);
    } else if (!isProcessing && pendingCount === 0 && !showSuccess) {
      setBannerState('hidden');
    }

    prevProcessingRef.current = isProcessing;
    prevPendingRef.current = pendingCount;
  }, [connectivity, isProcessing, pendingCount, showSuccess]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  if (bannerState === 'hidden') return null;

  const config = getBannerConfig(bannerState, pendingCount, t);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        ...bannerStyle,
        backgroundColor: config.bgColor,
        color: config.textColor,
        borderBottom: `1px solid ${config.borderColor}`,
      }}
    >
      {config.icon}
      <span>{config.message}</span>
      {config.badge && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 20,
            height: 20,
            padding: '0 6px',
            borderRadius: 10,
            backgroundColor: config.badgeColor,
            color: config.badgeTextColor,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {config.badge}
        </span>
      )}
    </div>
  );
}

// ─── Banner configuration ────────────────────────────────────────────────────

interface BannerConfig {
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: React.ReactNode;
  message: string;
  badge?: string | number;
  badgeColor?: string;
  badgeTextColor?: string;
}

function getBannerConfig(
  state: BannerState,
  pendingCount: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): BannerConfig {
  switch (state) {
    case 'offline':
      return {
        bgColor: colors.surface.layer2,
        textColor: colors.text.secondary,
        borderColor: colors.border.subtle,
        icon: <OfflineIcon />,
        message:
          pendingCount > 0
            ? t('offlineBanner.withPending', {
                count: pendingCount,
                defaultValue: `Modo offline \u2014 ${pendingCount} pedido(s) pendente(s)`,
              })
            : t('offlineBanner.noPending', {
                defaultValue: 'Modo offline \u2014 as altera\u00e7\u00f5es ser\u00e3o sincronizadas quando a liga\u00e7\u00e3o voltar',
              }),
        badge: pendingCount > 0 ? pendingCount : undefined,
        badgeColor: colors.warning.base,
        badgeTextColor: colors.warning.contrastText,
      };

    case 'syncing':
      return {
        bgColor: colors.info.base + '1A', // 10% opacity
        textColor: colors.info.text !== colors.text.inverse ? colors.info.text : colors.text.primary,
        borderColor: colors.info.base + '33',
        icon: <SyncIcon spinning />,
        message: t('offlineBanner.syncing', {
          count: pendingCount,
          defaultValue: `A sincronizar ${pendingCount} pedido(s)...`,
        }),
        badge: pendingCount,
        badgeColor: colors.info.base,
        badgeTextColor: colors.info.contrastText,
      };

    case 'success':
      return {
        bgColor: colors.success.base + '1A',
        textColor: colors.success.text !== colors.text.inverse ? colors.success.text : colors.text.primary,
        borderColor: colors.success.base + '33',
        icon: <CheckIcon />,
        message: t('offlineBanner.syncComplete', {
          defaultValue: 'Sincroniza\u00e7\u00e3o conclu\u00edda com sucesso',
        }),
      };

    case 'error':
      return {
        bgColor: colors.destructive.base + '1A',
        textColor: colors.destructive.text !== colors.text.inverse ? colors.destructive.text : colors.text.primary,
        borderColor: colors.destructive.base + '33',
        icon: <ErrorIcon />,
        message: t('offlineBanner.syncError', {
          defaultValue: 'Erro na sincroniza\u00e7\u00e3o \u2014 tentando novamente...',
        }),
        badge: pendingCount > 0 ? pendingCount : undefined,
        badgeColor: colors.destructive.base,
        badgeTextColor: colors.destructive.contrastText,
      };

    default:
      return {
        bgColor: 'transparent',
        textColor: colors.text.secondary,
        borderColor: 'transparent',
        icon: null,
        message: '',
      };
  }
}
