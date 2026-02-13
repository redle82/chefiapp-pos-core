# ChefIApp Core - Docker Infrastructure

**Banco limpo, schema oficial, zero resíduos.**

Este é o Core oficial do ChefIApp rodando em Docker, desacoplado do Supabase.

---

## 🎯 Objetivo

Criar um ambiente limpo onde:

- ✅ Postgres puro (sem abstrações Supabase)
- ✅ Schema oficial do Core (sem resíduos)
- ✅ RPCs reais (`create_order_atomic`)
- ✅ Constraints constitucionais ativas
- ✅ Zero dados legacy

---

## 🚀 Quick Start

### 1. Subir o Core (um comando sobe o planeta)

**Na raiz do repositório (recomendado):**

```bash
make world-up
# ou
./scripts/chef-world-up.sh
```

**Alternativa (npm):**

```bash
npm run docker:core:up
```

**Ou dentro de `docker-core`:**

```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

**CLI completa (world-up, world-down, world-chaos):** [docs/strategy/CLI_CHEFIAPP_OS.md](../docs/strategy/CLI_CHEFIAPP_OS.md)

**Aguarde até ver:**

```
chefiapp-core-postgres    | database system is ready to accept connections
```

**Se na consola do browser aparecer `net::ERR_CONNECTION_REFUSED` em `localhost:3001`:** o frontend está em modo backend "docker" mas o Core não está a correr. Subir o Core com os comandos acima e recarregar a página.

### 2. Verificar Status

```bash
docker compose -f docker-compose.core.yml ps
```

**Deve mostrar:**

- `chefiapp-core-postgres` - healthy
- `chefiapp-core-postgrest` - running
- `chefiapp-core-realtime` - running
- `chefiapp-core-keycloak` - running (auth)
- `chefiapp-core-minio` - running (storage)
- `chefiapp-core-pgadmin` - running (opcional)

### 3. Conectar ao Banco

```bash
docker compose -f docker-core/docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core
```

---

## 📊 Endpoints (stack local — zero Supabase)

| Serviço       | URL                     | Descrição                      |
| ------------- | ----------------------- | ------------------------------ |
| **Postgres**  | `localhost:54320`       | Banco de dados                 |
| **PostgREST** | `http://localhost:3001` | REST API (RPCs, /rest/v1/)     |
| **Realtime**  | `ws://localhost:4000`   | WebSocket (KDS sync)           |
| **Keycloak**  | `http://localhost:8080` | Auth (substitui Supabase Auth) |
| **MinIO**     | `http://localhost:9000` | API S3 (storage)               |
| **MinIO UI**  | `http://localhost:9001` | Consola MinIO                  |
| **pgAdmin**   | `http://localhost:5050` | Admin UI Postgres (opcional)   |

---

## 🔧 Configuração da UI

### Merchant Portal

Atualize `merchant-portal/.env`:

```env
# Core Docker (novo)
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long

# Ou use PostgREST diretamente
VITE_API_BASE=http://localhost:3000
```

**Nota:** A UI não precisa saber que mudou de Supabase para Docker. Ela só precisa da URL correta.

---

## 📦 Migrations

No primeiro `up` (initdb), o Postgres aplica por ordem:

1. **01-core-schema.sql** — tabelas base (gm_restaurants, gm_orders, gm_order_items, etc.) e RPC `create_order_atomic`
2. **02-seeds-dev.sql** — seeds mínimas para desenvolvimento
3. **03-migrations-consolidated.sql** — migrações consolidadas: prep_time, station, ready_at, gm_tasks, gm_cash_registers, gm_payments, billing_configs, product_mode, RPCs `mark_item_ready`, `update_order_status`, `get_operational_metrics`, `get_shift_history`, tipos de tarefa PEDIDO_NOVO/MODO_INTERNO, etc.
4. **04-modules-and-extras.sql** — tabelas por módulo: gm_restaurant_members (people), installed_modules, module_permissions, event_store, legal_seals, gm_locations, gm_equipment, gm_ingredients, gm_stock_levels, gm_product_bom, gm_stock_ledger (stock/inventory).
5. **05-device-kinds.sql** — gm_equipment.kind passa a incluir TPV e KDS (dispositivos com identidade fixa).
6. **05.6-print-queue.sql** (FASE 6) — tabela `gm_print_jobs`, RPCs `request_print`, `get_print_job_status`. Ver [CORE_PRINT_CONTRACT.md](../docs/architecture/CORE_PRINT_CONTRACT.md).
7. **06-seed-enterprise.sql** — seeds enterprise.
8. **07-role-anon.sql** — role `anon` para PostgREST (opcional; actualmente usa `postgres`).

**Um reset total (`down -v` + `up`) deixa o banco com todas as tabelas e RPCs usados pelo front e back (menu, pedidos, tarefas, caixa, pessoas, módulos, event store, stock).**

Migrations individuais em `schema/migrations/` existem para referência; para um Core novo, não é necessário aplicá-las manualmente (já estão em `03-migrations-consolidated.sql`). Os targets `make migrate-*` servem apenas se tiver um volume antigo criado antes da consolidação.

### Menu digital (catálogo visual)

