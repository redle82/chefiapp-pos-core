/**
 * buildLeadPayload — Builds a CRM-ready lead object from commercial context.
 *
 * Called when a conversion event happens (WhatsApp click, demo request).
 * The payload is designed to be JSON-serialisable and ready for future
 * CRM integration (HubSpot, Pipedrive, Notion, custom webhook, etc.).
 *
 * Ref: docs/commercial/CRM_LEAD_PAYLOAD_SPEC.md
 */

import type { CountryCode } from "../../landings/countries";
import type { Segment } from "../../landings/countryCopy";
import { commercialTracking } from "./CommercialTrackingService";
import { detectDevice } from "./detectDevice";
import { getUtmParams } from "./getUtmParams";
import type { LeadPayload } from "./types";

export interface BuildLeadOptions {
  country: CountryCode;
  segment: Segment;
  source: "whatsapp" | "demo_request" | "lead_email";
  landing_version: string;
  conversion_path: string;
  /** For WhatsApp CTAs — button placement */
  placement?: string;
  /** Email (for lead_email source) */
  email?: string;
}

/**
 * Build a lead payload from the current browser context + options.
 * Safe in SSR (graceful degradation for missing window APIs).
 */
export function buildLeadPayload(opts: BuildLeadOptions): LeadPayload {
  const sessionEvents = commercialTracking.getBufferCount();
  const utm = typeof window !== "undefined" ? getUtmParams() : {};

  return {
    created_at: new Date().toISOString(),
    email: opts.email,
    country: opts.country,
    segment: opts.segment,
    source: opts.source,
    landing_version: opts.landing_version,
    device: detectDevice(),
    conversion_path: opts.conversion_path,
    placement: opts.placement,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    session_event_count: sessionEvents,
  };
}

/**
 * Convenience: build + log to console (dev) + return payload.
 * In production, a future integration will POST this to a CRM endpoint.
 */
export function captureLeadPayload(opts: BuildLeadOptions): LeadPayload {
  const payload = buildLeadPayload(opts);

  if (import.meta.env.DEV) {
    console.info(
      "%c[commercial:lead]",
      "color:#f59e0b;font-weight:bold",
      payload,
    );
  }

  // Buffer lead locally for debug page visibility
  try {
    const key = "chefiapp_commercial_leads";
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
    existing.push(payload);
    // Keep last 50 leads
    localStorage.setItem(key, JSON.stringify(existing.slice(-50)));
  } catch {
    // ignore
  }

  return payload;
}

/**
 * Read buffered leads from localStorage (for debug page).
 */
export function getBufferedLeads(): LeadPayload[] {
  try {
    const raw = localStorage.getItem("chefiapp_commercial_leads");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Clear buffered leads.
 */
export function clearBufferedLeads(): void {
  try {
    localStorage.removeItem("chefiapp_commercial_leads");
  } catch {
    // ignore
  }
}
