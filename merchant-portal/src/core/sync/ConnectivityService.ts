/**
 * ConnectivityService — Fonte única de verdade para conectividade.
 *
 * - online: browser online e Core alcançável
 * - offline: navigator.onLine === false
 * - degraded: browser online mas Core inalcançável (writes enfileiram, reads tentam rede + fallback)
 *
 * isOffline = connectivity !== "online"
 */

import { CONFIG } from '../../config';
import { Logger } from '../logger';

export type ConnectivityStatus = 'online' | 'offline' | 'degraded';

export type ConnectivityListener = (status: ConnectivityStatus) => void;

const CORE_HEARTBEAT_TIMEOUT_MS = 5000;

class ConnectivityServiceClass {
  private connectivity: ConnectivityStatus =
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline';
  private listeners: ConnectivityListener[] = [];
  private coreHeartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private coreHeartbeatFailures = 0;
  private isSimulatedOffline = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNavigatorOnline());
      window.addEventListener('offline', () => this.handleNavigatorOffline());
    }
  }

  private setStatus(status: ConnectivityStatus) {
    if (this.connectivity === status) return;
    this.connectivity = status;
    Logger.info(`[ConnectivityService] Connectivity is now ${status}`);
    this.listeners.forEach((l) => l(this.connectivity));
  }

  private handleNavigatorOffline() {
    this.stopCoreHeartbeat();
    this.setStatus('offline');
  }

  private handleNavigatorOnline() {
    if (this.isSimulatedOffline) return;
    this.coreHeartbeatFailures = 0;
    this.setStatus('online');
    this.checkCoreHeartbeat().then(() => {
      // Notify so SyncEngine can process queue
      this.listeners.forEach((l) => l(this.connectivity));
    });
    this.maybeStartCoreHeartbeat();
  }

  private maybeStartCoreHeartbeat() {
    if (this.coreHeartbeatIntervalId) return;
    const coreUrl = CONFIG.CORE_URL;
    if (!coreUrl || !CONFIG.OFFLINE_HEARTBEAT_ENABLED) return;
    const intervalMs = CONFIG.OFFLINE_HEARTBEAT_INTERVAL_MS ?? 30000;
    Logger.info('[ConnectivityService] Starting Core heartbeat', { intervalMs });
    this.coreHeartbeatIntervalId = setInterval(() => {
      if (this.getConnectivity() === 'offline') return;
      this.checkCoreHeartbeat();
    }, intervalMs);
  }

  private stopCoreHeartbeat() {
    if (this.coreHeartbeatIntervalId) {
      clearInterval(this.coreHeartbeatIntervalId);
      this.coreHeartbeatIntervalId = null;
      Logger.info('[ConnectivityService] Core heartbeat stopped');
    }
    this.coreHeartbeatFailures = 0;
  }

  private async checkCoreHeartbeat(): Promise<boolean> {
    const coreUrl = CONFIG.CORE_URL;
    if (!coreUrl || !CONFIG.OFFLINE_HEARTBEAT_ENABLED) return true;
    const url = `${coreUrl.replace(/\/$/, '')}/rest/v1/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CORE_HEARTBEAT_TIMEOUT_MS);
    try {
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok || res.status === 401) {
        if (this.coreHeartbeatFailures > 0 || this.connectivity === 'degraded') {
          this.coreHeartbeatFailures = 0;
          this.setStatus('online');
        }
        return true;
      }
      throw new Error(`Core returned ${res.status}`);
    } catch (_err) {
      clearTimeout(timeoutId);
      this.coreHeartbeatFailures++;
      const maxFailures = CONFIG.OFFLINE_HEARTBEAT_FAILURES ?? 2;
      if (
        this.coreHeartbeatFailures >= maxFailures &&
        this.connectivity !== 'offline'
      ) {
        this.setStatus('degraded');
        Logger.warn('[ConnectivityService] Core unreachable after consecutive failures', {
          failures: this.coreHeartbeatFailures,
        });
      }
      return false;
    }
  }

  /** Fonte única: estado atual de conectividade */
  getConnectivity(): ConnectivityStatus {
    if (this.isSimulatedOffline) return 'offline';
    return this.connectivity;
  }

  /** true quando não estamos "online" (inclui degraded) */
  isOffline(): boolean {
    return this.getConnectivity() !== 'online';
  }

  subscribe(listener: ConnectivityListener): () => void {
    this.listeners.push(listener);
    listener(this.getConnectivity());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Apenas para testes: forçar offline sem alterar navigator */
  simulateOffline(enabled: boolean) {
    this.isSimulatedOffline = enabled;
    if (enabled) {
      this.stopCoreHeartbeat();
      this.setStatus('offline');
    } else {
      this.handleNavigatorOnline();
    }
    Logger.warn(`[ConnectivityService] Simulation: ${enabled ? 'FORCED OFFLINE' : 'NORMAL'}`);
  }
}

export const ConnectivityService = new ConnectivityServiceClass();
