import { describe, expect, it } from "vitest";

describe("OSCopy", () => {
  it("resolves canonical currency labels without runtime reference errors", async () => {
    const mod = await import("./OSCopy");

    expect(mod.OSCopy.landing.whatHappensNext).toContain("79 €");
    expect(mod.OSCopy.menu.labels.price).toContain("(€)");
  });
});
