// @ts-nocheck
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrderTimer } from "./OrderTimer";

// Mock dependencies if necessary for larger KDS tests
// For now, testing OrderTimer isolated logic is high value

describe("OrderTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders initial time correctly", () => {
    const now = new Date("2024-01-01T12:00:00Z").getTime();
    vi.setSystemTime(now);

    // Order created exactly now = 0 min (component shows minutes only, no seconds)
    render(<OrderTimer createdAt={new Date(now).toISOString()} />);

    expect(screen.getByText("0 min")).toBeTruthy();
  });

  it("updates time after 1 second", () => {
    const now = new Date("2024-01-01T12:00:00Z").getTime();
    vi.setSystemTime(now);

    render(<OrderTimer createdAt={new Date(now).toISOString()} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Component shows minutes only; 1 second = still "0 min"
    expect(screen.getByText("0 min")).toBeTruthy();
  });

  it("formats minutes correctly", () => {
    const now = new Date("2024-01-01T12:00:00Z").getTime();
    vi.setSystemTime(now);

    // Created 65 seconds ago = 1 min (component shows "X min" for < 1h, no seconds)
    const past = now - 65000;

    render(<OrderTimer createdAt={new Date(past).toISOString()} />);

    expect(screen.getByText("1 min")).toBeTruthy();
  });

  it("formats hours correctly", () => {
    const now = new Date("2024-01-01T12:00:00Z").getTime();
    vi.setSystemTime(now);

    // Created 3665 seconds ago = 1h 1m (component shows "H:MM", no seconds)
    const past = now - 3665000;

    render(<OrderTimer createdAt={new Date(past).toISOString()} />);

    expect(screen.getByText("1:01")).toBeTruthy();
  });
});
