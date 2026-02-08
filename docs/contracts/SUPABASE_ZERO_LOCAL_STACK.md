# Contrato: Stack local “Supabase zero”

## Estado actual

- **Auth (Docker):** Keycloak. Hook `useSupabaseAuth` em modo Docker usa `getKeycloakSession()`; `signIn`/`signOut` via `getAuthActions()` redireccionam para Keycloak (8080).
- **Storage (Docker):** MinIO. Adapter em `core/storage/storageAdapter.ts`; upload/remove por implementar quando houver uso.
- **Dados (Docker):** PostgREST (Core). Leitura/escrita via `core-boundary/docker-core/connection.ts` (`dockerCoreClient`) e `core/infra/dockerCoreFetchClient.ts`.

## Uso de `@supabase/supabase-js`

A dependência **permanece** no bundle porque:

1. **PostgREST (Docker):** `dockerCoreClient` em `connection.ts` é criado com `createClient()` apontado ao Core (URL + apikey). Alternativa futura: usar apenas `dockerCoreFetchClient` (fetch puro) e remover `createClient` do Core.
2. **Modo Supabase:** Auth e dados em cloud continuam a usar o cliente Supabase.

Para **remover** `@supabase/supabase-js` do bundle (Docker-only):

- Trocar `connection.ts` para exportar um cliente baseado em `dockerCoreFetchClient` em vez de `createClient`.
- Garantir que todos os readers/writers do core-boundary usem essa API (já compatível).
- Remover a dependência de `package.json`.

## URLs da stack local (docker-core)

| Serviço   | URL                      |
| --------- | ------------------------ |
| Postgres  | localhost:54320          |
| PostgREST | http://localhost:3001    |
| Realtime  | ws://localhost:4000      |
| Keycloak  | http://localhost:8080    |
| MinIO     | http://localhost:9000    |
| MinIO UI  | http://localhost:9001    |
| pgAdmin   | http://localhost:5050    |

## Seed (restaurante piloto)

- **ID canónico:** `00000000-0000-0000-0000-000000000100`
- **Definido em:** `docker-core/schema/seeds_dev.sql` e constantes no frontend (ex.: `RuntimeReader.SEED_RESTAURANT_ID`, `KDSMinimal.SEED_RESTAURANT_ID`).
- Em localhost + Docker, o KDS e o TPV usam este ID para garantir consistência (TPV cria pedidos neste restaurante; KDS mostra pedidos do mesmo).

## Referências

- Auth adapter: `merchant-portal/src/core/auth/authAdapter.ts`, `authKeycloak.ts`
- Storage adapter: `merchant-portal/src/core/storage/storageAdapter.ts`
- Backend type: `merchant-portal/src/core/infra/backendAdapter.ts`
- Status de pedidos (KDS): `docs/contracts/STATUS_CONTRACT.md`
