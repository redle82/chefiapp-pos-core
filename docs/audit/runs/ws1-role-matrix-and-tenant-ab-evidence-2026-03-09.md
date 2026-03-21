# WS1 Role Matrix + Tenant A/B Evidence (2026-03-09)

## Scope

Objective evidence for issue #99:

- Role matrix (`anon`, `authenticated`, `service_role`)
- Real tenant A/B read/write behavior
- Binary verdict: effective RLS vs facade

Environment:

- Worktree: `foundation/ws1-security-rls`
- Core REST: `http://localhost:3001`
- Database: `chefiapp_core` in container `chefiapp-core-postgres`

## Runtime Configuration Proof

### PostgREST effective auth config

Command:

```bash
docker inspect chefiapp-core-postgrest --format '{{range .Config.Env}}{{println .}}{{end}}' | rg '^PGRST_DB_ANON_ROLE|^PGRST_DB_URI|^PGRST_JWT_SECRET'
```

Output:

```text
PGRST_DB_URI=postgres://postgres:postgres@postgres:5432/chefiapp_core
PGRST_DB_ANON_ROLE=postgres
PGRST_JWT_SECRET=chefiapp-core-secret-key-min-32-chars-long
```

### Tenant helper function currently deployed

Command:

```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -At -F '|' -c "SELECT proname, regexp_replace(pg_get_functiondef(p.oid), E'[\n\r\t]+', ' ', 'g') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname='has_restaurant_access';"
```

Output:

```text
has_restaurant_access|CREATE OR REPLACE FUNCTION public.has_restaurant_access(p_restaurant_id uuid) RETURNS boolean LANGUAGE sql STABLE AS $function$ SELECT TRUE; $function$
```

## Resource Policy Snapshot

Command:

```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -At -F '|' -c "SELECT c.relname, c.relrowsecurity, COALESCE(string_agg(p.policyname || ':' || array_to_string(p.roles, ',') || ':' || p.cmd, '; ' ORDER BY p.policyname), 'NO_POLICIES') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_policies p ON p.schemaname='public' AND p.tablename=c.relname WHERE n.nspname='public' AND c.relname IN ('gm_restaurant_members','gm_reservations','event_store') GROUP BY c.relname, c.relrowsecurity ORDER BY c.relname;"
```

Output:

```text
event_store|t|Service full access event_store:service_role:ALL; Tenant isolation event_store:authenticated:SELECT
gm_reservations|t|reservations_all:public:ALL
gm_restaurant_members|f|NO_POLICIES
```

## Executable A/B Evidence

Script:

- `scripts/ws1_rls_probe.sh`

Execution:

```bash
scripts/ws1_rls_probe.sh
```

Observed output excerpt:

```text
[1] Legit A own-data access (read own membership)
[
  {
    "user_id": "39ead2d9-f458-4f9b-b064-93da38c977f1",
    "restaurant_id": "e532125a-f37e-457a-bb9c-38c470988cde"
  }
]

[2] A attempts cross-tenant read (read B membership)
[
  {
    "user_id": "8c6e46f0-4eae-49ef-ac31-db17cd9dec81",
    "restaurant_id": "bd454b15-1712-41a1-a7d7-5dc62e8d50a5"
  }
]

[2b] A attempts cross-tenant write (insert reservation for B)
HTTP_CODE=201

[2c] B reads reservation written by A into B tenant
[
  {
    "id": "99ceee6d-0098-4b0b-9103-42491a209b8a",
    "restaurant_id": "bd454b15-1712-41a1-a7d7-5dc62e8d50a5",
    "customer_name": "WS1-cross-tenant"
  }
]

[3] service_role explicit capability check (event_store count)
service_role event_store count=4
authenticated event_store count=4
```

Additional anon probe:

```text
anon gm_reservations count: 1
anon gm_restaurant_members count: 8
```

## Role Matrix (Observed Behavior)

| Resource                | anon                                   | authenticated                                   | service_role            | Notes                                                                              |
| ----------------------- | -------------------------------------- | ----------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `gm_restaurant_members` | can read rows (count observed)         | can read own and cross-tenant rows              | can read                | table has `relrowsecurity=false`, no policies                                      |
| `gm_reservations`       | can read rows (and policy permits all) | can insert row in tenant B (HTTP 201), can read | can read/write          | policy is `reservations_all` for `public` (`USING true`, `WITH CHECK true`)        |
| `event_store`           | not validated in this run              | reads all observed rows                         | reads all observed rows | authenticated policy depends on `has_restaurant_access()`, currently `SELECT TRUE` |

## Binary Conclusion

`RLS FACADE` (not effective tenant isolation in current runtime).

Why:

1. PostgREST runs with `PGRST_DB_ANON_ROLE=postgres`.
2. `has_restaurant_access()` currently returns unconditional `TRUE`.
3. Cross-tenant read/write by authenticated principal succeeded in executable A/B tests.
4. `gm_restaurant_members` has no RLS and `gm_reservations` uses permissive `public` ALL policy.

## Repro Commands (Minimal)

```bash
# 1) Check runtime role wiring
docker inspect chefiapp-core-postgrest --format '{{range .Config.Env}}{{println .}}{{end}}' | rg '^PGRST_DB_ANON_ROLE|^PGRST_DB_URI|^PGRST_JWT_SECRET'

# 2) Run executable A/B probe
scripts/ws1_rls_probe.sh

# 3) Check helper function body
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "SELECT pg_get_functiondef('public.has_restaurant_access(uuid)'::regprocedure);"
```
