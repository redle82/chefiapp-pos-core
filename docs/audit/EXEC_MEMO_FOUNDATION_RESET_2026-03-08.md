# ChefIApp POS CORE - Executive Memo (Foundation Reset)

**Date:** 2026-03-08
**Audience:** Founders, leadership, investors
**Version:** 1.0

## Executive Summary

ChefIApp POS CORE is visually advanced and functionally broad, but not yet production-safe on three foundational pillars:

1. tenant data isolation (PostgREST role + RLS enforcement),
2. durable transactional state (browser-memory kernel risk),
3. fiscal compliance path (current fiscal adapter is non-operational for legal issuance).

This is not a talent problem. It is a sequencing problem.
The team has demonstrated high delivery capacity and completed a full macro-PR decomposition (`#47` to `#98`) with operational closure discipline. The next value-maximizing move is to redirect that capacity from feature expansion to foundation hardening.

## What Is Working

- Merchant portal UI breadth and modularity.
- Core stack boot and integration infrastructure.
- Mature SQL/RPC patterns (idempotency, hash-chain-ready fiscal records, optimistic concurrency).
- Integration gateway quality (rate limiting, signature checks, webhook handling).
- Domain/infra layering trajectory (readers/writers separation and provider interfaces).

## What Is Not Yet Production-Ready

- Effective tenant isolation is not yet proven end-to-end in runtime path.
- Core business state durability is not yet guaranteed under browser crash/refresh scenarios.
- Fiscal flow is not yet integrated with certified legal issuance path.
- Critical confidence tests remain partially muted (`.skip` footprint indicates known blind spots).

## Business Risk if Unaddressed

- **Security risk:** potential cross-tenant data exposure.
- **Revenue/operations risk:** order/session state loss during real operations.
- **Legal/compliance risk:** inability to support lawful fiscal operation in target markets.
- **Execution risk:** adding features on weak foundations increases rework cost and incident probability.

## Strategic Decision (Recommended)

Adopt a **7-day foundation sprint** with temporary freeze on non-foundational feature expansion.

**Policy for the sprint window:**

- no new feature fronts unless directly tied to the 3 foundations,
- all effort routed to isolation, durability, observability, and proof tests,
- daily go/no-go checkpoints with objective evidence.

## Success Criteria to Re-open Expansion

Feature expansion resumes only after all criteria below are met:

1. **Tenant isolation proof:** cross-tenant negative tests pass in CI and staging.
2. **Durability proof:** state survives refresh/crash flows in critical sales paths.
3. **Critical tests re-enabled:** priority skipped tests reactivated and green.
4. **Observability baseline:** runtime errors and key failure signals visible in one dashboard.
5. **Fiscal plan signed:** certified provider path, owner, timeline, and cutover gates documented.

## Why This Is the Right Moment

The organization now has:

- operational discipline proven by macro decomposition closure,
- traceable governance artifacts,
- a cleaner execution lane.

This is the optimal point to convert technical strength into production reliability.

## Board-Level Ask

Approve a **Foundation Reset Window (7 days)** with explicit priority override.

Expected output:

- lower operational risk,
- higher confidence in go-live readiness,
- reduced long-term engineering cost per feature.

---

**Bottom line:** ChefIApp does not need a reinvention. It needs a strict sequencing correction.
Fix foundations now, then scale features with confidence.
