# Checklist mundo estressado (simulador de pedidos)

Checklist reproduzível para validar que o simulador de pedidos injeta correctamente no Core e que o KDS mostra os pedidos. Critério de sucesso: **pedidos criados pelo simulador aparecem no Core e no KDS.**

---

## Pré-requisitos

- [ ] Docker e docker compose instalados
- [ ] Node 18+ (para simulador local) ou Docker para correr o simulador em container
- [ ] Merchant portal pode ser corrido (`npm run dev` na raiz ou em merchant-portal)

---

## Passos (pass/fail)

| #   | Acção                          | Pass                                                                                                                                                             | Fail                                                                           |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Subir o mundo                  | `make world-up` (ou `./scripts/chef-world-up.sh`); serviços do Core em running                                                                                   | Erro ao subir ou healthcheck falha                                             |
| 2   | Correr simulador local         | `POSTGREST_URL=http://localhost:3001 COUNT=10 node simulators/orders/run.js`; stdout mostra "order created: \<uuid\>" para cada pedido                           | "Products fetch failed", "create_order_atomic failed" ou sem output de pedidos |
| 3   | Verificar pedidos no Core      | Query `SELECT id, restaurant_id, status, total_cents, created_at FROM gm_orders ORDER BY created_at DESC LIMIT 10` no Postgres; lista 10 pedidos com status OPEN | Menos de 10 pedidos ou erro na query                                           |
| 4   | Verificar no KDS               | Merchant portal a correr; abrir KDS (restaurant_id seed); pedidos do simulador aparecem na lista (OPEN)                                                          | KDS vazio ou pedidos não aparecem                                              |
| 5   | Simulador em Docker (opcional) | `docker compose -f docker-core/docker-compose.core.yml run --rm -e COUNT=5 simulator-orders` termina sem erro; novos pedidos visíveis no Core/KDS                | Build ou execução falha; pedidos não aparecem                                  |

---

## Comandos de referência

```bash
# 1. Subir mundo
make world-up

# 2. Simulador local (raiz do repo)
POSTGREST_URL=http://localhost:3001 COUNT=10 node simulators/orders/run.js

# 3. Verificar no Core
docker compose -f docker-core/docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core -c "SELECT id, restaurant_id, status, total_cents, created_at FROM gm_orders ORDER BY created_at DESC LIMIT 10;"

# 4. Merchant portal (outro terminal)
npm run dev
# Abrir KDS no browser (restaurant_id seed 00000000-0000-0000-0000-000000000100)

# 5. Simulador em Docker (opcional)
docker compose -f docker-core/docker-compose.core.yml run --rm -e COUNT=5 simulator-orders
```

---

## Referências

- Simulador: [simulators/orders/README.md](../../simulators/orders/README.md)
- Checklist operacional (TPV + KDS + Cliente): [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)
- CLI do mundo: [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md)
