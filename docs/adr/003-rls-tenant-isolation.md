# ADR-003: RLS Tenant Isolation

## Status

Accepted

## Context

ChefIApp is a multi-tenant SaaS where each restaurant is a tenant. All
tenants share the same database. A data leak between tenants -- where
Restaurant A can see Restaurant B's orders, staff, or financial data -- would
be a critical security and trust failure.

We needed an isolation mechanism that is automatic, cannot be bypassed by
application bugs, and does not require every query to manually filter by
tenant.

## Decision

We use **PostgreSQL Row-Level Security (RLS)** with `restaurant_id` as the
tenant discriminator on every data table.

- Every table that holds tenant-specific data includes a `restaurant_id`
  column.
- RLS policies compare the row's `restaurant_id` against the authenticated
  user's JWT claim (`auth.jwt() -> 'restaurant_id'`).
- Policies are enforced for all operations: SELECT, INSERT, UPDATE, DELETE.
- The application never needs to add `WHERE restaurant_id = ?` to queries --
  the database enforces this automatically.
- Supabase Auth issues JWTs that embed the user's `restaurant_id` claim,
  which RLS policies reference.

## Consequences

**Positive:**
- Data isolation is enforced at the database level, not the application level
- Application code cannot accidentally leak cross-tenant data
- Every query is automatically scoped -- developers cannot forget the filter
- Works transparently with Supabase client, PostgREST, and realtime
- Straightforward audit: check policies, not every query in the codebase

**Negative:**
- Every new table must have `restaurant_id` and an RLS policy (easy to forget)
- Cross-tenant queries (admin dashboards, analytics) require service-role keys
  that bypass RLS, which must be carefully controlled
- RLS adds a small performance overhead to every query
- Debugging query issues is harder when RLS silently filters rows
- Schema migrations must account for RLS policy changes
