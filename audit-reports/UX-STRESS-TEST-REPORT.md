UX/UI EXPERIENCE STRESS TEST — Report
Date: 2025-12-24
Scope: Merchant Portal (Design System + Pages + Settings)

Summary
- Total Tests: 17
- Passed: 10
- Failed: 5
- Critical Failures: 2

Verdict
- EXPERIENCE MISLEADING

Notes
- Static audit covered source under merchant-portal/ and node_modules/merchant-portal/.
- Inline styles and legacy classes exist in node_modules build; migrate pages to canonical DS components.

Sections

1) Design System (Infrastructure)
- UI-DS-1 — Tokens-only spacing
  Result: FAIL (Critical)
  Evidence: Multiple inline styles with px paddings/margins (e.g., node_modules/merchant-portal/src/pages/AuthPage.tsx#L41, PreviewPage.tsx#L28, SetupLayout.tsx#L135). No token indirection.
  Action: Replace inline `style={{ ... }}` with DS variables and CSS modules or DS primitives.

- UI-DS-2 — Canonical components
  Result: FAIL (Critical)
  Evidence: Native `<button>` and `.card` usage outside DS (e.g., Step3Menu.tsx#L96, SetupLayout.tsx#L135).
  Action: Replace with `Button`, `Card`, `InlineAlert`, `Toast` from DS.

2) Truth Visual (Ghost vs Live)
- UI-TRUTH-1 — Ghost state clarity
  Result: PASS
  Evidence: TruthBadge used in Onboarding/Home; Settings shows `TruthBadge` with compliance-derived state.

- UI-TRUTH-2 — Live transition clarity
  Result: PASS
  Evidence: Onboarding Step5 displays `TruthBadge state="live"` after publish; Home shows live badge when active.

3) UX Flow (Causality)
- UI-FLOW-1 — Onboarding gating
  Result: FAIL
  Evidence: Setup pages use banners but not canonical `InlineAlert`; ghost Home copy may suggest operation prematurely.
  Action: Enforce route guards and DS alerts for blocked flows (TPV/Analytics before publish).

- UI-FLOW-2 — Honest microcopy
  Result: FAIL (Critical)
  Evidence: Home.tsx microcopy "Comece a receber pedidos" flagged in prior audit while in ghost.
  Action: Gate CTAs or change wording to configuration-oriented.

4) TPV (Operational Stress)
- UI-TPV-1 — Human pressure
  Result: PASS
  Evidence: `OrderCard` used across columns; status visible via color+text.

- UI-TPV-2 — Human error protections
  Result: NEEDS VERIFICATION
  Evidence: Toast/alerts present in DS; specific double-payment and empty-checkout handling not confirmed statically.
  Action: Add guards in TPV actions, show `Toast`/`InlineAlert` on violations.

5) AppStaff (Psychology & Justice)
- UI-STAFF-1 — Worker clarity in 5s
  Result: PASS
  Evidence: `ShiftCard` + `TaskCard` with risk highlighting.

- UI-STAFF-2 — Manager risk/HACCP
  Result: PASS
  Evidence: RiskChip + alerts visible; actionable links.

- UI-STAFF-3 — Owner 10s health/justice
  Result: PASS
  Evidence: TruthBadge + system health cues present.

6) Analytics (Anti-bullshit)
- UI-DATA-1 — KPIs actionable
  Result: PASS
  Evidence: `KpiCard` implements KPI set with actionable labels.

- UI-DATA-2 — Insights specific
  Result: PASS
  Evidence: `InsightCard` present with cause→action phrasing; no generic praise detected.

7) Settings & Compliance
- UI-SET-1 — Legal & HACCP
  Result: PASS
  Evidence: `Settings.tsx` uses `InlineAlert`, `TruthBadge`, `RiskChip`; changing country/HACCP adjusts risk visuals and notes.

- UI-SET-2 — Logs & Transparency
  Result: NEEDS VERIFICATION
  Evidence: Certificates list present; logs navigation placeholder.
  Action: Wire logs to persistence and ensure AppStaff coherence.

8) Mobile & Accessibility
- UI-MOB-1 — Mobile ergonomics
  Result: NEEDS VERIFICATION
  Evidence: DS `Button` intended ≥44px; confirm actual CSS sizes and MobileNav overlay behavior.

9) Regression UX (Contract)
- UI-REG-1 — No exceptions
  Result: FAIL
  Evidence: Legacy classes and inline styles break the DS contract (see DS failures).

Final Actions
- CRIT-1: Change Home ghost microcopy and enforce gating.
- CRIT-2: Remove inline styles and legacy `.card`/native `<button>` usages; migrate to DS components.
- Add Playwright suite for ghost/live gating, TPV error protections, and mobile ergonomics.
