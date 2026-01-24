# INTEGRITY ROADMAP (v1.1+)
**Status**: APPROVED STRATEGY
**Context**: Post-v1.0.0 "Truth Freeze"

This document outlines the strategic path to propagate the **Truth Layer** from the Core/TPV (Gold Standard) to the peripheral systems (Staff, Dashboard, Public).

---

## 🧭 The Mission: "Wiring the Shell"
In v1.0, we established the "Truth Core". In v1.1, we connect the "Outer Shell" to this core.

### Phase 1: AppStaff Integration (The Nervous System)
**Goal**: Transform `AppStaff` from a Visual Prototype into an Operational Tool.
- [ ] **ADR 005**: Define the `StaffOfflineQueue`.
- [ ] **Domain**: Move `Task` and `Shift` types to `@chefiapp/core`.
- [ ] **Wiring**: Replace `useState` mocks with `useOfflineQueue` hooks.
- [ ] **Safety**: Remove the "Preview" banner only when persistence is verified.

### Phase 2: Dashboard Reality (The Brain)
**Goal**: Make the Merchant Portal Dashboard reflect TPV reality.
- [ ] **Data**: Create `useMerchantMetrics` hook.
- [ ] **Sync**: Aggregate local TPV sales (via Reconciler events) to update Dashboard stats.
- [ ] **Truth**: Remove "Static Mock" data. Show "Waiting for Sync" if offline.

### Phase 3: Public Page Live (The Face)
**Goal**: Ensure `/@slug` renders the exact menu configured in Setup.
- [ ] **Data**: Connect `PublicPages.tsx` to `useMenu(slug)`.
- [ ] **Guard**: Redirect to 404 if merchant is not "Live".
- [ ] **Perf**: Implement ISR (Incremental Static Regeneration) or aggressive caching strategy.

---

## 🛡️ The Standard (Regression Policy)
As we expand, we must **never** violate the v1.0 Codex.

1.  **Online = Fast Offline**: AppStaff must work without internet.
2.  **UI is Consequence**: No optimistic lies in the Dashboard.
3.  **Observability**: Staff actions must appear in the TPV Timeline.

*The Truth grows concentric.*
