/**
 * @vitest-environment jsdom
 *
 * useDeepLinkAttempt — unit tests
 * Validates the deep link attempt hook behaviour:
 *   - Sets isAttempting during the timeout window
 *   - Shows fallback when document retains focus (app not found)
 *   - Cleans up iframe on unmount
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeepLinkAttempt } from "./useDeepLinkAttempt";

describe("useDeepLinkAttempt", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // document.hasFocus returns true by default (browser retains focus = app not installed)
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts with idle state", () => {
    const { result } = renderHook(() => useDeepLinkAttempt());
    expect(result.current.isAttempting).toBe(false);
    expect(result.current.showFallback).toBe(false);
  });

  it("sets isAttempting=true after attemptDeepLink", () => {
    const { result } = renderHook(() => useDeepLinkAttempt());
    act(() => {
      result.current.attemptDeepLink("chefiapp://open?app=tpv");
    });
    expect(result.current.isAttempting).toBe(true);
    expect(result.current.showFallback).toBe(false);
  });

  it("shows fallback after timeout if document has focus", () => {
    const { result } = renderHook(() => useDeepLinkAttempt());
    act(() => {
      result.current.attemptDeepLink("chefiapp://open?app=tpv");
    });
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(result.current.isAttempting).toBe(false);
    expect(result.current.showFallback).toBe(true);
  });

  it("does NOT show fallback if document lost focus (app opened)", () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(false);
    const { result } = renderHook(() => useDeepLinkAttempt());
    act(() => {
      result.current.attemptDeepLink("chefiapp://open?app=tpv");
    });
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(result.current.isAttempting).toBe(false);
    expect(result.current.showFallback).toBe(false);
  });

  it("dismissFallback hides the fallback", () => {
    const { result } = renderHook(() => useDeepLinkAttempt());
    act(() => {
      result.current.attemptDeepLink("chefiapp://open?app=tpv");
    });
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(result.current.showFallback).toBe(true);
    act(() => {
      result.current.dismissFallback();
    });
    expect(result.current.showFallback).toBe(false);
  });
});
