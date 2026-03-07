import { describe, expect, it } from "vitest";
import { resolveOperatorId, resolveOperatorProfile } from "./operatorIdentity";

describe("resolveOperatorId", () => {
  it("returns null when auth user is missing", () => {
    expect(resolveOperatorId(null)).toBeNull();
    expect(resolveOperatorId(undefined)).toBeNull();
  });

  it("returns user id when available", () => {
    expect(resolveOperatorId({ id: "user-123" } as any)).toBe("user-123");
  });
});

describe("resolveOperatorProfile", () => {
  it("prefers metadata name and email for id", () => {
    const profile = resolveOperatorProfile({
      id: "user-123",
      email: "owner@chef.test",
      user_metadata: {
        name: "Owner Admin",
        avatar_url: "https://cdn.example/avatar.png",
      },
    });

    expect(profile.name).toBe("Owner Admin");
    expect(profile.id).toBe("owner@chef.test");
    expect(profile.avatarUrl).toBe("https://cdn.example/avatar.png");
  });

  it("falls back gracefully when auth data is incomplete", () => {
    const profile = resolveOperatorProfile({
      id: "user-999",
      email: "",
      user_metadata: { name: "   " },
    });

    expect(profile.name).toBe("Operador");
    expect(profile.id).toBe("user-999");
    expect(profile.avatarUrl).toBeNull();
  });
});
