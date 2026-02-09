/**
 * Kernel.compile() — Pure Unit Tests
 *
 * Tests the compile() method which converts an OnboardingDraft
 * into a SystemBlueprint with zero side-effects (no DB, no async).
 */

import { Kernel, type OnboardingDraft } from "../../core-engine/kernel/Kernel";

const BASE_DRAFT: OnboardingDraft = {
  userId: "user-1",
  userName: "João Silva",
  userRole: "Owner",
  restaurantName: "Tasca do João",
  city: "Lisboa",
  businessType: "Restaurant",
  teamSize: "1-5",
  operationMode: "Gamified",
  menuStrategy: "Quick",
};

describe("Kernel.compile()", () => {
  it("produces a valid blueprint from a complete draft", () => {
    const bp = Kernel.compile(BASE_DRAFT);

    expect(bp.meta.blueprintVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(bp.meta.environment).toBe("production");
    expect(bp.meta.tenantId).toBe("pending-generation");
    expect(bp.identity.userName).toBe("João Silva");
    expect(bp.identity.userRole).toBe("Owner");
    expect(bp.organization.restaurantName).toBe("Tasca do João");
    expect(bp.organization.city).toBe("Lisboa");
    expect(bp.organization.businessType).toBe("Restaurant");
    expect(bp.organization.realityStatus).toBe("DRAFT");
    expect(bp.operation.teamSize).toBe("1-5");
    expect(bp.operation.mode).toBe("Gamified");
    expect(bp.product.menuStrategy).toBe("Quick");
    expect(bp.boot.status).toBe("ready");
  });

  it("throws if restaurantName is missing", () => {
    const draft: OnboardingDraft = { ...BASE_DRAFT, restaurantName: undefined };
    expect(() => Kernel.compile(draft)).toThrow("Restaurant Name is required");
  });

  it('defaults userName to "Anonymous" when not provided', () => {
    const draft: OnboardingDraft = { ...BASE_DRAFT, userName: undefined };
    const bp = Kernel.compile(draft);
    expect(bp.identity.userName).toBe("Anonymous");
  });

  it('defaults userRole to "Owner" when not provided', () => {
    const draft: OnboardingDraft = { ...BASE_DRAFT, userRole: undefined };
    const bp = Kernel.compile(draft);
    expect(bp.identity.userRole).toBe("Owner");
  });

  it('defaults city to "Unknown" when not provided', () => {
    const draft: OnboardingDraft = { ...BASE_DRAFT, city: undefined };
    const bp = Kernel.compile(draft);
    expect(bp.organization.city).toBe("Unknown");
  });

  it('defaults businessType to "Restaurant" when not provided', () => {
    const draft: OnboardingDraft = { ...BASE_DRAFT, businessType: undefined };
    const bp = Kernel.compile(draft);
    expect(bp.organization.businessType).toBe("Restaurant");
  });

  it('defaults teamSize to "1-5" when not provided', () => {
    const draft: OnboardingDraft = { ...BASE_DRAFT, teamSize: undefined };
    const bp = Kernel.compile(draft);
    expect(bp.operation.teamSize).toBe("1-5");
  });

  it('defaults operationMode to "Gamified" when not provided', () => {
    const draft: OnboardingDraft = { ...BASE_DRAFT, operationMode: undefined };
    const bp = Kernel.compile(draft);
    expect(bp.operation.mode).toBe("Gamified");
  });

  it('defaults menuStrategy to "Quick" when not provided', () => {
    const draft: OnboardingDraft = { ...BASE_DRAFT, menuStrategy: undefined };
    const bp = Kernel.compile(draft);
    expect(bp.product.menuStrategy).toBe("Quick");
  });

  // ── UI Profile derivation ──────────────────────────────

  it("Gamified mode → vibrant theme + comfortable density", () => {
    const bp = Kernel.compile({ ...BASE_DRAFT, operationMode: "Gamified" });
    expect(bp.systemProfiles.uiProfile.theme).toBe("vibrant");
    expect(bp.systemProfiles.uiProfile.density).toBe("comfortable");
  });

  it("Executive mode → minimal theme + compact density", () => {
    const bp = Kernel.compile({ ...BASE_DRAFT, operationMode: "Executive" });
    expect(bp.systemProfiles.uiProfile.theme).toBe("minimal");
    expect(bp.systemProfiles.uiProfile.density).toBe("compact");
  });

  // ── Permission Profile derivation ──────────────────────

  it("Owner → canManageTeam + canEditMenu + isOwner", () => {
    const bp = Kernel.compile({ ...BASE_DRAFT, userRole: "Owner" });
    expect(bp.systemProfiles.permissionProfile).toEqual({
      canManageTeam: true,
      canEditMenu: true,
      isOwner: true,
    });
  });

  it("Manager → no canManageTeam, yes canEditMenu, not isOwner", () => {
    const bp = Kernel.compile({ ...BASE_DRAFT, userRole: "Manager" });
    expect(bp.systemProfiles.permissionProfile).toEqual({
      canManageTeam: false,
      canEditMenu: true,
      isOwner: false,
    });
  });

  it("Staff → no canManageTeam, no canEditMenu, not isOwner", () => {
    const bp = Kernel.compile({ ...BASE_DRAFT, userRole: "Staff" });
    expect(bp.systemProfiles.permissionProfile).toEqual({
      canManageTeam: false,
      canEditMenu: false,
      isOwner: false,
    });
  });

  // ── Meta fields ────────────────────────────────────────

  it("preserves tenantId from draft when provided", () => {
    const bp = Kernel.compile({ ...BASE_DRAFT, tenantId: "tenant-xyz" });
    expect(bp.meta.tenantId).toBe("tenant-xyz");
  });

  it("sets createdAt to a valid ISO date", () => {
    const before = new Date().toISOString();
    const bp = Kernel.compile(BASE_DRAFT);
    const after = new Date().toISOString();
    expect(bp.meta.createdAt >= before).toBe(true);
    expect(bp.meta.createdAt <= after).toBe(true);
  });

  // ── Boot defaults ─────────────────────────────────────

  it('boot starts with status "ready" and empty bootLog', () => {
    const bp = Kernel.compile(BASE_DRAFT);
    expect(bp.boot.status).toBe("ready");
    expect(bp.boot.bootLog).toEqual([]);
  });

  // ── Workflow profile ──────────────────────────────────

  it("always enables kitchen confirmation and table service", () => {
    const bp = Kernel.compile(BASE_DRAFT);
    expect(bp.systemProfiles.workflowProfile).toEqual({
      requireKitchenConfirmation: true,
      enableTableService: true,
    });
  });

  // ── Layout profile ───────────────────────────────────

  it("shows onboarding tasks and expanded sidebar by default", () => {
    const bp = Kernel.compile(BASE_DRAFT);
    expect(bp.systemProfiles.layoutProfile).toEqual({
      showOnboardingTasks: true,
      sidebarMode: "expanded",
    });
  });
});
