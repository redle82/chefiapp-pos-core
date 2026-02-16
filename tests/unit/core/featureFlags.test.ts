jest.mock("../../../merchant-portal/src/core/infra/featureFlags", () => {
  return jest.requireActual("../../../merchant-portal/src/core/infra/featureFlags");
});

import {
  featureFlagManager,
  isFeatureEnabled,
  isCognitiveLayerEnabled,
  disableCognitiveLayer,
  enableCognitiveLayer,
} from "../../../merchant-portal/src/core/infra/featureFlags";

describe("featureFlags", () => {
  it("should have cognitive layer disabled by default", () => {
    expect(isCognitiveLayerEnabled()).toBe(false);
  });

  it("should have operational flags enabled by default", () => {
    expect(isFeatureEnabled("ENABLE_EVENT_RETRY")).toBe(true);
    expect(isFeatureEnabled("ENABLE_DEAD_LETTER_QUEUE")).toBe(true);
  });

  it("should toggle cognitive layer", () => {
    enableCognitiveLayer();
    expect(isCognitiveLayerEnabled()).toBe(true);
    disableCognitiveLayer();
    expect(isCognitiveLayerEnabled()).toBe(false);
  });

  it("should notify listeners on flag change", () => {
    const listener = jest.fn();
    const unsub = featureFlagManager.subscribe(listener);
    featureFlagManager.set("ENABLE_REALTIME_EVENTS", true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ ENABLE_REALTIME_EVENTS: true }),
    );
    unsub();
  });

  it("should return all flags via getAll", () => {
    const all = featureFlagManager.getAll();
    expect(all).toHaveProperty("ENABLE_COGNITIVE_LAYER");
    expect(all).toHaveProperty("ENABLE_EVENT_RETRY");
  });
});
