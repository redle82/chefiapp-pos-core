# ChefIApp Core — Ambiente ENTERPRISE local (Docker)

Configuração do Core Docker como ambiente **ENTERPRISE REAL**: um restaurante totalmente funcional no banco local, usando todo o sistema (TPV, KDS, Menu, Turnos, Caixa, Estados) **sem mocks de UI** e **sem atalhos irreais**.

---

## Princípios obrigatórios

- **Docker Core é a única autoridade** (Postgres + RPCs).
- **Nada hardcoded no frontend** para estado operacional.
- Restaurante criado via **bootstrap / seed controlado**.
- Fluxo igual a **cliente enterprise em produção**.
- Tudo **observável** (logs + DB).

---

## 1. Subir o Core corretamente

### Comandos

```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

### Portas (oficiais)

| Serviço   | Porta interna (container) | Porta exposta (host) | Uso                                 |
| --------- | ------------------------- | -------------------- | ----------------------------------- |
| Postgres  | 5432                      | **54320**            | BD (evitar conflito Supabase 54322) |
| PostgREST | 3000 (atrás do nginx)     | **3001**             | API REST + RPC                      |
| Realtime  | 4000                      | **4000**             | WebSocket (KDS/TPV)                 |

O frontend (Vite) faz proxy de `/rest` e `/rpc` para `http://localhost:3001`.

### Verificar que está tudo ativo

```bash
docker compose -f docker-compose.core.yml ps
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
# Esperado: 200 ou 404 (PostgREST responde)
```

---

## 2. Inicialização limpa do banco

### Quando fazer reset

- **Primeira vez** ou quando quiser **banco limpo** com seed ENTERPRISE aplicado.

```bash
cd docker-core
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d
```

Os scripts em `docker-entrypoint-initdb.d/` correm **apenas na primeira criação do volume**. Ordem:

1. `01-core-schema.sql` — tabelas base (gm_restaurants, gm_orders, gm_order_items, gm_products, gm_tables, RPC create_order_atomic, etc.)
2. `02-seeds-dev.sql` — tenant, restaurante piloto, categorias, produtos, mesas
3. `03-migrations-consolidated.sql` — gm_cash_registers, gm_payments, prep_time, station, mark_item_ready, update_order_status, get_operational_metrics, get_shift_history, etc.
4. `04-modules-and-extras.sql` — installed_modules, gm_restaurant_members, event_store, etc.
5. `05-device-kinds.sql` — device kinds
6. `05.1-onboarding-persistence.sql` — colunas em gm_restaurants (country, timezone, currency, locale, type), restaurant_schedules, restaurant_setup_status, restaurant_zones
7. `06-seed-enterprise.sql` — **restaurante ENTERPRISE**: status=active, product_mode=live, caixa aberto, módulos TPV/KDS, setup_status, horários, **membro owner** (user_id fixo para trial)

### Tabelas-chave a confirmar

```sql
-- No Postgres (porta 54320, user postgres, db chefiapp_core)
\dt gm_*
-- Esperado: gm_restaurants, gm_products, gm_menu_categories, gm_tables, gm_orders, gm_order_items, gm_cash_registers, gm_payments, gm_tasks, ...
```

---

## 3. Restaurante ENTERPRISE (seed controlado)

O ficheiro **`schema/06-seed-enterprise.sql`**:

- **Atualiza** o restaurante piloto (`id = 00000000-0000-0000-0000-000000000100`):
  - `status = 'active'`
  - `product_mode = 'live'`
  - `billing_status = 'trial'`
  - `country`, `timezone`, `currency`, `locale`, `type` (Portugal, EUR, etc.)
- **Insere** um **caixa aberto** (gm_cash_registers, status='open') — “turno iniciado”.
- **Insere** **módulos instalados** (installed_modules): tpv, kds, tasks, appstaff, health, alerts, config, dashboard, restaurant-web, menu, system-tree.
- **Insere/atualiza** **restaurant_setup_status** (onboarding completo).
- **Insere/atualiza** **restaurant_schedules** (Seg–Sáb 09:00–22:00, Domingo fechado).
- **Insere** **gm_restaurant_members**: um owner com `user_id = 00000000-0000-0000-0000-000000000002` (para trial local: usar auth com este UUID ou criar user com este id no Supabase Auth).

Nada é simulado fora do Core; as mesmas tabelas e RPCs que o Bootstrap e o TPV usam.

---

## 4. Ativar operação completa (já no seed)

Após o reset com `06-seed-enterprise.sql`:

- **Menu funcional** — vem de `02-seeds-dev.sql` (categorias + produtos); `03-migrations-consolidated.sql` preenche `station` e `prep_time_seconds`.
- **Estações** — BAR/KITCHEN nos produtos (coluna `station`).
- **Caixa aberto** — uma linha em `gm_cash_registers` com `status = 'open'`.
- **“Turno iniciado”** — neste Core, turno = caixa aberto (get_shift_history devolve gm_cash_registers).
- **Funcionário mínimo** — o seed **06-seed-enterprise.sql** insere um **gm_restaurant_members** (owner, user_id `00000000-0000-0000-0000-000000000002`). O Bootstrap/FlowGate exigem membership; para trial local, configurar auth para que o utilizador logado tenha este id (ex.: Supabase Auth com user criado com este UUID).

Nada automático fora do fluxo: caixa existe e está aberto no DB; o frontend apenas lê e chama RPCs.

