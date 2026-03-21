# Tracking Events Specification

> Commercial funnel tracking for ChefIApp country landings.
> Source of truth: `merchant-portal/src/commercial/tracking/`

---

## Overview

All commercial events share a common base shape and are discriminated by the `event` property.
Events are buffered in `localStorage` and optionally forwarded to a production provider (PostHog / GA4).

Feature flag: `VITE_COMMERCIAL_TRACKING_ENABLED` (default: `true` in dev, `false` in prod).

---

## Base Shape

Every event contains:

| Field             | Type                                 | Description                                    |
| ----------------- | ------------------------------------ | ---------------------------------------------- |
| `event`           | `CommercialEventName`                | Discriminant (see below)                       |
| `timestamp`       | `string` (ISO-8601)                  | When the event was captured                    |
| `country`         | `"br" \| "es" \| "gb" \| "us"`       | Country landing                                |
| `segment`         | `"small" \| "multi" \| "enterprise"` | Visitor segment                                |
| `landing_version` | `string`                             | `"country-v1"`, `"landing-v2"`, `"pricing-v1"` |
| `device`          | `"mobile" \| "tablet" \| "desktop"`  | UA-based detection                             |
| `path`            | `string`                             | `window.location.pathname`                     |

---

## Events

### 1. `page_view`

Fired on every country landing mount and when country/segment changes.

```json
{
  "event": "page_view",
  "timestamp": "2026-02-25T10:00:00.000Z",
  "country": "es",
  "segment": "small",
  "landing_version": "country-v1",
  "device": "mobile",
  "path": "/es"
}
```

**Trigger:** `useEffect` in `CountryLandingContent` on mount.

---

### 2. `cta_whatsapp_click`

Fired when a visitor clicks a WhatsApp CTA button.

| Extra Field | Type     | Description                                                     |
| ----------- | -------- | --------------------------------------------------------------- |
| `placement` | `string` | Where the CTA lives: `"hero"`, `"nav"`, `"footer"`, `"pricing"` |

```json
{
  "event": "cta_whatsapp_click",
  "country": "es",
  "segment": "small",
  "placement": "hero",
  "landing_version": "country-v1",
  "device": "desktop",
  "path": "/es",
  "timestamp": "2026-02-25T10:01:00.000Z"
}
```

**Trigger:** `onClick` handler in `WhatsAppCTA` component.

---

### 3. `cta_demo_click`

Fired when a visitor clicks a "Request Demo" / trial CTA.

```json
{
  "event": "cta_demo_click",
  "country": "gb",
  "segment": "enterprise",
  "landing_version": "country-v1",
  "device": "desktop",
  "path": "/gb",
  "timestamp": "2026-02-25T10:02:00.000Z"
}
```

**Trigger:** Any "Start free" or trial CTA click (future wiring).

---

### 4. `pricing_view`

Fired when the pricing section enters the viewport (IntersectionObserver, 30% threshold, once per page load).

| Extra Field | Type     | Description                                                           |
| ----------- | -------- | --------------------------------------------------------------------- |
| `plan`      | `string` | Which plan was in view: `"starter"`, `"pro"`, `"enterprise"`, `"all"` |

```json
{
  "event": "pricing_view",
  "country": "br",
  "segment": "small",
  "plan": "all",
  "landing_version": "country-v1",
  "device": "mobile",
  "path": "/br",
  "timestamp": "2026-02-25T10:03:00.000Z"
}
```

**Trigger:** `IntersectionObserver` in `PricingByCountry`.

---

## Storage

| Key                                   | Purpose                  | Max Size |
| ------------------------------------- | ------------------------ | -------- |
| `chefiapp_commercial_tracking_buffer` | Event queue (all events) | 500      |
| `chefiapp_commercial_leads`           | Captured lead payloads   | 50       |

---

## Provider Integration (Future)

The `CommercialTrackingService` exposes:

```ts
commercialTracking.registerProvider({
  track(event: CommercialEvent) {
    // Forward to PostHog, GA4, HubSpot, etc.
    posthog.capture(event.event, event);
  },
});
```

No external provider is required in the current phase. Events are console-logged in dev and buffered in localStorage.

---

## Debug

Visit `/debug/commercial` in any environment where tracking is enabled.
The debug page shows real-time events, buffer contents, captured leads, and allows firing test events.

### Funnel baseline (Phase 1)

The debug page now includes baseline KPI calculations from buffered events:

- `pageViews` → count of `page_view`
- `pricingViews` → count of `pricing_view`
- `ctaClicks` → count of `cta_demo_click`, `cta_whatsapp_click`, `pricing_conversion_click`
- `leadSubmits` → count of `lead_email_submit`

Derived conversion ratios:

- `pricingFromPage = pricingViews / pageViews`
- `ctaFromPricing = ctaClicks / pricingViews`
- `leadFromCta = leadSubmits / ctaClicks`
- `leadFromPage = leadSubmits / pageViews`

Implementation: `src/commercial/tracking/funnelMetrics.ts` and `commercialTracking.getFunnelMetrics()`.

### Funnel segmentation + snapshot (Phase 1.1)

The funnel engine now exposes segmented breakdowns from buffered events:

- `global`
- `byCountry`
- `bySegment`
- `byDevice`
- `bySource` (from `utm_source`, fallback `unknown`)
- `byCampaign` (from `utm_campaign`, fallback `unknown`)

Service API:

- `commercialTracking.getFunnelSegmentation()`
- `commercialTracking.getFunnelSnapshotCsv()`

CSV snapshot schema:

- `dimension,key,pageViews,pricingViews,ctaClicks,leadSubmits,conversionLeadFromPagePct`

Debug page:

- Shows quick segmented conversion view (`By Country`, `By Segment`)
- Supports one-click CSV export: **Export Funnel Snapshot CSV**

---

## Files

| File                                                   | Purpose                       |
| ------------------------------------------------------ | ----------------------------- |
| `src/commercial/tracking/types.ts`                     | Event & lead type definitions |
| `src/commercial/tracking/CommercialTrackingService.ts` | Singleton service             |
| `src/commercial/tracking/useCommercialTracking.ts`     | React hook                    |
| `src/commercial/tracking/buildLeadPayload.ts`          | CRM lead builder              |
| `src/commercial/tracking/flag.ts`                      | Feature flag                  |
| `src/commercial/tracking/detectDevice.ts`              | Device detection              |
| `src/commercial/tracking/index.ts`                     | Barrel export                 |
| `src/commercial/debug/CommercialDebugPage.tsx`         | Debug console page            |
