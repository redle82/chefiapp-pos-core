# CLI do ChefIApp OS

Comandos simples para **subir o mundo**, **parar o mundo** e **simular caos**.
Sem abstração vazia — um comando sobe o planeta.

---

## Comandos

### world-up — Subir o mundo

Sobe o Core Docker: Postgres, PostgREST, Nginx, Realtime, Keycloak, MinIO, pgAdmin e o serviço do simulador de pedidos (build).

**Script:**

```bash
./scripts/chef-world-up.sh
```

**Make:**

```bash
make world-up
```

**O que esperar:** Todos os serviços do `docker-core/docker-compose.core.yml` em execução. Endpoints listados no stdout (Postgres 54320, PostgREST 3001, Realtime 4000, Keycloak 8080, MinIO 9000/9001, pgAdmin 5050).

---

### world-down — Parar o mundo

Para todos os serviços do Core Docker.

**Script:**

```bash
./scripts/chef-world-down.sh
```

**Make:**

```bash
make world-down
```

**O que esperar:** `docker compose down`; containers parados. Volumes mantidos (para reset total: `docker compose -f docker-core/docker-compose.core.yml down -v`).

---

### world-chaos — Simular caos

Reinicia um serviço do Core (default: PostgREST). Útil para validar reconexão do KDS/TPV após falha da API.

**Script:**

```bash
./scripts/chef-world-chaos.sh [serviço]
# Ex.: ./scripts/chef-world-chaos.sh postgrest
#      ./scripts/chef-world-chaos.sh nginx
#      ./scripts/chef-world-chaos.sh realtime
```

**Make:**

```bash
make world-chaos
make world-chaos SERVICE=nginx
```

**O que esperar:** O serviço indicado reinicia; KDS/TPV devem reconectar após refresh ou novo polling (conforme [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)).

**Critério de aceite após chaos:** ver [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md — Casos de stress (KDS) e Ritual caos](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) (reconexão KDS/TPV; pedidos activos voltam).

---

## Ciclo típico

1. **Subir:** `make world-up` (ou `./scripts/chef-world-up.sh`)
2. **Validar:** Merchant portal a correr; seguir [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)
3. **Caos (opcional):** `make world-chaos` → observar KDS/TPV
4. **Parar:** `make world-down`

---

## Referências

- Compose: `docker-core/docker-compose.core.yml`
- Checklist operacional: [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)
- Docker Core README: [docker-core/README.md](../../docker-core/README.md)
- Simulador de pedidos: [simulators/orders/README.md](../../simulators/orders/README.md)
