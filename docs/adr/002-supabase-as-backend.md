# ADR-002: Supabase as Backend

## Status

Accepted

## Context

ChefIApp needs a backend that provides PostgreSQL, authentication, row-level
security, realtime subscriptions, and file storage -- without requiring a
dedicated backend team to build and maintain custom APIs. The team is small
and frontend-focused, so the backend choice needed to minimize operational
overhead while providing production-grade infrastructure.

We also needed a local development story that does not require cloud
connectivity, enabling offline development and faster iteration cycles.

## Decision

We chose **Supabase Cloud** for production and **Docker Core (PostgREST)**
for local development.

- **Supabase Cloud** provides managed PostgreSQL, Supabase Auth (JWT-based),
  Row-Level Security policies, Realtime (WebSocket subscriptions), and
  Storage. The client is initialized in `core/supabase/`.
- **Docker Core** runs a local PostgREST instance for development, accessed
  through `infra/docker-core/`. This gives the team a self-contained
  development environment with the same API surface.
- Database types are auto-generated into `types/database.types.ts`.
- Read and write operations are separated into `infra/readers/` and
  `infra/writers/` for clarity and to enforce the command/query separation.

## Consequences

**Positive:**
- Rapid development -- no custom REST/GraphQL API to build or maintain
- Built-in auth with JWT, eliminating custom auth infrastructure
- RLS policies enforce data isolation at the database level (see ADR-003)
- Realtime subscriptions enable live KDS updates and order status changes
- Local Docker setup enables fully offline development

**Negative:**
- Vendor dependency on Supabase for production infrastructure
- PostgreSQL-specific features may complicate future database migration
- Supabase client library updates can introduce breaking changes
- Docker Core and Supabase Cloud may have subtle API differences
- Limited control over database performance tuning compared to self-hosted
