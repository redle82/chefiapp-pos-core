import { sanitize } from "../../../../merchant-portal/src/core/logger/sanitizer/DataSanitizer";

describe("DataSanitizer", () => {
  it("should redact sensitive keys", () => {
    const data = { username: "john", password: "secret123", token: "abc" };
    const result = sanitize(data) as Record<string, unknown>;
    expect(result.username).toBe("john");
    expect(result.password).toBe("[REDACTED]");
    expect(result.token).toBe("[REDACTED]");
  });

  it("should handle nested objects", () => {
    const data = { user: { name: "john", apiKey: "xyz" } };
    const result = sanitize(data) as Record<string, unknown>;
    expect((result.user as any).name).toBe("john");
  });

  it("should return primitives unchanged", () => {
    expect(sanitize(null as any)).toBeNull();
    expect(sanitize(undefined as any)).toBeUndefined();
    expect(sanitize(42 as any)).toBe(42);
  });
});
