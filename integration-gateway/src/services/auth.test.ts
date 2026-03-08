import { extractInternalToken } from "./auth";

describe("extractInternalToken", () => {
  test("returns bearer token when Authorization header is present", () => {
    const token = extractInternalToken({
      authorization: "Bearer test-bearer-token",
    });

    expect(token).toBe("test-bearer-token");
  });

  test("falls back to x-internal-token when Authorization is missing", () => {
    const token = extractInternalToken({
      "x-internal-token": "legacy-internal-token",
    });

    expect(token).toBe("legacy-internal-token");
  });

  test("prioritizes bearer token over x-internal-token when both are present", () => {
    const token = extractInternalToken({
      authorization: "Bearer preferred-token",
      "x-internal-token": "legacy-token",
    });

    expect(token).toBe("preferred-token");
  });

  test("returns null when headers do not carry an internal token", () => {
    const token = extractInternalToken({
      authorization: "Basic abc123",
    });

    expect(token).toBeNull();
  });

  test("supports Authorization header as array value", () => {
    const token = extractInternalToken({
      authorization: ["Bearer array-token"],
    });

    expect(token).toBe("array-token");
  });
});
