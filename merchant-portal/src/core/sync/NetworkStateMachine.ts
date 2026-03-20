/**
 * NetworkStateMachine — Finite state machine for network connectivity in POS.
 *
 * States:
 *   ONLINE       — All good, sync immediately
 *   OFFLINE      — Queue everything, show indicator
 *   DEGRADED     — Slow/unreliable connection, batch sync every 30s
 *   RECONNECTING — Just came back online, drain queue with caution
 *
 * Transitions based on: navigator.onLine, fetch success/failure rate, latency.
 * Debounces online/offline events to avoid flapping on unstable WiFi.
 *
 * Wraps ConnectivityService and adds the RECONNECTING state and quality metrics.
 */

import { Logger } from '../logger';
import {
  ConnectivityService,
  type ConnectivityStatus,
} from './ConnectivityService';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NetworkState = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'RECONNECTING';

export interface NetworkQuality {
  state: NetworkState;
  latencyMs: number; // estimated latency from recent requests
  reliabilityScore: number; // 0-1, based on recent success rate
  lastSuccessfulRequest: number; // timestamp
  consecutiveFailures: number;
}

export type NetworkStateListener = (
  state: NetworkState,
  quality: NetworkQuality,
) => void;

// ─── Constants ───────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 2000; // Debounce flapping online/offline events
const RECONNECTING_DRAIN_DELAY_MS = 500; // Pause before draining queue on reconnect
const RECONNECTING_TIMEOUT_MS = 30_000; // Max time in RECONNECTING before going ONLINE
const LATENCY_WINDOW_SIZE = 10; // Rolling window for latency tracking
const DEGRADED_LATENCY_THRESHOLD_MS = 5000; // Latency above this = degraded
const DEGRADED_RELIABILITY_THRESHOLD = 0.5; // Below 50% success = degraded

// ─── Service ─────────────────────────────────────────────────────────────────

