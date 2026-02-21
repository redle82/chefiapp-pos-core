
# RELEASE NOTES — v1.0.0 "The First Breath"
**Status**: SOVEREIGN RELEASE
**Date**: January 2026

## 🧊 The System is Frozen
ChefIApp POS Core has reached **Version 1.0.0**. 
The system is now considered a production-grade Financial Instrument.

### 🛡️ Core Capabilities (Verified)
- **The Airlock**: Anonymous Order Ingestion (Schema Hardened).
- **The Gatekeeper**: TPV Order Acceptance & Modification.
- **The Kitchen**: Digestion Pipeline (Prep -> Ready -> Served).
- **The Wallet**: Sovereign Payment Logic (Register Must Be Open, Idempotency Enforced).
- **The Brain**: Real-Time Financial Dashboard (Zero-Client-Calculation).

### 🔧 Hardening Highlights
- **Architecture**: `The Sovereign Code v1` (Architecture Contract).
- **Security**: 100% RLS Coverage on Public Tables.
- **Reliability**: RPC Ambiguity Resolved; Retry Logic in TPV; Optimistic UI with Rollback safety.
- **Performance**: Sub-100ms TPV Response on Local Network.

### 🚩 Known Constraints
- **Currency**: EUR Only (Hardcoded).
- **Timezone**: Lisbon/UTC (Implicit).
- **Payment Hardware**: Manual Entry Mode Only (No direct terminal integration yet).

### 📦 Deployment
- **Build**: `npm run build` (Strict Mode).
- **Environment**: Requires `.env.production` (See example).

---
*The machine breathes.*