---

## 5. Validar fluxo real ponta a ponta

Ordem sugerida:

1. **Frontend:** `VITE_SUPABASE_URL=http://localhost:3001` (ou proxy `/rest` → 3001), abrir `/op/tpv`.
2. **TPV:** Selecionar restaurante piloto (id `00000000-0000-0000-0000-000000000100`). Desbloquear / “Abrir turno” já está satisfeito pelo caixa aberto no seed. Criar pedido (mesa ou balcão), adicionar item → **o pedido nasce no Core** (create_order_atomic ou fluxo add item).
3. **Enviar à cozinha** — update_order_status para IN_PREP/PREPARING.
4. **KDS** — abrir `/op/kds`; pedido deve aparecer (Realtime ou polling).
5. **Marcar item pronto** — RPC `mark_item_ready`; pedido passa a READY quando todos os itens prontos.
6. **Voltar ao TPV** — ver estado READY; servir; pagar (process_order_payment / gm_payments); pedido fecha (CLOSED, PAID).

### Validação no banco

```sql
-- Pedidos e estados
SELECT id, status, payment_status, total_cents, created_at
FROM gm_orders
WHERE restaurant_id = '00000000-0000-0000-0000-000000000100'
ORDER BY created_at DESC LIMIT 5;

-- Itens e ready_at
SELECT oi.id, oi.order_id, oi.name_snapshot, oi.ready_at
FROM gm_order_items oi
JOIN gm_orders o ON o.id = oi.order_id
WHERE o.restaurant_id = '00000000-0000-0000-0000-000000000100'
ORDER BY oi.created_at DESC LIMIT 10;

-- Caixa aberto
SELECT id, name, status, opened_at
FROM gm_cash_registers
WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';
```

Nenhuma escrita direta fora de RPCs; transições de estado via Core.

---

## 6. Observabilidade

- **Logs do Core:**
  `docker compose -f docker-compose.core.yml logs -f postgres`
  `docker compose -f docker-compose.core.yml logs -f postgrest`
- **Chamadas RPC:** PostgREST regista pedidos; para RPCs pode usar `log_statement = 'all'` no Postgres (opcional) ou auditoria na aplicação.
- **Queries relevantes:** as listadas acima (gm_orders, gm_order_items, gm_cash_registers). Para pagamentos: `SELECT * FROM gm_payments ORDER BY created_at DESC LIMIT 10;`

Tudo que muda estado (pedido, item pronto, pagamento) deve passar pelo Core (RPCs ou PostgREST com regras/triggers conforme contrato).

---

## Checklist do que foi criado

- [x] **Core no ar:** Postgres (54320), PostgREST via nginx (3001), Realtime (4000).
- [x] **Schema aplicado:** core_schema, migrations consolidadas, 05.1-onboarding-persistence, modules-and-extras, device-kinds.
- [x] **Seed dev:** tenant, restaurante piloto, categorias, produtos, mesas.
- [x] **Seed ENTERPRISE:** restaurante com status=active, product_mode=live, billing_status=trial; caixa aberto; installed_modules (TPV, KDS, …); restaurant_setup_status; restaurant_schedules; gm_restaurant_members (owner).
- [ ] **Frontend:** aponta para Core (proxy /rest → 3001); utilizador com id `00000000-0000-0000-0000-000000000002` para passar Bootstrap/FlowGate; TPV e KDS usam apenas Core (sem mocks).
- [ ] **Fluxo validado:** criar pedido no TPV → enviar à cozinha → KDS recebe → marcar pronto → TPV paga → pedido fechado; estados corretos no DB.

---

## Estado final do restaurante no Core (exemplo)

Após `06-seed-enterprise.sql`:

| Entidade                | Estado                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| gm_restaurants          | 1 linha: status=active, product_mode=live, billing_status=trial, country=Portugal, timezone=Europe/Lisbon, currency=EUR   |
| gm_cash_registers       | 1 linha: status=open, opened_by=seed-enterprise                                                                           |
| installed_modules       | 11 linhas: tpv, kds, tasks, appstaff, health, alerts, config, dashboard, restaurant-web, menu, system-tree                |
| restaurant_setup_status | 1 linha: sections = identity, location, menu, schedule, people, payments, publish = true                                  |
| restaurant_schedules    | 7 linhas (0–6): Seg–Sáb 09:00–22:00, Dom fechado                                                                          |
| gm_menu_categories      | 4 categorias (Entradas, Pratos Principais, Bebidas, Sobremesas)                                                           |
| gm_products             | 7 produtos (Bruschetta, Nachos, Hambúrguer, Pizza, Água, Refrigerante, Tiramisú) com station/prep_time preenchidos por 03 |
| gm_tables               | 10 mesas (1–10)                                                                                                           |
| gm_restaurant_members   | 1 linha: restaurant_id piloto, user_id=00000000-0000-0000-0000-000000000002, role=owner                                   |

---

## Não fazer

- Não criar atalhos de UI que contornem caixa/turno.
- Não “forçar estado” no frontend sem passar pelo Core.
- Não saltar guards (caixa aberto, menu publicado = restaurante active).
- Não escrever direto no banco fora do contrato (usar RPCs para ordens, pagamentos, mark_item_ready, update_order_status).

Sistema pronto para **trial, stress e documentação** com Core soberano, consistente e auditável; frontend apenas como cliente do sistema.
