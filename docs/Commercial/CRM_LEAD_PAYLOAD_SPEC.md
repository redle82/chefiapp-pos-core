# CRM Lead Payload Specification

> Standardised lead object for ChefIApp commercial funnel.
> Source of truth: `merchant-portal/src/commercial/tracking/buildLeadPayload.ts`

---

## Overview

When a visitor performs a conversion action (WhatsApp click, demo request), the system builds a `LeadPayload` object that captures all context needed for future CRM integration.

Leads are currently buffered in `localStorage` for debug visibility.
When a CRM provider (HubSpot, Pipedrive, Notion, custom webhook) is connected, the same payload is POSTed.

---

## Lead Object Schema

```typescript
interface LeadPayload {
  created_at: string; // ISO-8601
  country: CountryCode; // "br" | "es" | "gb" | "us"
  segment: Segment; // "small" | "multi" | "enterprise"
  source: "whatsapp" | "demo_request";
  landing_version: string; // "country-v1", "landing-v2", etc.
  device: "mobile" | "tablet" | "desktop";
  conversion_path: string; // pathname where conversion happened
  placement?: string; // WhatsApp CTA placement (hero, nav, etc.)
  user_agent: string; // raw navigator.userAgent
  referrer: string; // document.referrer
  session_event_count: number; // events before conversion
}
```

---

## Example Payload

```json
{
  "created_at": "2026-02-25T14:30:00.000Z",
  "country": "es",
  "segment": "small",
  "source": "whatsapp",
  "landing_version": "country-v1",
  "device": "mobile",
  "conversion_path": "/es",
  "placement": "hero",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 ...) ...",
  "referrer": "https://www.google.com/",
  "session_event_count": 4
}
```

---

## Fields Detail

### `country`

ISO-like code from the URL path segment. Determines locale, currency, and WhatsApp number.

### `segment`

Derived from `?segment=` query param. Defaults to `"small"`. Affects hero copy and pricing emphasis.

### `source`

How the lead was captured:

- `"whatsapp"` — Clicked a WhatsApp CTA (opens wa.me)
- `"demo_request"` — Clicked a "Request Demo" or similar CTA

### `landing_version`

Identifies which landing page variant was active. Useful for A/B testing attribution.

### `session_event_count`

Number of tracking events buffered before this conversion. Higher count = more engaged visitor.

### `placement`

Only for `source: "whatsapp"`. Identifies which CTA was clicked:

- `"hero"` — Hero section CTA
- `"nav"` — Top navigation bar CTA
- `"footer"` — Footer CTA
- `"pricing"` — Pricing section CTA
- `"sticky"` — Sticky mobile CTA

### `user_agent` / `referrer`

Raw browser values for CRM enrichment. Not parsed client-side — let the CRM or backend parse them.

---

## Builder Functions

### `buildLeadPayload(opts)`

Pure function that builds the payload. No side effects.

### `captureLeadPayload(opts)`

Builds + logs (dev) + persists to localStorage buffer.

### `getBufferedLeads()`

Reads all captured leads from localStorage.

### `clearBufferedLeads()`

Clears the buffer.

---

## CRM Integration Plan (Future)

```
Phase 1 (current):  localStorage buffer + debug page
Phase 2:            Webhook POST to integration-gateway → Notion/HubSpot
Phase 3:            Real-time CRM with scoring + auto-assignment
```

### Phase 2 Integration Shape

```typescript
// integration-gateway endpoint (future)
POST /api/v1/commercial/leads
Content-Type: application/json

{
  ...LeadPayload,
  // Server adds:
  "lead_id": "uuid",
  "ip_country": "ES",
  "enriched_at": "2026-02-25T14:31:00.000Z"
}
```

---

## Storage

| Key                         | Purpose             | Max Items |
| --------------------------- | ------------------- | --------- |
| `chefiapp_commercial_leads` | Lead payload buffer | 50        |

---

## Debug

Captured leads are visible at `/debug/commercial` → "Captured Leads" section.

---

## Files

| File                                          | Purpose                              |
| --------------------------------------------- | ------------------------------------ |
| `src/commercial/tracking/types.ts`            | `LeadPayload` interface              |
| `src/commercial/tracking/buildLeadPayload.ts` | Builder + capture + buffer functions |
