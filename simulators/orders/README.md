# Simulador de pedidos (orders)

Injeta pedidos em massa no Core (PostgREST) para stress, múltiplos canais e testes.
Usa produtos existentes (seed) para `product_id` válido. Chama a RPC `create_order_atomic`.

---

## Variáveis de ambiente

| Variável        | Descrição                                       | Default                                              |
| --------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `POSTGREST_URL` | Base URL do PostgREST                           | `http://localhost:3001`                              |
| `RESTAURANT_ID` | UUID do restaurante                             | `00000000-0000-0000-0000-000000000100` (seed piloto) |
| `COUNT`         | Número de pedidos a criar por execução          | `5`                                                  |
| `SOURCE`        | Canal: `tpv`, `web`, `api`                      | `tpv`                                                |
| `DELAY_MS`      | Atraso entre pedidos (ms)                       | `500`                                                |
| `LOOP`          | Se `true` ou `1`, corre em loop até interromper | `false`                                              |

---

## Correr local

1. Subir o Core: `docker compose -f docker-core/docker-compose.core.yml up -d`
2. Garantir que seeds foram aplicados (restaurante + produtos).
3. Node 18+ (para `fetch` nativo):

```bash
cd simulators/orders
POSTGREST_URL=http://localhost:3001 COUNT=10 node run.js
```

Ou a partir da raiz do repo:

```bash
POSTGREST_URL=http://localhost:3001 COUNT=10 node simulators/orders/run.js
```

---

## Correr em Docker (compose)

O serviço `simulator-orders` está definido em `docker-core/docker-compose.core.yml`.
Depende de `postgrest` (via nginx). Usa a rede do Core; `POSTGREST_URL` deve apontar para o nginx (ex.: `http://nginx:3001`).

```bash
# Subir o mundo e o simulador (uma execução = COUNT pedidos)
docker compose -f docker-core/docker-compose.core.yml up -d
docker compose -f docker-core/docker-compose.core.yml run --rm -e COUNT=20 simulator-orders

# Modo loop (inject contínuo até Ctrl+C)
docker compose -f docker-core/docker-compose.core.yml run --rm -e COUNT=5 -e LOOP=true -e DELAY_MS=2000 simulator-orders
```

---

## Validação (smoke test)

Critério de sucesso: **pedidos criados pelo simulador aparecem no Core e no KDS.**

1. **Subir o mundo** — `make world-up` (ou `./scripts/chef-world-up.sh`). Aguardar healthchecks (Postgres, PostgREST via nginx).
2. **Correr simulador local** — Na raiz: `POSTGREST_URL=http://localhost:3001 COUNT=10 node simulators/orders/run.js`. Verificar stdout: `order created: <uuid>` para cada pedido; sem erro "Products fetch failed" ou "create_order_atomic failed".
3. **Verificar pedidos no Core** — `docker compose -f docker-core/docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core -c "SELECT id, restaurant_id, status, total_cents, created_at FROM gm_orders ORDER BY created_at DESC LIMIT 10;"`. Deve listar os 10 pedidos com status OPEN.
4. **Verificar no KDS** — Merchant portal a correr (`npm run dev`), abrir KDS (restaurant_id seed `00000000-0000-0000-0000-000000000100`). Os pedidos criados pelo simulador devem aparecer na lista do KDS (status OPEN).
5. **Simulador em Docker (opcional)** — `docker compose -f docker-core/docker-compose.core.yml run --rm -e COUNT=5 simulator-orders`. Verificar que não falha; novos pedidos aparecem no Core e no KDS.

Checklist reproduzível: [docs/strategy/CHECKLIST_MUNDO_ESTRESSADO.md](../../docs/strategy/CHECKLIST_MUNDO_ESTRESSADO.md).

---

## Contratos

- Pedidos criados respeitam [MENU_BUILDING_CONTRACT_v1](../../docs/contracts/MENU_BUILDING_CONTRACT_v1.md) (product_id válido, snapshot).
- Estado de pedido conforme [ORDER_STATUS_CONTRACT_v1](../../docs/contracts/ORDER_STATUS_CONTRACT_v1.md) (OPEN inicial).
