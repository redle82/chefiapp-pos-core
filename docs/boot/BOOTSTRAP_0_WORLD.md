# Bootstrap 0 — World Boot (Infra)

Levantar o planeta. Docker compose sobe os serviços base; healthchecks e rede interna. Saída: **o mundo respira**.

---

## Purpose

Garantir que a infraestrutura do ChefIApp OS está de pé: Postgres, PostgREST, Realtime, Keycloak, MinIO, pgAdmin. Sem Boot 0, nada mais sobe.

---

## Inputs

- Nenhum (primeiro bootstrap). Requisito: Docker e docker compose instalados no host.

---

## Outputs

- Postgres a aceitar conexões.
- PostgREST a expor a API (via nginx).
- Realtime a expor WebSocket.
- Keycloak, MinIO, pgAdmin a correr (conforme compose).
- Rede interna `chefiapp-core-net` criada.
- **Saída semântica:** “o mundo respira”.

---

## Invariants

- Healthchecks do Postgres passam antes de PostgREST iniciar.
- PostgREST depende de Postgres (condition: service_healthy).
- Nenhum serviço operacional (TPV/KDS) sobe neste bootstrap; só infra + auth + storage.

---

## Commands

```bash
# Na raiz do repo
make world-up
# ou
./scripts/chef-world-up.sh
```

Equivalente a:

```bash
docker compose -f docker-core/docker-compose.core.yml up -d
```

Ficheiro: [docker-core/docker-compose.core.yml](../../docker-core/docker-compose.core.yml).

---

## Smoke tests

1. **Postgres** — `docker compose -f docker-core/docker-compose.core.yml exec postgres pg_isready -U postgres` retorna 0.
2. **PostgREST** — `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/` ou `http://localhost:3001/rpc/` retorna 200 (ou 404 para rpc sem body; o importante é não 5xx).
3. **Realtime** — Porta 4000 aberta; conexão WebSocket possível (opcional: testar handshake).
4. **Keycloak** — `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` retorna 200 ou 302.
5. **Lista de serviços** — `docker compose -f docker-core/docker-compose.core.yml ps` mostra postgres, postgrest, nginx, realtime, keycloak, minio, pgadmin (e simulator-orders se definido) em running.
