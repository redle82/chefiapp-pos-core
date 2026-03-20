// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock ConnectivityService before importing NetworkStateMachine
let connectivityListeners: Array<(status: string) => void> = [];
let mockConnectivity = 'online';

vi.mock('../ConnectivityService', () => ({
  ConnectivityService: {
    getConnectivity: vi.fn(() => mockConnectivity),
    subscribe: vi.fn((listener: (status: string) => void) => {
      connectivityListeners.push(listener);
      return () => {
        connectivityListeners = connectivityListeners.filter((l) => l !== listener);
      };
    }),
  },
}));

vi.mock('../../logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../config', () => ({
  CONFIG: {
    CORE_URL: '',
    OFFLINE_HEARTBEAT_ENABLED: false,
  },
}));

describe('NetworkStateMachine', () => {
  let NetworkStateMachine: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    connectivityListeners = [];
    mockConnectivity = 'online';

    // Re-import for fresh instance
    vi.resetModules();
    const mod = await import('../NetworkStateMachine');
    NetworkStateMachine = mod.NetworkStateMachine;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts in ONLINE state when connectivity is online', () => {
      expect(NetworkStateMachine.getState()).toBe('ONLINE');
    });
  });

  describe('canSync', () => {
    it('returns true when ONLINE', () => {
      expect(NetworkStateMachine.canSync()).toBe(true);
    });
  });

  describe('shouldBatch', () => {
    it('returns false when ONLINE', () => {
      expect(NetworkStateMachine.shouldBatch()).toBe(false);
    });
  });

  describe('transitions via connectivity changes', () => {
    it('transitions ONLINE -> OFFLINE on offline event (debounced)', () => {
      // Simulate connectivity change to offline
      for (const listener of connectivityListeners) {
        listener('offline');
      }

      // Before debounce
      expect(NetworkStateMachine.getState()).toBe('ONLINE');

      // After debounce (2s)
      vi.advanceTimersByTime(2100);
      expect(NetworkStateMachine.getState()).toBe('OFFLINE');
    });

    it('debounces transitions (ignores flapping)', () => {
      // Rapid offline -> online within debounce window
      for (const listener of connectivityListeners) {
        listener('offline');
      }
      vi.advanceTimersByTime(500); // Only 500ms, not yet debounced

      for (const listener of connectivityListeners) {
        listener('online');
      }
      vi.advanceTimersByTime(2100); // Debounce fires for the LAST event (online)

      // Should end up as ONLINE (the offline was superseded)
      expect(NetworkStateMachine.getState()).toBe('ONLINE');
    });
  });

  describe('network quality tracking', () => {
    it('degrades after 3 consecutive failures when starting from ONLINE', () => {
      // Ensure we start from ONLINE
      expect(NetworkStateMachine.getState()).toBe('ONLINE');

      NetworkStateMachine.recordRequestResult(false);
      NetworkStateMachine.recordRequestResult(false);
      // After 2 failures, may still be ONLINE or already transitioning
      // The key assertion: after 3 failures it must be DEGRADED
      NetworkStateMachine.recordRequestResult(false);
      expect(NetworkStateMachine.getState()).toBe('DEGRADED');
    });

    it('recovers to ONLINE on successful request while RECONNECTING', () => {
      // Force into RECONNECTING by going offline then online
      for (const listener of connectivityListeners) {
        listener('offline');
      }
      vi.advanceTimersByTime(2100);
      expect(NetworkStateMachine.getState()).toBe('OFFLINE');

      for (const listener of connectivityListeners) {
        listener('online');
      }
      vi.advanceTimersByTime(2100);
      expect(NetworkStateMachine.getState()).toBe('RECONNECTING');

      // Successful request should move to ONLINE
      NetworkStateMachine.recordRequestResult(true, 50);
      expect(NetworkStateMachine.getState()).toBe('ONLINE');
    });

    it('resets consecutive failures on success', () => {
      NetworkStateMachine.recordRequestResult(false);
      NetworkStateMachine.recordRequestResult(false);
      NetworkStateMachine.recordRequestResult(true, 100);

      const quality = NetworkStateMachine.getNetworkQuality();
      expect(quality.consecutiveFailures).toBe(0);
    });

    it('tracks latency in rolling window', () => {
      NetworkStateMachine.recordRequestResult(true, 100);
      NetworkStateMachine.recordRequestResult(true, 200);
      NetworkStateMachine.recordRequestResult(true, 300);

      const quality = NetworkStateMachine.getNetworkQuality();
      expect(quality.latencyMs).toBe(200); // Average of 100, 200, 300
    });

    it('tracks reliability score', () => {
      NetworkStateMachine.recordRequestResult(true, 100);
      NetworkStateMachine.recordRequestResult(true, 100);
      NetworkStateMachine.recordRequestResult(false);

      const quality = NetworkStateMachine.getNetworkQuality();
      // 2 success out of 3 = 0.67
      expect(quality.reliabilityScore).toBeCloseTo(0.67, 1);
    });
  });

  describe('canSync and shouldBatch for different states', () => {
    it('canSync returns false when OFFLINE', () => {
      for (const listener of connectivityListeners) {
        listener('offline');
      }
      vi.advanceTimersByTime(2100);

      expect(NetworkStateMachine.canSync()).toBe(false);
    });

    it('shouldBatch returns true when DEGRADED', () => {
      // Force to DEGRADED via consecutive failures
      NetworkStateMachine.recordRequestResult(false);
      NetworkStateMachine.recordRequestResult(false);
      NetworkStateMachine.recordRequestResult(false);

      expect(NetworkStateMachine.shouldBatch()).toBe(true);
    });

    it('canSync returns true when DEGRADED', () => {
      NetworkStateMachine.recordRequestResult(false);
      NetworkStateMachine.recordRequestResult(false);
      NetworkStateMachine.recordRequestResult(false);

      expect(NetworkStateMachine.canSync()).toBe(true);
    });

    it('canSync returns true when RECONNECTING', () => {
      // Go offline then online
      for (const listener of connectivityListeners) {
        listener('offline');
      }
      vi.advanceTimersByTime(2100);
      for (const listener of connectivityListeners) {
        listener('online');
      }
      vi.advanceTimersByTime(2100);

      expect(NetworkStateMachine.getState()).toBe('RECONNECTING');
      expect(NetworkStateMachine.canSync()).toBe(true);
    });
  });

  describe('subscription', () => {
    it('notifies listeners on state change', () => {
      const listener = vi.fn();
      NetworkStateMachine.subscribe(listener);

      // Listener is called immediately with current state
      expect(listener).toHaveBeenCalledWith('ONLINE', expect.any(Object));

      // Simulate going offline
      for (const cl of connectivityListeners) {
        cl('offline');
      }
      vi.advanceTimersByTime(2100);

      expect(listener).toHaveBeenCalledWith('OFFLINE', expect.any(Object));
    });

    it('unsubscribe stops notifications', () => {
      const listener = vi.fn();
      const unsub = NetworkStateMachine.subscribe(listener);

      unsub();
      listener.mockClear();

      for (const cl of connectivityListeners) {
        cl('offline');
      }
      vi.advanceTimersByTime(2100);

      // After unsubscribe, listener should not be called
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('markReconnectionComplete', () => {
    it('transitions from RECONNECTING to ONLINE', () => {
      // Go offline then online to reach RECONNECTING
      for (const listener of connectivityListeners) {
        listener('offline');
      }
      vi.advanceTimersByTime(2100);
      for (const listener of connectivityListeners) {
        listener('online');
      }
      vi.advanceTimersByTime(2100);

      expect(NetworkStateMachine.getState()).toBe('RECONNECTING');

      NetworkStateMachine.markReconnectionComplete();
      expect(NetworkStateMachine.getState()).toBe('ONLINE');
    });
  });

  describe('destroy', () => {
    it('cleans up timers and listeners', () => {
      const listener = vi.fn();
      NetworkStateMachine.subscribe(listener);
      listener.mockClear();

      NetworkStateMachine.destroy();

      // After destroy, state changes should not notify
      for (const cl of connectivityListeners) {
        cl('offline');
      }
      vi.advanceTimersByTime(2100);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
