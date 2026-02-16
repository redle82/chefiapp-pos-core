# PgBouncer — Connection pooling para o Core

O PostgREST (e o Core Docker) liga-se diretamente ao PostgreSQL. Para escalar além de dezenas de restaurantes ou muitas conexões concorrentes, colocar **PgBouncer** à frente do PostgreSQL reduz o número de conexões reais à base e melhora a estabilidade.

---

## Porquê

- Cada pedido HTTP ao PostgREST pode usar uma conexão à base; com muitos utilizadores ou workers, o PostgreSQL atinge rapidamente `max_connections`.
- PgBouncer mantém um pool de conexões reais e reutiliza-as entre clientes (modo transaction ou session).
- Recomendado quando: múltiplas instâncias do Core, muitos restaurantes ativos, ou limites de conexão no serviço de base de dados (ex.: Supabase, RDS).

---

## Configuração típica

1. **Instalar PgBouncer** no mesmo host do Core ou num host dedicado.
2. **Configurar** `pgbouncer.ini`:
   - `[databases]`: alias (ex.: `chefiapp`) apontando para o connection string real do PostgreSQL.
   - `pool_mode`: `transaction` (recomendado para PostgREST) ou `session` se precisar de prepared statements por sessão.
   - `max_client_conn`: número máximo de clientes que o PgBouncer aceita.
   - `default_pool_size`: número de conexões reais ao PostgreSQL (deve ser &lt; `max_connections` do Postgres).
3. **Alterar o Core/PostgREST** para se ligar ao host/porta do PgBouncer em vez do PostgreSQL diretamente (variável de ambiente `PGRST_DB_URI` ou equivalente no Docker).
4. **Reiniciar** PostgREST e PgBouncer; validar com pedidos ao `/rest/v1/`.

---

## Docker — Setup ChefIApp Core (integrado no stack)

PgBouncer está **integrado no stack Core por padrão** desde a versão corrente:

```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

- **Serviço `pgbouncer`:** imagem `edoburu/pgbouncer:1.21.0`, env `DATABASE_URL` apontando ao Postgres, `POOL_MODE=transaction`, `DEFAULT_POOL_SIZE=20`, `MAX_CLIENT_CONN=200`. Porta host 6432.
- **PostgREST:** usa `PGRST_DB_URI=postgres://postgres:postgres@pgbouncer:5432/chefiapp_core` (liga ao PgBouncer; a imagem edoburu escuta na porta 5432).
- **Realtime** continua ligado ao Postgres direto (não ao PgBouncer — necessita `wal_level=logical`).

**Validar:** `http://localhost:3001/rest/v1/` deve retornar 200. Se falhar, verificar logs: `docker compose -f docker-compose.core.yml logs pgbouncer postgrest`.

> **Nota:** O ficheiro `docker-compose.pgbouncer.yml` antigo (overlay) foi marcado como DEPRECATED. Usar apenas `docker-compose.core.yml`.

---

## Alertas em produção

- Monitorizar conexões ativas no PgBouncer e no PostgreSQL.
- Configurar alertas (Sentry, Datadog ou equivalente) quando:
  - O health check do Core (`/rest/v1/` ou `/health`) falhar de forma prolongada.
  - O número de conexões no Postgres se aproximar de `max_connections`.
- Documentar runbook: reinício do PgBouncer, escalar `default_pool_size`, ou aumentar `max_connections` no Postgres (com cuidado).

---

## Referências

- [PgBouncer](https://www.pgbouncer.org/)
- [PostgREST connection pool](https://postgrest.org/en/stable/references/configuration.html#db-uri) — PostgREST pode usar um connection string que aponta ao PgBouncer.
