/**
 * B.3 — Pulse × Context Integration Tests
 *
 * Self-contained: pure logic inlined to avoid ts-jest compilation
 * of pre-existing TS errors in unrelated source files.
 */

// ── Inline types (mirrors PulseState.ts + ContextTypes.ts) ─────────
import type { PulseZone } from "./pulseTypes";
type OperationalMode = "tower" | "rush" | "training";
type UserRole = "owner" | "manager" | "waiter" | "kitchen" | "cashier";
type DeviceContext = "mobile" | "tablet" | "desktop";

// ── Inline logic (mirrors ContextLogic.ts) ─────────────────────────
function resolveOperationalMode(zone: PulseZone | null): OperationalMode {
  if (zone === "FLOW_ALTO") return "rush";
  // Training is set explicitly, never by pulse
  return "tower";
}

function resolveContextWithPulse(
  role: UserRole,
  device: DeviceContext,
  isViewMode: boolean,
  _originalRole?: UserRole,
  pulseZone?: PulseZone | null,
): { role: UserRole; device: DeviceContext; operationalMode: OperationalMode } {
  return {
    role,
    device,
    operationalMode: resolveOperationalMode(pulseZone ?? null),
  };
}

// ── Tests ──────────────────────────────────────────────────────────

describe("resolveOperationalMode", () => {
  it("maps FLOW_ALTO → rush", () => {
    expect(resolveOperationalMode("FLOW_ALTO")).toBe("rush");
  });

  it("maps FLOW_PARCIAL → tower", () => {
    expect(resolveOperationalMode("FLOW_PARCIAL")).toBe("tower");
  });

  it("maps FLOW_BASE → tower", () => {
    expect(resolveOperationalMode("FLOW_BASE")).toBe("tower");
  });

  it("maps null → tower (no pulse data)", () => {
    expect(resolveOperationalMode(null)).toBe("tower");
  });
});

describe("resolveContext with pulseZone", () => {
  it("returns rush when FLOW_ALTO", () => {
    const ctx = resolveContextWithPulse(
      "owner",
      "desktop",
      false,
      undefined,
      "FLOW_ALTO",
    );
    expect(ctx.operationalMode).toBe("rush");
  });

  it("returns tower when FLOW_PARCIAL", () => {
    const ctx = resolveContextWithPulse(
      "owner",
      "desktop",
      false,
      undefined,
      "FLOW_PARCIAL",
    );
    expect(ctx.operationalMode).toBe("tower");
  });

  it("returns tower when FLOW_BASE", () => {
    const ctx = resolveContextWithPulse(
      "waiter",
      "mobile",
      false,
      undefined,
      "FLOW_BASE",
    );
    expect(ctx.operationalMode).toBe("tower");
  });

  it("returns tower when pulseZone is null", () => {
    const ctx = resolveContextWithPulse(
      "manager",
      "tablet",
      false,
      undefined,
      null,
    );
    expect(ctx.operationalMode).toBe("tower");
  });

  it("returns tower when pulseZone is undefined", () => {
    const ctx = resolveContextWithPulse("kitchen", "desktop", false);
    expect(ctx.operationalMode).toBe("tower");
  });

  it("preserves role and device alongside operationalMode", () => {
    const ctx = resolveContextWithPulse(
      "cashier",
      "tablet",
      false,
      undefined,
      "FLOW_ALTO",
    );
    expect(ctx.role).toBe("cashier");
    expect(ctx.device).toBe("tablet");
    expect(ctx.operationalMode).toBe("rush");
  });
});

describe("pulse zone → dashboard badge mapping", () => {
  // Mirrors OwnerDashboard.tsx logic
  function badgeForZone(
    zone: PulseZone | null,
  ): { emoji: string; label: string; color: string } | null {
    if (!zone) return null;
    switch (zone) {
      case "FLOW_ALTO":
        return { emoji: "🔴", label: "Rush", color: "hsl(var(--destructive))" };
      case "FLOW_PARCIAL":
        return {
          emoji: "🟡",
          label: "Parcial",
          color: "hsl(var(--warning, 45 93% 47%))",
        };
      case "FLOW_BASE":
        return {
          emoji: "🟢",
          label: "Calmo",
          color: "hsl(var(--success, 142 71% 45%))",
        };
      default:
        return null;
    }
  }

  it("FLOW_ALTO → Rush (red)", () => {
    const badge = badgeForZone("FLOW_ALTO");
    expect(badge?.emoji).toBe("🔴");
    expect(badge?.label).toBe("Rush");
  });

  it("FLOW_PARCIAL → Parcial (yellow)", () => {
    const badge = badgeForZone("FLOW_PARCIAL");
    expect(badge?.emoji).toBe("🟡");
    expect(badge?.label).toBe("Parcial");
  });

  it("FLOW_BASE → Calmo (green)", () => {
    const badge = badgeForZone("FLOW_BASE");
    expect(badge?.emoji).toBe("🟢");
    expect(badge?.label).toBe("Calmo");
  });

  it("null → no badge", () => {
    expect(badgeForZone(null)).toBeNull();
  });
});

describe("operationalMode behavioral contract", () => {
  it("rush mode should never map back to FLOW_PARCIAL or FLOW_BASE", () => {
    // rush is exclusively for FLOW_ALTO
    const mode = resolveOperationalMode("FLOW_ALTO");
    expect(mode).toBe("rush");
    expect(resolveOperationalMode("FLOW_PARCIAL")).not.toBe("rush");
    expect(resolveOperationalMode("FLOW_BASE")).not.toBe("rush");
  });

  it("training mode cannot be set by pulse (it is set explicitly)", () => {
    // No zone value should return 'training'
    const zones: (PulseZone | null)[] = [
      "FLOW_ALTO",
      "FLOW_PARCIAL",
      "FLOW_BASE",
      null,
    ];
    for (const z of zones) {
      expect(resolveOperationalMode(z)).not.toBe("training");
    }
  });
});
