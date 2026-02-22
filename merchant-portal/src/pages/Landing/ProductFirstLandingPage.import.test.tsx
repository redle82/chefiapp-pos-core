import { describe, expect, it, vi } from "vitest";

vi.mock("../../components/operational/OperationalFullscreenWrapper", () => ({
  OperationalFullscreenWrapper: ({ children }: { children: unknown }) =>
    children,
}));

vi.mock("../TPVMinimal/TPVMinimal", () => ({
  TPVMinimal: () => null,
}));

vi.mock("../../core/readiness/operationalRestaurant", () => ({
  get TRIAL_RESTAURANT_ID() {
    throw new Error("TRIAL_RESTAURANT_ID_ACCESSED_AT_MODULE_LOAD");
  },
}));

describe("ProductFirstLandingPage module loading", () => {
  it("does not read trial constants during module import", async () => {
    await expect(import("./ProductFirstLandingPage")).resolves.toBeDefined();
  });
});
