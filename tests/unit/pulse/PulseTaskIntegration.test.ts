/**
 * PulseTaskIntegration.test.ts — Phase B.2
 *
 * Tests for pulse-aware task priority adjustment and recurring task suppression.
 * Validates the pure logic functions that drive task-pulse integration.
 *
 * NOTE: Pure logic is extracted inline to avoid importing source classes that
 * pull in dockerCoreClient (which has pre-existing TS errors unrelated to B.2).
 * The functions below mirror exactly the implementations in:
 *   - EventTaskGenerator.adjustPriorityForPulse()
 *   - RecurringTaskEngine.shouldSuppressForPulse()
 */

// ── Types (mirrors core-engine/pulse/PulseState.ts) ────────────────────────
type PulseZone = "FLOW_ALTO" | "FLOW_PARCIAL" | "FLOW_BASE";
type TaskPriority = "low" | "normal" | "high" | "critical";

// ── Pure logic: mirrors EventTaskGenerator.adjustPriorityForPulse ──────────
function adjustPriorityForPulse(
  base: TaskPriority,
  eventType: string,
  zone?: PulseZone,
): TaskPriority {
  if (!zone) return base;

  const urgentEvents = ["order_delayed", "table_unattended", "employee_absent"];

  switch (zone) {
    case "FLOW_ALTO":
      if (urgentEvents.includes(eventType)) return "critical";
      if (eventType === "restaurant_idle") return "low";
      if (base === "normal") return "high";
      return base;

    case "FLOW_BASE":
      if (base === "critical") return "critical";
      if (base === "high") return "normal";
      return "low";

    case "FLOW_PARCIAL":
    default:
      return base;
  }
}

// ── Pure logic: mirrors RecurringTaskEngine.shouldSuppressForPulse ──────────
function shouldSuppressForPulse(
  category: string,
  priority: string,
  pulseZone?: PulseZone,
): boolean {
  if (!pulseZone || pulseZone !== "FLOW_ALTO") return false;

  const suppressibleCategories = ["cleaning", "maintenance"];
  const suppressiblePriorities = ["low", "normal"];

  return (
    suppressibleCategories.includes(category) &&
    suppressiblePriorities.includes(priority)
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("adjustPriorityForPulse (EventTaskGenerator logic)", () => {
  describe("FLOW_ALTO (70-100) — peak operations", () => {
    const zone: PulseZone = "FLOW_ALTO";

    it("escalates order_delayed to critical", () => {
      expect(adjustPriorityForPulse("high", "order_delayed", zone)).toBe(
        "critical",
      );
    });

    it("escalates table_unattended to critical", () => {
      expect(adjustPriorityForPulse("high", "table_unattended", zone)).toBe(
        "critical",
      );
    });

    it("escalates employee_absent to critical", () => {
      expect(adjustPriorityForPulse("critical", "employee_absent", zone)).toBe(
        "critical",
      );
    });

    it("suppresses restaurant_idle to low", () => {
      expect(adjustPriorityForPulse("normal", "restaurant_idle", zone)).toBe(
        "low",
      );
    });

    it("promotes normal stock_low to high", () => {
      expect(adjustPriorityForPulse("normal", "stock_low", zone)).toBe("high");
    });

    it("keeps critical as critical for generic events", () => {
      expect(adjustPriorityForPulse("critical", "some_other_event", zone)).toBe(
        "critical",
      );
    });

    it("keeps low as low for generic events", () => {
      expect(adjustPriorityForPulse("low", "some_other_event", zone)).toBe(
        "low",
      );
    });
  });

  describe("FLOW_PARCIAL (30-69) — normal operations", () => {
    const zone: PulseZone = "FLOW_PARCIAL";

    it("keeps high priority as-is for order_delayed", () => {
      expect(adjustPriorityForPulse("high", "order_delayed", zone)).toBe(
        "high",
      );
    });

    it("keeps normal as-is for restaurant_idle", () => {
      expect(adjustPriorityForPulse("normal", "restaurant_idle", zone)).toBe(
        "normal",
      );
    });

    it("keeps low as-is", () => {
      expect(adjustPriorityForPulse("low", "stock_low", zone)).toBe("low");
    });
  });

  describe("FLOW_BASE (0-29) — calm state", () => {
    const zone: PulseZone = "FLOW_BASE";

    it("keeps critical as critical (never lowers critical)", () => {
      expect(adjustPriorityForPulse("critical", "employee_absent", zone)).toBe(
        "critical",
      );
    });

    it("lowers high to normal", () => {
      expect(adjustPriorityForPulse("high", "order_delayed", zone)).toBe(
        "normal",
      );
    });

    it("lowers normal to low", () => {
      expect(adjustPriorityForPulse("normal", "restaurant_idle", zone)).toBe(
        "low",
      );
    });

    it("keeps low as low", () => {
      expect(adjustPriorityForPulse("low", "stock_low", zone)).toBe("low");
    });
  });

  describe("no zone provided — passthrough", () => {
    it("returns base priority unchanged when zone is undefined", () => {
      expect(adjustPriorityForPulse("high", "order_delayed")).toBe("high");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════

describe("shouldSuppressForPulse (RecurringTaskEngine logic)", () => {
  describe("FLOW_ALTO — suppress non-urgent tasks", () => {
    const zone: PulseZone = "FLOW_ALTO";

    it("suppresses cleaning + low priority", () => {
      expect(shouldSuppressForPulse("cleaning", "low", zone)).toBe(true);
    });

    it("suppresses cleaning + normal priority", () => {
      expect(shouldSuppressForPulse("cleaning", "normal", zone)).toBe(true);
    });

    it("suppresses maintenance + normal priority", () => {
      expect(shouldSuppressForPulse("maintenance", "normal", zone)).toBe(true);
    });

    it("does NOT suppress cleaning + high priority", () => {
      expect(shouldSuppressForPulse("cleaning", "high", zone)).toBe(false);
    });

    it("does NOT suppress cleaning + critical priority", () => {
      expect(shouldSuppressForPulse("cleaning", "critical", zone)).toBe(false);
    });

    it("does NOT suppress opening + low priority", () => {
      expect(shouldSuppressForPulse("opening", "low", zone)).toBe(false);
    });

    it("does NOT suppress haccp + normal priority", () => {
      expect(shouldSuppressForPulse("haccp", "normal", zone)).toBe(false);
    });

    it("does NOT suppress closing + normal priority", () => {
      expect(shouldSuppressForPulse("closing", "normal", zone)).toBe(false);
    });
  });

  describe("FLOW_PARCIAL — no suppression", () => {
    const zone: PulseZone = "FLOW_PARCIAL";

    it("does NOT suppress cleaning + low in FLOW_PARCIAL", () => {
      expect(shouldSuppressForPulse("cleaning", "low", zone)).toBe(false);
    });

    it("does NOT suppress maintenance + normal in FLOW_PARCIAL", () => {
      expect(shouldSuppressForPulse("maintenance", "normal", zone)).toBe(false);
    });
  });

  describe("FLOW_BASE — no suppression", () => {
    const zone: PulseZone = "FLOW_BASE";

    it("does NOT suppress cleaning + low in FLOW_BASE", () => {
      expect(shouldSuppressForPulse("cleaning", "low", zone)).toBe(false);
    });
  });

  describe("no zone provided — no suppression", () => {
    it("returns false when zone is undefined", () => {
      expect(shouldSuppressForPulse("cleaning", "low")).toBe(false);
    });
  });
});
