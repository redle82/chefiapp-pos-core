import { describe, expect, it } from "vitest";
import { extractInstallToken } from "./extractInstallToken";

describe("extractInstallToken", () => {
  it("returns raw token when plain token is provided", () => {
    expect(extractInstallToken("abc123-token")).toBe("abc123-token");
  });

  it("extracts token from full install URL", () => {
    expect(
      extractInstallToken("https://example.com/install?token=abc123-token"),
    ).toBe("abc123-token");
  });

  it("extracts and decodes token with encoded chars", () => {
    expect(
      extractInstallToken("https://example.com/install?token=abc%2B123%3D"),
    ).toBe("abc+123=");
  });
});