class NetworkStateMachineClass {
  private state: NetworkState = 'ONLINE';
  private listeners: NetworkStateListener[] = [];
  private latencyWindow: number[] = [];
  private requestResults: boolean[] = []; // true=success, false=failure
  private lastSuccessfulRequest: number = Date.now();
  private consecutiveFailures: number = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectingTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeConnectivity: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initFromConnectivity();
    }
  }

  private initFromConnectivity(): void {
    // Map initial ConnectivityService state
    const initial = ConnectivityService.getConnectivity();
    this.state = this.mapConnectivityToState(initial);

    // Subscribe to ConnectivityService changes (source of truth for raw connectivity)
    this.unsubscribeConnectivity = ConnectivityService.subscribe(
      (status: ConnectivityStatus) => {
        this.handleConnectivityChange(status);
      },
    );
  }

  private mapConnectivityToState(status: ConnectivityStatus): NetworkState {
    switch (status) {
      case 'online':
        return 'ONLINE';
      case 'offline':
        return 'OFFLINE';
      case 'degraded':
        return 'DEGRADED';
      default:
        return 'OFFLINE';
    }
  }

  private handleConnectivityChange(status: ConnectivityStatus): void {
    // Debounce to avoid flapping
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.applyConnectivityChange(status);
    }, DEBOUNCE_MS);
  }

  private applyConnectivityChange(status: ConnectivityStatus): void {
    const previousState = this.state;

    if (status === 'offline') {
      this.transition('OFFLINE');
      return;
    }

    if (status === 'degraded') {
      this.transition('DEGRADED');
      return;
    }

    // status === 'online'
    if (previousState === 'OFFLINE' || previousState === 'DEGRADED') {
      // Transitioning from offline/degraded to online: enter RECONNECTING
      this.transition('RECONNECTING');
      this.scheduleReconnectingTimeout();
      return;
    }

    this.transition('ONLINE');
  }

  private scheduleReconnectingTimeout(): void {
    if (this.reconnectingTimer) {
      clearTimeout(this.reconnectingTimer);
    }

    this.reconnectingTimer = setTimeout(() => {
      this.reconnectingTimer = null;
      if (this.state === 'RECONNECTING') {
        Logger.info(
          '[NetworkStateMachine] RECONNECTING timeout reached, transitioning to ONLINE',
        );
        this.transition('ONLINE');
      }
    }, RECONNECTING_TIMEOUT_MS);
  }

  private transition(newState: NetworkState): void {
    if (this.state === newState) return;

    const previousState = this.state;
    this.state = newState;

    Logger.info(
      `[NetworkStateMachine] ${previousState} -> ${newState}`,
    );

    const quality = this.getNetworkQuality();
    for (const listener of this.listeners) {
      try {
        listener(newState, quality);
      } catch (err) {
        Logger.error('[NetworkStateMachine] Listener error', err);
      }
    }
  }

  /**
   * Record the result of a network request for quality tracking.
   * Call this from SyncEngine after every fetch attempt.
   */
  recordRequestResult(success: boolean, latencyMs?: number): void {
    // Track success/failure in rolling window
    this.requestResults.push(success);
    if (this.requestResults.length > LATENCY_WINDOW_SIZE * 2) {
      this.requestResults.splice(0, this.requestResults.length - LATENCY_WINDOW_SIZE * 2);
    }

    if (success) {
      this.lastSuccessfulRequest = Date.now();
      this.consecutiveFailures = 0;

      if (latencyMs !== undefined) {
        this.latencyWindow.push(latencyMs);
        if (this.latencyWindow.length > LATENCY_WINDOW_SIZE) {
          this.latencyWindow.shift();
        }
      }

      // If we're RECONNECTING and requests are succeeding, transition to ONLINE
      if (this.state === 'RECONNECTING') {
        if (this.reconnectingTimer) {
          clearTimeout(this.reconnectingTimer);
          this.reconnectingTimer = null;
        }
        this.transition('ONLINE');
      }
    } else {
      this.consecutiveFailures++;

      // If enough consecutive failures while ONLINE, transition to DEGRADED
      if (this.state === 'ONLINE' && this.consecutiveFailures >= 3) {
        this.transition('DEGRADED');
      }
    }

    // Check if quality has degraded enough to change state
    const quality = this.getNetworkQuality();
    if (
      this.state === 'ONLINE' &&
      (quality.latencyMs > DEGRADED_LATENCY_THRESHOLD_MS ||
        quality.reliabilityScore < DEGRADED_RELIABILITY_THRESHOLD)
    ) {
      this.transition('DEGRADED');
    }
  }

  /**
   * Get current network quality metrics.
   */
  getNetworkQuality(): NetworkQuality {
    const latencyMs =
      this.latencyWindow.length > 0
        ? Math.round(
            this.latencyWindow.reduce((a, b) => a + b, 0) /
              this.latencyWindow.length,
          )
        : 0;

    const recentResults = this.requestResults.slice(-LATENCY_WINDOW_SIZE);
    const reliabilityScore =
      recentResults.length > 0
        ? recentResults.filter(Boolean).length / recentResults.length
        : 1;

    return {
      state: this.state,
      latencyMs,
      reliabilityScore: Math.round(reliabilityScore * 100) / 100,
      lastSuccessfulRequest: this.lastSuccessfulRequest,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Get the current network state.
   */
  getState(): NetworkState {
    return this.state;
  }

  /**
   * Check if the network is in a state that allows syncing.
   */
  canSync(): boolean {
    return this.state !== 'OFFLINE';
  }

  /**
   * Check if we should batch operations (DEGRADED mode).
   */
  shouldBatch(): boolean {
    return this.state === 'DEGRADED';
  }

  /**
   * Get the delay before draining queue on reconnect.
   */
  getReconnectDrainDelay(): number {
    return RECONNECTING_DRAIN_DELAY_MS;
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: NetworkStateListener): () => void {
    this.listeners.push(listener);
    // Immediately notify with current state
    listener(this.state, this.getNetworkQuality());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Mark reconnection as complete (called after queue drain finishes).
   */
  markReconnectionComplete(): void {
    if (this.state === 'RECONNECTING') {
      if (this.reconnectingTimer) {
        clearTimeout(this.reconnectingTimer);
        this.reconnectingTimer = null;
      }
      this.transition('ONLINE');
    }
  }

  /**
   * Cleanup (for testing / shutdown).
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.reconnectingTimer) {
      clearTimeout(this.reconnectingTimer);
      this.reconnectingTimer = null;
    }
    if (this.unsubscribeConnectivity) {
      this.unsubscribeConnectivity();
      this.unsubscribeConnectivity = null;
    }
    this.listeners = [];
  }
}

export const NetworkStateMachine = new NetworkStateMachineClass();
