# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for ChefIApp OS.

ADRs document significant architectural decisions with their context, rationale,
and consequences. They serve as a historical record for the team.

## Index

### Platform & Infrastructure

| ADR | Title | Status |
|-----|-------|--------|
| [001](001-offline-first-with-sync-engine.md) | Offline-first with SyncEngine | Accepted |
| [002](002-supabase-as-backend.md) | Supabase as backend | Accepted |
| [003](003-rls-tenant-isolation.md) | RLS tenant isolation | Accepted |
| [004](004-domain-invariants-as-pure-functions.md) | Domain invariants as pure functions | Accepted |
| [005](005-escpos-via-webusb.md) | ESC/POS thermal printing via WebUSB | Accepted |
| [006](006-react-19-with-vite.md) | React 19 with Vite as frontend stack | Accepted |
| [007](007-payment-provider-adapter-pattern.md) | Payment provider adapter pattern | Accepted |

### Mobile & Surface-Specific

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](ADR-001-expo-over-capacitor.md) | Expo over Capacitor for mobile app | Accepted |
| [ADR-002](ADR-002-appstaff-v1-v2-scope-and-surface-authority.md) | AppStaff V1/V2 scope and surface authority | Accepted |

## Format

Each ADR follows a consistent structure:

```
# ADR-NNN: Title
## Status    -- Proposed | Accepted | Deprecated | Superseded
## Context   -- Why this decision was needed
## Decision  -- What we decided
## Consequences -- Positive and negative outcomes
```

## Adding a new ADR

1. Copy the template above
2. Use the next sequential number (currently: 008)
3. Keep it concise (one page maximum)
4. Update this index
