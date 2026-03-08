# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Detained Truth Layer (Truth Freeze)
**"The Honest System Release"**

### 🚀 Major Features
- **Grand Unification (Online = Fast Offline)**:
  - Removed all split logic between online/offline actions.
  - All Order/TPV actions now flow through: `Optimistic UI` -> `Offline Queue` -> `Reconciler` -> `API`.
  - Guarantees zero data loss and consistent behavior regardless of network status.
- **Truth Zero (Safe Harbor)**:
  - TPV explicitly allows offline actions ("Safe Harbor" principle).
  - Onboarding is strictly gated by `useCoreHealth` (No boarding a sinking ship).
- **Observability Panel**:
  - New "Truth Monitor" in TPV footer showing Queued/Syncing/Failed counts.
  - Per-order Timeline tracking lifecycle events (Enqueued, Sync Attempt, Backoff, Applied).
  - Real-time `CoreStatusBanner` (Sticky) when system is DOWN or DEGRADED.

### 🛡️ Architecture & Resilience
- **System Truth Codex**:
  - Added `SYSTEM_TRUTH_CODEX.md` as the supreme law of the repository.
- **Auto-Healing**:
  - `useOfflineReconciler` now features immediate "Push" on enqueue vs "Poll" on interval.
  - Intelligent Backoff strategy for retries.
- **Chaos Integration**:
  - Added Deterministic Chaos endpoints (`/__set`, `/__toggle`) for stable resilience testing.
- **Dynamic Health**:
  - Fixed `useCoreHealth` to switch polling intervals dynamically (5s DOWN / 30s UP).

### 🔒 Gates & Enforcement
- **CI Gate**: Added `.github/workflows/truth-gate.yml` blocking PRs if `test:truth` fails.
- **PR Template**: `pull_request_template.md` mandates Codex compliance check.
- **Truth Suite**: 6/6 Regression scenarios covering Onboarding, Offline, Reconciliation, and Backoff.

### 🎨 UI/UX
- **Truth Palette**: Added semantic tokens (`--status-down`, `--queue-syncing`) in `tokens.css`.
- **Kanban TPV**: Horizontal scroll layout with "Calm" density.
- **Visual Truth**: `OrderCard` visual states (Dashed=Queued, Pulsing=Syncing, Shake=Failed).

## [1.0.1] - Reality Seal (Revenue & Ops Connected)
**"First Sale Ready"**

### 💸 Revenue Wiring (Phase K)
- Public Ordering: `POST /public/:slug/orders` endpoint live.
- Web-to-POS Bridge with SHA256 integrity validation.
- Mock Stripe Gateway for Dev/Test environments.

### 🔄 Operations Loop (Phase L)
- Public Orders generate `staff_tasks` (Critical priority).
- AppStaff now polls real backend data (5s interval).
- Full loop verified: Client → Core → Staff.

### ✅ Status
- First sale technically possible.
- Stripe real keys required only for Production payments.

## [1.1.0] - (RESERVED)
**"Operational Intelligence"**

Planned:
- Dashboard KPIs wired to real TPV data.
- AppStaff fully offline-first (Queue + Reconciler).
- Refunds & partial cancellations.

---
*Signed off by Auditor A+ as "System Connected to Reality".*
