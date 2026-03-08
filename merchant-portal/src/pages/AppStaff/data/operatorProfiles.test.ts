import { describe, expect, it } from "vitest";
import { getOperatorProfile, TRIAL_GUIDE_CODES } from "./operatorProfiles";

describe("operatorProfiles", () => {
  it("uses Comandante as the AppStaff owner persona with a dedicated code", () => {
    expect(getOperatorProfile("owner")?.name).toBe("Comandante");
    expect(TRIAL_GUIDE_CODES.owner).toBe("CHEF-CMDT-MOCK");
  });
});
