import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../events/EventStore", () => ({
  GlobalEventStore: {
    append: vi.fn().mockResolvedValue(undefined),
  },
}));

const getRecordLegalConsent = async () => {
  const module = await import("./legalConsent");
  return module.recordLegalConsent;
};

const RESTAURANT_ID = "11111111-1111-1111-1111-111111111111";

describe("recordLegalConsent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("persists consent and appends audit event", async () => {
    const recordLegalConsent = await getRecordLegalConsent();

    await recordLegalConsent({
      restaurantId: RESTAURANT_ID,
      source: "onboarding_ritual",
    });

    const stored = sessionStorage.getItem("chefiapp_legal_consent_v1");
    expect(stored).toBeTruthy();

    const parsed = stored ? JSON.parse(stored) : null;
    expect(parsed.restaurantId).toBe(RESTAURANT_ID);
    expect(parsed.source).toBe("onboarding_ritual");
    expect(parsed.termsUrl).toBe("/legal/terms");
    expect(parsed.privacyUrl).toBe("/legal/privacy");

    const { GlobalEventStore } = await import("../events/EventStore");
    expect(GlobalEventStore.append).toHaveBeenCalledTimes(1);
  });
});
