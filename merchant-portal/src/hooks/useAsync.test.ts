/**
 * useAsync hook unit tests.
 * Phase 3 P0 Issue #4: Loading states.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAsync } from "./useAsync";

describe("useAsync", () => {
  it("starts with loading=false and error=null", () => {
    const { result } = renderHook(() => useAsync(async () => "ok"));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets loading=true during execution, then false after resolve", async () => {
    let resolve!: (v: string) => void;
    const fn = () =>
      new Promise<string>((r) => {
        resolve = r;
      });
    const { result } = renderHook(() => useAsync(fn));

    let executePromise: Promise<string | undefined>;
    act(() => {
      executePromise = result.current.execute();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolve("done");
      await executePromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("captures error and sets loading=false on rejection", async () => {
    const fn = async () => {
      throw new Error("oops");
    };
    const { result } = renderHook(() => useAsync(fn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("oops");
  });

  it("returns the resolved value", async () => {
    const fn = async (x: number) => x * 2;
    const { result } = renderHook(() => useAsync(fn));

    let returnValue: number | undefined;
    await act(async () => {
      returnValue = await result.current.execute(21);
    });

    expect(returnValue).toBe(42);
    expect(result.current.loading).toBe(false);
  });

  it("reset() clears error and loading state", async () => {
    const fn = async () => {
      throw new Error("fail");
    };
    const { result } = renderHook(() => useAsync(fn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("works with synchronous functions (wrapped in Promise.resolve)", async () => {
    const fn = (x: number) => x + 1;
    const { result } = renderHook(() => useAsync(fn));

    let returnValue: number | undefined;
    await act(async () => {
      returnValue = await result.current.execute(5);
    });

    expect(returnValue).toBe(6);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns undefined (not throw) when the function errors", async () => {
    const fn = async () => {
      throw new Error("silent");
    };
    const { result } = renderHook(() => useAsync(fn));

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.execute();
    });

    expect(returnValue).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });
});
