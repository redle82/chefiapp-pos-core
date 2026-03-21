# WS1 - Role Matrix and Tenant A/B Test Plan

**Date:** 2026-03-08  
**Workstream:** WS1 Security/RLS  
**Issue:** #99  
**Owner:** goldmonkey777

## Current Runtime Findings

- `docker-compose.yml` currently sets `PGRST_DB_ANON_ROLE` to `${POSTGRES_USER:-test_user}`.
- `docker-core/docker-compose.core.yml` currently sets `PGRST_DB_ANON_ROLE: postgres` with comment `no RLS for now`.
- `docker-core/schema/07-role-anon.sql` creates `anon`, `authenticated`, `service_role` roles.
- `docker-core/schema/04.6-auth-shims.sql` includes auth shims and grants for these roles.

Implication: runtime role posture is inconsistent with least-privilege tenant isolation.

## Target Role Matrix (Sprint)

| Runtime path | DB role used by PostgREST | Intended privilege model | RLS expectation |
|---|---|---|---|
| unauthenticated API | `anon` | minimum access, RLS constrained | strict tenant denial by default |
| authenticated user API | `authenticated` | tenant-scoped access only | tenant allow + cross-tenant deny |
| internal trusted ops | `service_role` | explicit controlled bypass for ops/RPC | limited to specific internal flows |

## Configuration Delta to Apply (D1-D2)

1. Set `PGRST_DB_ANON_ROLE=anon` in local compose.
2. Set `PGRST_DB_ANON_ROLE=anon` in core compose.
3. Ensure JWT claim mapping path can resolve authenticated role for protected requests.
4. Verify no broad grants keep `anon` effectively superuser-equivalent in critical tables.

## Tenant A/B Negative Test Plan

### Preconditions

- Two test tenants: `tenant_a`, `tenant_b`.
- Test data seeded for both tenants in core tables (`gm_orders`, `gm_sessions`, related entities).
- PostgREST restarted after config changes.

### Tests

1. `tenant_a` token reads `tenant_a` rows -> expected `200`, own rows only.
2. `tenant_a` token reads `tenant_b` row by ID -> expected `404/403` (no data leak).
3. `tenant_a` token updates `tenant_b` row -> expected deny.
4. `tenant_a` token inserts row with `restaurant_id=tenant_b` -> expected deny.
5. unauthenticated request against tenant-protected table -> expected deny/empty.
6. service role path executes approved internal RPC -> expected success only in approved endpoints.

### Evidence to Attach in #99

- curl/request snippets (request + response code + body excerpt),
- SQL verification query outputs for tenant partitions,
- CI or local script log proving cross-tenant denial,
- rollback steps validated.

## Exit Criteria Alignment

This artifact supports Day 1/2 exits:

- Day 1: isolation plan approved and executable,
- Day 2: cross-tenant denial proven in staging.
