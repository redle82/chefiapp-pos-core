export interface DuplicateWebhookSnapshot {
  totalCount: number;
  providers: Record<string, number>;
  threshold: number;
  windowMs: number;
  windowStart: string;
  windowEnd: string;
}

export interface DuplicateWebhookRecord {
  provider: string;
  providerCount: number;
  totalCount: number;
  threshold: number;
  windowMs: number;
  shouldAlert: boolean;
  windowStart: string;
  windowEnd: string;
}

interface DuplicateWebhookMonitorOptions {
  threshold?: number;
  windowMs?: number;
  now?: () => number;
}

interface ProviderWindowState {
  timestamps: number[];
  alertEmitted: boolean;
}

const DEFAULT_THRESHOLD = 10;
const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

export class DuplicateWebhookMonitor {
  private readonly threshold: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  private readonly providerState = new Map<string, ProviderWindowState>();

  constructor(options: DuplicateWebhookMonitorOptions = {}) {
    this.threshold = options.threshold ?? DEFAULT_THRESHOLD;
    this.windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    this.now = options.now ?? Date.now;
  }

  recordDuplicate(provider: string): DuplicateWebhookRecord {
    const now = this.now();
    const state = this.getProviderState(provider);

    this.pruneState(state, now);
    state.timestamps.push(now);

    const providerCount = state.timestamps.length;
    const shouldAlert = providerCount >= this.threshold && !state.alertEmitted;

    if (shouldAlert) {
      state.alertEmitted = true;
    }

    return {
      provider,
      providerCount,
      totalCount: this.getTotalCount(now),
      threshold: this.threshold,
      windowMs: this.windowMs,
      shouldAlert,
      windowStart: new Date(now - this.windowMs).toISOString(),
      windowEnd: new Date(now).toISOString(),
    };
  }

  getSnapshot(): DuplicateWebhookSnapshot {
    const now = this.now();
    const providers: Record<string, number> = {};

    this.providerState.forEach((state, provider) => {
      this.pruneState(state, now);
      if (state.timestamps.length > 0) {
        providers[provider] = state.timestamps.length;
      }
    });

    return {
      totalCount: Object.values(providers).reduce(
        (sum, value) => sum + value,
        0,
      ),
      providers,
      threshold: this.threshold,
      windowMs: this.windowMs,
      windowStart: new Date(now - this.windowMs).toISOString(),
      windowEnd: new Date(now).toISOString(),
    };
  }

  private getProviderState(provider: string): ProviderWindowState {
    const normalized = provider?.trim()?.toLowerCase() || "unknown";
    const current = this.providerState.get(normalized);

    if (current) {
      return current;
    }

    const created: ProviderWindowState = {
      timestamps: [],
      alertEmitted: false,
    };

    this.providerState.set(normalized, created);
    return created;
  }

  private getTotalCount(now: number): number {
    let total = 0;

    this.providerState.forEach((state) => {
      this.pruneState(state, now);
      total += state.timestamps.length;
    });

    return total;
  }

  private pruneState(state: ProviderWindowState, now: number): void {
    const thresholdTs = now - this.windowMs;
    state.timestamps = state.timestamps.filter(
      (timestamp) => timestamp >= thresholdTs,
    );

    if (state.timestamps.length < this.threshold) {
      state.alertEmitted = false;
    }
  }
}
