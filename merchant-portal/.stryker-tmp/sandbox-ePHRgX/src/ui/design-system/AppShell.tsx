// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useCoreHealth } from '../../core/health';
import { CoreStatusBanner } from './CoreStatusBanner';
import { isDevStableMode } from '../../core/runtime/devStableMode';

export interface AppShellProps {
  children: React.ReactNode;
  /** Enable continuous health monitoring. Default: true */
  healthMonitoring?: boolean;
  /** If true, strictly suppresses even critical banners (e.g. for Kiosks). Default: false */
  operationalMode?: boolean;
  /** @deprecated Visual props are ignored in UDS. Use AdminLayout or OperationalLayout. */
  topbar?: React.ReactNode;
  /** @deprecated Visual props are ignored in UDS. */
  sidebar?: React.ReactNode;
  /** @deprecated Visual props are ignored in UDS. */
  showSidebar?: boolean;
  className?: string;
}

/**
 * AppShell (Logic Provider)
 * 
 * Responsible for:
 * 1. System Health Monitoring (useCoreHealth)
 * 2. Critical Alert Injection (CoreStatusBanner)
 * 3. Feature Flag / Environment Context
 * 
 * DECOUPLED: Does NOT render layout, sidebar, or headers.
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  healthMonitoring = true,
  operationalMode = false,
}) => {
  // DEV_STABLE_MODE: Desabilitar health monitoring para reduzir ruído
  const devStable = isDevStableMode();
  const shouldMonitorHealth = healthMonitoring && !devStable;

  // BUG-023 FIX: Detect network offline status
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Health Logic
  // DEV_STABLE_MODE: Polling mais espaçado quando DOWN para reduzir requisições
  const { status, lastChecked, check } = useCoreHealth({
    autoStart: shouldMonitorHealth,
    pollInterval: 60000, // 60s quando UP
    downPollInterval: devStable ? 120000 : 30000, // 2min em DEV_STABLE, 30s normal quando DOWN
  });

  return (
    <>
      {/* Logic Layer: Critical Interventions Only */}
      {/* BUG-023 FIX: Show offline banner when network is offline (highest priority) */}
      {!isNetworkOnline && !operationalMode && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <CoreStatusBanner 
            status="DOWN" 
            lastChecked={Date.now()} 
            onRetry={() => window.location.reload()} 
          />
        </div>
      )}
      {/* Show backend status banner only when network is online */}
      {healthMonitoring && !operationalMode && status !== 'UP' && isNetworkOnline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <CoreStatusBanner status={status} lastChecked={lastChecked} onRetry={check} />
        </div>
      )}

      {/* Render Children (The Layout) directly */}
      {children}
    </>
  );
};

export default AppShell;
