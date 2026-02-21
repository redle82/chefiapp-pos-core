import { describe, expect, it } from "vitest";
import { isMockAuthEnabled } from "./mockAuthGate";

describe("isMockAuthEnabled", () => {
  it("returns false when not in dev", () => {
    expect(
      isMockAuthEnabled({ DEV: false, VITE_ALLOW_MOCK_AUTH: "true" }),
    ).toBe(false);
  });

  it("returns false when allow flag is missing", () => {
    expect(isMockAuthEnabled({ DEV: true })).toBe(false);
  });

  it("returns true when dev and allow flag is true", () => {
    expect(isMockAuthEnabled({ DEV: true, VITE_ALLOW_MOCK_AUTH: "true" })).toBe(
      true,
    );
  });

  it("accepts numeric allow flag", () => {
    expect(isMockAuthEnabled({ DEV: true, VITE_ALLOW_MOCK_AUTH: "1" })).toBe(
      true,
    );
  });
});
