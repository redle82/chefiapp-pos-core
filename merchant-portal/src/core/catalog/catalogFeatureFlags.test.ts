import { describe, expect, it } from "vitest";
import {
    getCatalogFeatureFlags,
    isMenuV2QuickBuildEnabled,
    isMenuV2ShellEnabled,
    setCatalogFeatureFlagsForTests,
} from "./catalogFeatureFlags";

describe("catalogFeatureFlags", () => {
  it("enables menu v2 shell by default", () => {
    const flags = getCatalogFeatureFlags();

    expect(flags.menuV2Shell).toBe(true);
    expect(isMenuV2ShellEnabled()).toBe(true);
  });

  it("allows runtime override in tests", () => {
    setCatalogFeatureFlagsForTests({ menuV2Shell: false });

    expect(isMenuV2ShellEnabled()).toBe(false);

    setCatalogFeatureFlagsForTests({ menuV2Shell: true });
    expect(isMenuV2ShellEnabled()).toBe(true);
  });

  it("keeps quick build enabled by default and supports overrides", () => {
    expect(isMenuV2QuickBuildEnabled()).toBe(true);

    setCatalogFeatureFlagsForTests({ menuV2QuickBuild: false });
    expect(isMenuV2QuickBuildEnabled()).toBe(false);

    setCatalogFeatureFlagsForTests({ menuV2QuickBuild: true });
    expect(isMenuV2QuickBuildEnabled()).toBe(true);
  });
});
