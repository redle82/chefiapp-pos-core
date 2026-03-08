import {
  DuplicateWebhookMonitor,
  type DuplicateWebhookSnapshot,
} from "./duplicate-webhook-monitor";

describe("DuplicateWebhookMonitor", () => {
  it("tracks duplicate counts by provider", () => {
    let nowMs = 1_000;
    const monitor = new DuplicateWebhookMonitor({
      threshold: 3,
      windowMs: 60_000,
      now: () => nowMs,
    });

    monitor.recordDuplicate("sumup");
    nowMs += 1_000;
    monitor.recordDuplicate("stripe");
    nowMs += 1_000;
    const latest = monitor.recordDuplicate("sumup");

    expect(latest.provider).toBe("sumup");
    expect(latest.providerCount).toBe(2);
    expect(latest.totalCount).toBe(3);

    const snapshot = monitor.getSnapshot();
    expect(snapshot.totalCount).toBe(3);
    expect(snapshot.providers).toEqual({ sumup: 2, stripe: 1 });
  });

  it("emits alert only once per provider within same window", () => {
    let nowMs = 1_000;
    const monitor = new DuplicateWebhookMonitor({
      threshold: 2,
      windowMs: 60_000,
      now: () => nowMs,
    });

    const first = monitor.recordDuplicate("sumup");
    const second = monitor.recordDuplicate("sumup");
    const third = monitor.recordDuplicate("sumup");

    expect(first.shouldAlert).toBe(false);
    expect(second.shouldAlert).toBe(true);
    expect(third.shouldAlert).toBe(false);
  });

  it("allows a new alert after window expiration", () => {
    let nowMs = 1_000;
    const monitor = new DuplicateWebhookMonitor({
      threshold: 2,
      windowMs: 10_000,
      now: () => nowMs,
    });

    monitor.recordDuplicate("stripe");
    const alertInFirstWindow = monitor.recordDuplicate("stripe");
    expect(alertInFirstWindow.shouldAlert).toBe(true);

    nowMs += 20_000;

    monitor.recordDuplicate("stripe");
    const alertInSecondWindow = monitor.recordDuplicate("stripe");
    expect(alertInSecondWindow.shouldAlert).toBe(true);
  });

  it("returns empty snapshot when no duplicates were recorded", () => {
    const monitor = new DuplicateWebhookMonitor();
    const snapshot: DuplicateWebhookSnapshot = monitor.getSnapshot();

    expect(snapshot.totalCount).toBe(0);
    expect(snapshot.providers).toEqual({});
  });
});
