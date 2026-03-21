/**
 * Lead Scoring — Frontend-only model for commercial funnel.
 *
 * Scores:
 *   +10 pricing_view
 *   +20 demo_click (cta_demo_click)
 *   +15 upgrade_click
 *   +5  whatsapp_click (cta_whatsapp_click)
 *
 * If score > 40: flag lead as "hot".
 * Stored in localStorage.
 */

import type { CommercialEventName } from "./types";

const LEAD_SCORE_KEY = "chefiapp_commercial_lead_score";
const LEAD_HOT_FLAG_KEY = "chefiapp_commercial_lead_hot";

const EVENT_SCORES: Partial<Record<CommercialEventName, number>> = {
  pricing_view: 10,
  cta_demo_click: 20,
  upgrade_click: 15,
  cta_whatsapp_click: 5,
  enterprise_page_view: 10,
  enterprise_export_click: 20,
  enterprise_risk_view: 15,
  enterprise_upsell_click: 25,
  // enterprise_backend_missing: no score (tracked but not scored)
};

const HOT_THRESHOLD = 40;

export function getScoreForEvent(event: CommercialEventName): number {
  return EVENT_SCORES[event] ?? 0;
}

export function applyScore(event: CommercialEventName): number {
  const delta = getScoreForEvent(event);
  if (delta === 0) return getLeadScore();

  const next = getLeadScore() + delta;
  try {
    localStorage.setItem(LEAD_SCORE_KEY, String(next));
    if (next > HOT_THRESHOLD) {
      localStorage.setItem(LEAD_HOT_FLAG_KEY, "true");
    }
  } catch {
    // ignore
  }
  return next;
}

export function getLeadScore(): number {
  try {
    const raw = localStorage.getItem(LEAD_SCORE_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  } catch {
    return 0;
  }
}

export function isLeadHot(): boolean {
  try {
    return localStorage.getItem(LEAD_HOT_FLAG_KEY) === "true";
  } catch {
    return false;
  }
}

export function resetLeadScore(): void {
  try {
    localStorage.removeItem(LEAD_SCORE_KEY);
    localStorage.removeItem(LEAD_HOT_FLAG_KEY);
  } catch {
    // ignore
  }
}
