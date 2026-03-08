/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { isStandaloneMode } from "./standaloneMode";

describe("isStandaloneMode", () => {
  it("returns true when display-mode standalone is active", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true }) as typeof window.matchMedia;

    expect(isStandaloneMode()).toBe(true);

    window.matchMedia = originalMatchMedia;
  });

  it("returns false when no standalone markers are active", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: false }) as typeof window.matchMedia;

    expect(isStandaloneMode()).toBe(false);

    window.matchMedia = originalMatchMedia;
  });
});
