/**
 * contrastAudit — Color contrast audit for the dark theme.
 *
 * Documents all color combinations used in the POS dark theme,
 * checks WCAG 2.1 AA/AAA compliance, and provides fix suggestions.
 *
 * Run: import { runContrastAudit } from "./contrastAudit"; runContrastAudit();
 */

import { getContrastRatio, meetsContrastRequirement } from "./AccessibilityService";

export interface ContrastAuditEntry {
  /** Where this combination is used */
  context: string;
  /** Foreground color hex */
  fg: string;
  /** Background color hex */
  bg: string;
  /** Computed contrast ratio */
  ratio: number;
  /** Passes WCAG AA for normal text (4.5:1) */
  passesAA: boolean;
  /** Passes WCAG AAA for normal text (7:1) */
  passesAAA: boolean;
  /** Passes WCAG AA for large text (3:1) */
  passesAALarge: boolean;
  /** Suggested fix if failing AA */
  suggestion?: string;
}

/**
 * All color combinations used in the POS dark theme.
 * Each entry: [context, foreground, background].
 */
const COLOR_PAIRS: Array<[string, string, string]> = [
  // ── TPV Layout ──
  ["Body text on dark bg", "#fafafa", "#0a0a0a"],
  ["Muted text on dark bg", "#a1a1aa", "#0a0a0a"],
  ["Dim text on dark bg", "#71717a", "#0a0a0a"],
  ["Sidebar text inactive", "#737373", "#141414"],
  ["Sidebar text active (orange)", "#f97316", "#141414"],
  ["Section header text", "#525252", "#141414"],

  // ── TPV Header ──
  ["Restaurant name in header", "#fafafa", "#1a1a1a"],
  ["Staff ID text in header", "#737373", "#1a1a1a"],
  ["Search placeholder", "#737373", "#141414"],

  // ── Product Card ──
  ["Product name", "#fafafa", "#1e1e1e"],
  ["Product description", "#8a8a8a", "#1e1e1e"],
  ["Product price", "#fafafa", "#1e1e1e"],
  ["Original price strikethrough", "#666666", "#1e1e1e"],
  ["Cart icon default", "#a3a3a3", "#2a2a2a"],
  ["Stock badge unavailable", "#ffffff", "#ef4444"],
  ["Stock badge critical", "#1a1a1a", "#eab308"],

  // ── Order Summary Panel ──
  ["Cart item text", "#e4e4e7", "#18181b"],
  ["Subtotal label", "#a1a1aa", "#0a0a0a"],
  ["Total value", "#fafafa", "#0a0a0a"],

  // ── Modals (dark surface) ──
  ["Modal title (amber)", "#f59e0b", "#0a0a0a"],
  ["Modal muted text", "#a1a1aa", "#0a0a0a"],
  ["Modal dim text", "#71717a", "#0a0a0a"],
  ["Button text on amber", "#000000", "#f59e0b"],
  ["Button text on green", "#ffffff", "#10b981"],
  ["Button text on red", "#fecaca", "#ef4444"],

  // ── SplitBillModal ──
  ["Split total value (amber)", "#f59e0b", "#18181b"],
  ["Tab active text (amber on dark amber)", "#f59e0b", "#78350f"],
  ["Tab inactive text", "#a1a1aa", "#18181b"],
  ["Part card text", "#e4e4e7", "#18181b"],
  ["Part amount (amber)", "#f59e0b", "#18181b"],
  ["Paid status (green)", "#10b981", "#18181b"],
  ["Counter button text", "#e4e4e7", "#27272a"],

  // ── DiscountModal ──
  ["Discount preset text", "#d4d4d8", "#141414"],
  ["Discount preset selected", "#fafafa", "#431407"],
  ["Accent border text (orange on dark)", "#f97316", "#0a0a0a"],
  ["Input text", "#fafafa", "#141414"],

  // ── FiscalReceipt ──
  ["Receipt text on white", "#1a1a1a", "#ffffff"],
  ["Receipt muted on white", "#555555", "#ffffff"],
  ["Receipt faint on white", "#999999", "#ffffff"],
  ["Receipt footer on white", "#666666", "#ffffff"],

  // ── Notification Bell ──
  ["Notification text unread", "#e5e5e5", "#1a1a1a"],
  ["Notification text read", "#a3a3a3", "#1a1a1a"],
  ["Notification time", "#737373", "#1a1a1a"],
  ["Badge count white on red", "#ffffff", "#ef4444"],
  ["Mark all read (orange)", "#f97316", "#1a1a1a"],

  // ── Tip Modal ──
  ["Payment method selected text", "#ffffff", "#052e16"],
  ["Payment method unselected text", "#d4d4d8", "#18181b"],
  ["Confirm button text", "#ffffff", "#10b981"],

  // ── Exit Modal ──
  ["Exit modal title", "#fafafa", "#1a1a1a"],
  ["Exit modal body", "#737373", "#1a1a1a"],
  ["Exit cancel button", "#a3a3a3", "#1a1a1a"],
  ["Exit confirm button", "#0a0a0a", "#f97316"],
];

/**
 * Run a contrast audit on all documented color pairs.
 * Returns an array of audit entries with pass/fail status.
 */
export function runContrastAudit(): ContrastAuditEntry[] {
  return COLOR_PAIRS.map(([context, fg, bg]) => {
    const ratio = getContrastRatio(fg, bg);
    const passesAA = meetsContrastRequirement(fg, bg, "AA");
    const passesAAA = meetsContrastRequirement(fg, bg, "AAA");
    const passesAALarge = meetsContrastRequirement(fg, bg, "AA", true);

    let suggestion: string | undefined;
    if (!passesAA) {
      suggestion =
        `Ratio ${ratio.toFixed(2)}:1 fails AA (needs 4.5:1). ` +
        `Try a lighter foreground or increase contrast.`;
    }

    return {
      context,
      fg,
      bg,
      ratio: Math.round(ratio * 100) / 100,
      passesAA,
      passesAAA,
      passesAALarge,
      suggestion,
    };
  });
}

/**
 * Get only failing entries (not meeting AA for normal text).
 */
export function getContrastFailures(): ContrastAuditEntry[] {
  return runContrastAudit().filter((entry) => !entry.passesAA);
}

/**
 * Print a formatted audit report to the console (dev tool).
 */
export function printContrastAuditReport(): void {
  const entries = runContrastAudit();
  const failures = entries.filter((e) => !e.passesAA);
  const passes = entries.filter((e) => e.passesAA);

  console.group("WCAG 2.1 Contrast Audit Report");
  console.log(`Total pairs: ${entries.length}`);
  console.log(`Passing AA: ${passes.length}`);
  console.log(`Failing AA: ${failures.length}`);

  if (failures.length > 0) {
    console.group("Failures");
    for (const f of failures) {
      console.warn(
        `${f.context}: ${f.fg} on ${f.bg} = ${f.ratio}:1 ` +
          `(AA: ${f.passesAA ? "PASS" : "FAIL"}, Large: ${f.passesAALarge ? "PASS" : "FAIL"})` +
          (f.suggestion ? ` -- ${f.suggestion}` : ""),
      );
    }
    console.groupEnd();
  }

  console.groupEnd();
}
