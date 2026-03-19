// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKdsAlerts } from "./useKdsAlerts";

// Mock Web Audio API
const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  type: "",
  frequency: { setValueAtTime: vi.fn() },
};
const mockGainNode = {
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  },
};
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockAudioContext = {
  createOscillator: () => ({ ...mockOscillator }),
  createGain: () => ({
    ...mockGainNode,
    gain: { ...mockGainNode.gain },
  }),
  destination: {},
  currentTime: 0,
  close: mockClose,
};

vi.stubGlobal(
  "AudioContext",
  vi.fn(() => ({ ...mockAudioContext })),
);

describe("useKdsAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Ensure document is visible for tests
    Object.defineProperty(document, "hidden", {
      value: false,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should default to audio enabled", () => {
    const { result } = renderHook(() =>
      useKdsAlerts({ orderCount: 0 }),
    );
    expect(result.current.audioEnabled).toBe(true);
  });

  it("should read initial state from localStorage", () => {
    localStorage.setItem("kds_audio_enabled", "false");
    const { result } = renderHook(() =>
      useKdsAlerts({ orderCount: 0 }),
    );
    expect(result.current.audioEnabled).toBe(false);
  });

  it("should toggle audio and persist to localStorage", () => {
    const { result } = renderHook(() =>
      useKdsAlerts({ orderCount: 0 }),
    );

    expect(result.current.audioEnabled).toBe(true);

    act(() => {
      result.current.toggleAudio();
    });

    expect(result.current.audioEnabled).toBe(false);
    expect(localStorage.getItem("kds_audio_enabled")).toBe("false");

    act(() => {
      result.current.toggleAudio();
    });

    expect(result.current.audioEnabled).toBe(true);
    expect(localStorage.getItem("kds_audio_enabled")).toBe("true");
  });

  it("should trigger AudioContext when order count increases", () => {
    const { rerender } = renderHook(
      ({ orderCount }) => useKdsAlerts({ orderCount }),
      { initialProps: { orderCount: 2 } },
    );

    // AudioContext should NOT have been called on mount
    expect(AudioContext).not.toHaveBeenCalled();

    // Increase order count
    rerender({ orderCount: 3 });

    // AudioContext should have been called
    expect(AudioContext).toHaveBeenCalled();
  });

  it("should NOT trigger when order count decreases", () => {
    const { rerender } = renderHook(
      ({ orderCount }) => useKdsAlerts({ orderCount }),
      { initialProps: { orderCount: 5 } },
    );

    (AudioContext as unknown as ReturnType<typeof vi.fn>).mockClear();

    rerender({ orderCount: 3 });

    expect(AudioContext).not.toHaveBeenCalled();
  });

  it("should NOT trigger when order count stays the same", () => {
    const { rerender } = renderHook(
      ({ orderCount }) => useKdsAlerts({ orderCount }),
      { initialProps: { orderCount: 5 } },
    );

    (AudioContext as unknown as ReturnType<typeof vi.fn>).mockClear();

    rerender({ orderCount: 5 });

    expect(AudioContext).not.toHaveBeenCalled();
  });

  it("should debounce rapid alerts (minimum 3s)", () => {
    const { rerender } = renderHook(
      ({ orderCount }) => useKdsAlerts({ orderCount }),
      { initialProps: { orderCount: 1 } },
    );

    // First increase — should play
    rerender({ orderCount: 2 });
    expect(AudioContext).toHaveBeenCalledTimes(1);

    // Rapid second increase within 3s — should NOT play
    rerender({ orderCount: 3 });
    expect(AudioContext).toHaveBeenCalledTimes(1);

    // Advance past debounce window
    vi.advanceTimersByTime(3100);

    // Third increase after debounce — should play
    rerender({ orderCount: 4 });
    expect(AudioContext).toHaveBeenCalledTimes(2);
  });

  it("should NOT alert when audio is disabled by user", () => {
    const { result, rerender } = renderHook(
      ({ orderCount }) => useKdsAlerts({ orderCount }),
      { initialProps: { orderCount: 1 } },
    );

    // Disable audio
    act(() => {
      result.current.toggleAudio();
    });

    (AudioContext as unknown as ReturnType<typeof vi.fn>).mockClear();

    // Increase count
    rerender({ orderCount: 2 });

    expect(AudioContext).not.toHaveBeenCalled();
  });

  it("should NOT alert when enabled prop is false", () => {
    const { rerender } = renderHook(
      ({ orderCount, enabled }) =>
        useKdsAlerts({ orderCount, enabled }),
      { initialProps: { orderCount: 1, enabled: false } },
    );

    rerender({ orderCount: 2, enabled: false });

    expect(AudioContext).not.toHaveBeenCalled();
  });

  it("should NOT alert when document is hidden", () => {
    Object.defineProperty(document, "hidden", {
      value: true,
      writable: true,
      configurable: true,
    });

    const { rerender } = renderHook(
      ({ orderCount }) => useKdsAlerts({ orderCount }),
      { initialProps: { orderCount: 1 } },
    );

    rerender({ orderCount: 2 });

    expect(AudioContext).not.toHaveBeenCalled();
  });
});
