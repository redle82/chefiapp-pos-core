# RELEASE NOTES v1.0.0 — "TRUTH FREEZE"
**Date**: 2025-12-25
**Codename**: The Honest System

> "This release prioritizes operational truth over feature completeness."

## 🧊 Overview
Version 1.0.0 marks the establishment of the **ChefIApp Truth Layer**.
We have frozen the core architecture to guarantee that **"The UI is a Consequence of the Core"**. All critical operational paths (TPV) are now offline-first, resilient, and brutally honest about system state.

## 🏆 Key Highlights

### 1. The Offline Truth Engine
- **Unified Loop**: Online actions are now technically "Fast Offline" actions. There is only one path to the server: via the `OfflineQueue`.
- **Zero Optimistic Lies**: The UI never assumes success. It shows "Queued", then "Syncing", then "Applied" (or "Failed").
- **Automatic Reconciler**: The system automatically heals network gaps without user intervention.

### 2. TPV (Terminal Ponto de Venda)
- **Gold Standard UX**: The TPV is the reference implementation of the Truth Codex.
- **Deep Dark Aesthetic**: Use of the new Semantic Design Tokens for high-contrast visibility.
- **Observability Panel**: Instant insight into Queue Depth, Latency, and Backend Health.

### 3. Truth Safety & Transparency
- **Onboarding Gate**: The system refuses to onboard users if the Core is `DOWN` (503 Service Unavailable).
- **Setup Wizard**: Checks real backend connectivity before allowing a "Live" preview.
- **Explicit Failure**: When things break, we show a "Retry" button. We do not hide errors.

## ⚠️ Known Limitations (The Honest Scope)

We have explicitly chosen to mark certain peripheral features as **Previews** rather than risk shipping "Fake" features.

| Module | Status | Notes |
| :--- | :--- | :--- |
| **TPV** | ✅ **REAL** | Fully operational. Safe for business. |
| **Setup** | ✅ **REAL** | Persists data to Core API. |
| **AppStaff** | 🧪 **PREVIEW** | **Mock Data Only**. Does NOT save tasks/shifts. Labeled as Demo. |
| **Dashboard** | 🚧 **STATIC** | Shows template KPIs. Does not reflect real TPV sales yet. |
| **Public Page** | 🚧 **STATIC** | Shows template Menu. Does not load user menu yet. |

## 📜 The Truth Codex
This release complies with `SYSTEM_TRUTH_CODEX.md`.
- **Law 1**: UI is Consequence.
- **Law 2**: Online = Fast Offline.
- **Law 3**: Truth Zero (No Zombie UI).

---
*Signed,*
**AntiGravity Operator**
*Guardian of the Truth*