Schema: **incluído em `03-migrations-consolidated.sql`** — Core novo (ou após `make reset`) já tem as tabelas `gm_catalog_menus`, `gm_catalog_categories`, `gm_catalog_items` e a coluna `gm_restaurants.menu_catalog_enabled`. Para **Core existente** (volume antigo), aplicar manualmente a partir de `docker-core/`:

```bash
make migrate-menu-catalog
make migrate-menu-catalog-seed   # opcional: dados de exemplo para /menu-v2
```

Ver: [MENU_VISUAL_RUNTIME_CONTRACT](../docs/architecture/MENU_VISUAL_RUNTIME_CONTRACT.md), [ONDE_VER_NO_NAVEGADOR](../docs/architecture/ONDE_VER_NO_NAVEGADOR.md#3-menu-digital-catálogo-visual).

---

## 💾 Backup e rollback

**Antes de aplicar migrations de DROP (ex.: `20260203_drop_legacy_untouched.sql`):**

1. **Backup lógico:** Exportar dados das tabelas alvo (ou schema completo) para SQL.
   ```bash
   docker compose -f docker-compose.core.yml exec postgres pg_dump -U postgres -d chefiapp_core -t mentor_suggestions -t mentor_recommendations [outras tabelas...] > docker-core/backups/pre_drop_legacy_YYYYMMDD.sql
   ```
   Guardar em `docker-core/backups/` (criar o directório se não existir) com nome datado.

2. **Restaurar (rollback):** Se precisar de reverter o DROP:
   - **Opção A:** Restaurar a partir do backup: `psql -U postgres -d chefiapp_core < docker-core/backups/pre_drop_legacy_YYYYMMDD.sql`
   - **Opção B:** Re-aplicar as migrations originais que criaram essas tabelas (ex.: `20260127_mentoria_ia.sql`, etc.) a partir de `schema/migrations/`.

**Referência:** [docs/ops/DB_TABLE_CLASSIFICATION.md](../docs/ops/DB_TABLE_CLASSIFICATION.md); plano DROP físico LEGACY (Opção A).

---

## 🧹 Reset Total

Para limpar tudo e começar do zero:

```bash
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d
```

Isso:

- Remove todos os volumes
- Recria o banco do zero
- Aplica 01-core-schema, 02-seeds-dev e 03-migrations-consolidated (schema + tabelas + RPCs completos)
- Deixa o Core alinhado com o que o front e o back usam

---

## 📁 Estrutura

```
docker-core/
├── docker-compose.core.yml    # Orquestração (initdb.d: 01, 02, 03)
├── schema/
│   ├── core_schema.sql        # 01 — Schema oficial do Core
│   ├── seeds_dev.sql          # 02 — Seeds para desenvolvimento
│   ├── 03-migrations-consolidated.sql  # 03 — Migrações (gm_tasks, caixa, RPCs)
│   ├── 04-modules-and-extras.sql      # 04 — Módulos (members, installed_modules, event_store, stock)
│   ├── 06-seed-enterprise.sql        # 06 — Seeds enterprise
│   ├── 07-role-anon.sql              # 07 — Role anon (PostgREST)
│   ├── migrations/           # Migrações individuais (referência)
│   ├── rpc_mark_item_ready.sql
│   └── rpc_update_order_status.sql
└── README.md                  # Este arquivo
```

---

## 🧪 Teste global (todas as tabelas + TPV + tarefas)

Com o Core em cima, execute:

```bash
cd docker-core
make test-global
```

Valida: Core acessível, tabelas por módulo (gm\_\*, installed_modules, event_store, stock), abrir turno (TPV), criar pedido (`create_order_atomic`), inserir tarefa MODO_INTERNO (fluxo "sem pedidos → tarefas"). Para E2E no browser: `npm run dev` (merchant-portal) e noutro terminal `npm run test:e2e:smoke`.

---

## ✅ Validação

Após subir, valide:

```bash
# 1. Verificar se RPC existe
docker compose -f docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core -c "\df create_order_atomic"

# 2. Verificar constraint
docker compose -f docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core -c "\d+ idx_one_open_order_per_table"

# 3. Testar RPC
docker compose -f docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core -c "SELECT create_order_atomic('00000000-0000-0000-0000-000000000100', '[{\"product_id\":\"00000000-0000-0000-0000-000000000001\",\"name\":\"Teste\",\"quantity\":1,\"unit_price\":1000}]'::jsonb);"
```

---

## 🔄 Migração do Supabase

**Fase A (Agora):**

- ✅ Core Docker rodando
- ✅ UI aponta para Docker
- ✅ Supabase congelado (não usado)

**Fase B (Futuro - sem pressa):**

- Decidir se quer Supabase Cloud
- Ou RDS
- Ou bare metal
- Ou Kubernetes

👉 **Isso é decisão de infra, não de produto.**

---

## 🚨 Troubleshooting

**Logs e saúde do Core:** ver [docs/strategy/OBSERVABILITY_MINIMA.md](../docs/strategy/OBSERVABILITY_MINIMA.md) (logs, Postgres, PostgREST, Realtime).

### Postgres não sobe

```bash
docker compose -f docker-compose.core.yml logs postgres
```

### PostgREST não conecta

```bash
docker compose -f docker-compose.core.yml logs postgrest
```

### Realtime não funciona

```bash
docker compose -f docker-compose.core.yml logs realtime
```

---

_"Banco novo para sistema novo. Sempre."_
