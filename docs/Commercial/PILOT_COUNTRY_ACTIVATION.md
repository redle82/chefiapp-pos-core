# Pilot Country Activation Plan

> 7-day sprint to activate the first commercial country.
> Candidates: **PT (Portugal)** or **ES (Spain)** — both EUR, both gateway-ready.

---

## Recommended Pilot: ES (Spain)

**Rationale:**

- Landing already live at `/es` with full localisation
- EUR currency = simpler Stripe setup
- WhatsApp number pre-configured (`34912345678`)
- Spanish copy reviewed and deployed
- Larger TAM than PT for initial validation

---

## Pre-Launch Checklist

| #   | Task                                                                 | Owner     | Status |
| --- | -------------------------------------------------------------------- | --------- | ------ |
| 1   | Validate `/es` landing renders correctly on mobile + desktop         | Eng       | ☐      |
| 2   | Replace placeholder WhatsApp number with real business number        | Ops       | ☐      |
| 3   | Configure WhatsApp Business auto-reply (greeting + away msg)         | Ops       | ☐      |
| 4   | Enable `VITE_COMMERCIAL_TRACKING_ENABLED=true` in production env     | Eng       | ☐      |
| 5   | Verify `/debug/commercial` shows events correctly in staging         | Eng       | ☐      |
| 6   | Set up Google Search Console for `chefiapp.com/es`                   | Marketing | ☐      |
| 7   | Submit sitemap with `/es` hreflang to Google                         | Marketing | ☐      |
| 8   | Verify GA4/PostHog measurement ID in env (if available)              | Eng       | ☐      |
| 9   | Review pricing in `PRICING_BY_CURRENCY.EUR` — confirm €29/59/99      | Product   | ☐      |
| 10  | Prepare 3 WhatsApp message templates (intro, follow-up, demo invite) | Sales     | ☐      |

---

## 7-Day Execution Plan

### Day 1 — Launch

| Task                          | Detail                                               |
| ----------------------------- | ---------------------------------------------------- |
| Deploy landing to production  | Merge `refactor/stack-2026-phases-1-4` with tracking |
| Announce internally           | Slack #commercial channel                            |
| Test WhatsApp flow end-to-end | Click CTA → WhatsApp opens → auto-reply works        |
| Baseline metrics capture      | Screenshot `/debug/commercial` — zero state          |

**Metrics to capture:**

- Total page_views on `/es`
- Device split (mobile vs desktop)
- WhatsApp CTA impressions vs clicks

---

### Day 2 — Organic Seed

| Task                                                                  | Detail        |
| --------------------------------------------------------------------- | ------------- |
| Share landing URL in 3 relevant restaurant groups (Facebook/WhatsApp) | Ops/Marketing |
| Post on LinkedIn (company page)                                       | Marketing     |
| Check Google Search Console indexing status                           | Marketing     |
| Review Day 1 event buffer                                             | Eng           |

---

### Day 3 — Iterate Copy

| Task                                                  | Detail    |
| ----------------------------------------------------- | --------- |
| Analyse segment distribution (small/multi/enterprise) | Product   |
| A/B: try `?segment=multi` link in one channel         | Marketing |
| Fix any issues found in Day 1-2 tracking data         | Eng       |

---

### Day 4 — First Response Analysis

| Task                                                | Detail  |
| --------------------------------------------------- | ------- |
| Count WhatsApp conversations opened                 | Sales   |
| Classify leads: curious / serious / ready-to-trial  | Sales   |
| Review `pricing_view` vs `cta_whatsapp_click` ratio | Product |
| Adjust WhatsApp templates if needed                 | Sales   |

---

### Day 5 — Expand Reach

| Task                                               | Detail    |
| -------------------------------------------------- | --------- |
| Post in 3 more groups/channels                     | Marketing |
| Create short demo video (60s) for WhatsApp sharing | Product   |
| Send follow-up to Day 1-2 leads                    | Sales     |
| Check for any technical issues on mobile           | Eng       |

---

### Day 6 — Qualify & Score

| Task                                                           | Detail  |
| -------------------------------------------------------------- | ------- |
| Tag leads in spreadsheet: hot / warm / cold                    | Sales   |
| Identify top 3 leads for personalised demo                     | Sales   |
| Review full event funnel (page_view → pricing_view → whatsapp) | Product |
| Document conversion % per step                                 | Product |

---

### Day 7 — Retro & Decision

| Task                                                               | Detail     |
| ------------------------------------------------------------------ | ---------- |
| Pilot retro meeting (30 min)                                       | All        |
| Document: what worked, what didn't                                 | Product    |
| Decide: scale ES, pivot to PT, or iterate                          | Leadership |
| Set up Phase 2 plan (CRM integration, paid ads) if metrics justify | Product    |

---

## Key Metrics (captured, not invented)

Track these over the 7 days. Do not forecast — measure.

| Metric                        | Source                                   | How                                                       |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| Total page_view count         | localStorage buffer / debug page         | `commercialTracking.getBufferByEvent("page_view").length` |
| Unique sessions (approx)      | Count distinct days in buffer timestamps | Manual                                                    |
| Device split                  | Group events by `device`                 | Debug page                                                |
| Segment distribution          | Group events by `segment`                | Debug page                                                |
| Pricing section views         | `pricing_view` count                     | Buffer                                                    |
| WhatsApp CTA clicks           | `cta_whatsapp_click` count               | Buffer                                                    |
| WhatsApp conversations opened | WhatsApp Business dashboard              | Manual                                                    |
| Leads qualified               | Spreadsheet tag count                    | Manual                                                    |
| Click-to-conversation rate    | clicks / conversations                   | Calculated                                                |
| Page-to-click rate            | page_views / whatsapp_clicks             | Calculated                                                |

---

## Go/No-Go Criteria (end of Day 7)

| Signal                    | GO                     | NO-GO                      |
| ------------------------- | ---------------------- | -------------------------- |
| WhatsApp conversations    | ≥ 5 real conversations | 0 conversations            |
| Technical stability       | 0 tracking bugs        | Critical tracking failures |
| Landing renders correctly | All devices            | Broken on mobile           |
| Team confidence           | Ready to scale         | Need fundamental changes   |

**Note:** These are directional thresholds, not hard numbers. The goal of the pilot is learning, not revenue.

---

## Rollback Plan

If critical issues are found:

1. Set `VITE_COMMERCIAL_TRACKING_ENABLED=false` in prod env
2. Tracking becomes no-op — zero user impact
3. Landing pages continue to work (tracking is additive, not blocking)
4. Debug page shows "Tracking Disabled" message

---

## Post-Pilot Next Steps

If GO:

- [ ] Connect CRM webhook (Phase 2 of `CRM_LEAD_PAYLOAD_SPEC.md`)
- [ ] Register PostHog/GA4 provider in `CommercialTrackingService`
- [ ] Activate PT as second country
- [ ] Plan paid acquisition test (€50/day Google Ads for "TPV restaurante España")

If NO-GO:

- [ ] Document learnings in `docs/commercial/PILOT_RETRO_ES.md`
- [ ] Identify blockers and fix before next attempt
- [ ] Consider different pilot country or different channel (not WhatsApp)

---

## Files

| File                                           | Purpose           |
| ---------------------------------------------- | ----------------- |
| `docs/commercial/TRACKING_EVENTS_SPEC.md`      | Event definitions |
| `docs/commercial/CRM_LEAD_PAYLOAD_SPEC.md`     | Lead payload spec |
| `src/commercial/tracking/`                     | All tracking code |
| `src/commercial/debug/CommercialDebugPage.tsx` | Debug console     |
