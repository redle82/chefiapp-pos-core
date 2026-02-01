# Localização do Banco de Dados - ChefIApp

**Data:** 2026-01-25  
**Status:** ✅ Verificado e Documentado

---

## Resumo Executivo

Seu banco de dados principal está rodando no **Docker Core**, que simula o Supabase localmente usando componentes puros (Postgres + PostgREST + Realtime).

---

## Banco Principal: Docker Core

### Informações de Conexão

**Container:** `chefiapp-core-postgres`  
**Status:** ✅ Rodando e saudável  
**Porta Externa:** `54320`  
**Porta Interna:** `5432`  
**Banco de Dados:** `chefiapp_core`  
**Usuário:** `postgres`  
**Senha:** `postgres`  
**String de Conexão:** `postgresql://postgres:postgres@localhost:54320/chefiapp_core`

### Serviços Relacionados

| Serviço | Container | Porta | Status |
|---------|-----------|-------|--------|
| **Postgres** | `chefiapp-core-postgres` | `54320` | ✅ Healthy |
| **PostgREST** | `chefiapp-core-postgrest` | `3001` | ✅ Running |
| **Realtime** | `chefiapp-core-realtime` | `4000` | ⚠️ Restarting |

### Localização dos Dados

**Volume Docker:** `postgres-core-data`  
**Localização Física:** Gerenciada pelo Docker (normalmente em `~/.docker/volumes/`)

**Schema:** `docker-core/schema/core_schema.sql`  
**Seeds:** `docker-core/schema/seeds_dev.sql`

---

## Como Acessar

### 0. Scripts Úteis (Recomendado)

Scripts prontos para facilitar o acesso:

```bash
# Verificar status de todos os bancos
./scripts/check-db-status.sh

# Conectar ao banco interativamente
./scripts/connect-db.sh

# Executar uma query SQL
./scripts/query-db.sh "SELECT * FROM gm_restaurants LIMIT 5;"

# Ver informações rápidas do banco
./scripts/quick-db-info.sh
```

### 1. Via Docker Exec (Recomendado)

```bash
# Conectar ao banco interativamente
docker exec -it chefiapp-core-postgres psql -U postgres -d chefiapp_core

# Ou usando docker compose
cd docker-core
docker compose -f docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core
```

### 2. Via Cliente PostgreSQL Local

Se você tem `psql` instalado localmente:

```bash
psql -h localhost -p 54320 -U postgres -d chefiapp_core
# Senha: postgres
```

### 3. Via PostgREST (REST API)

**URL Base:** `http://localhost:3001`

**Exemplos:**

```bash
# Listar restaurantes
curl http://localhost:3001/gm_restaurants

# Listar mesas
curl http://localhost:3001/gm_tables

# Chamar RPC
curl -X POST http://localhost:3001/rpc/create_order_atomic \
  -H "Content-Type: application/json" \
  -d '{
    "p_restaurant_id": "00000000-0000-0000-0000-000000000100",
    "p_items": [{"product_id": "...", "name": "Item", "quantity": 1, "unit_price": 1000}],
    "p_payment_method": "cash"
  }'
```

---

## Verificação de Status

### Script Automatizado (Recomendado)

```bash
# Verificar status completo de todos os bancos
./scripts/check-db-status.sh
```

Este script verifica:
- ✅ Status dos containers Docker
- ✅ Portas abertas
- ✅ Conectividade (Postgres, PostgREST, Realtime)
- ✅ Outros bancos (legado)

### Verificar Containers (Manual)

```bash
# Todos os containers ChefIApp
docker ps --filter "name=chefiapp" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Apenas Docker Core
cd docker-core
docker compose -f docker-compose.core.yml ps
```

### Verificar Conectividade (Manual)

```bash
# Postgres
docker exec chefiapp-core-postgres pg_isready -U postgres

# PostgREST
curl http://localhost:3001

# Realtime
curl http://localhost:4000/health
```

---

## Estrutura do Banco

### Tabelas Principais

- `gm_restaurants` - Restaurantes/tenants
- `gm_orders` - Pedidos
- `gm_order_items` - Itens dos pedidos
- `gm_products` - Produtos do cardápio
- `gm_tables` - Mesas
- `gm_employees` - Funcionários
- `saas_tenants` - Tenants (SaaS)

### RPCs (Remote Procedure Calls)

- `create_order_atomic` - Criar pedido atomicamente (respeita constraints)

### Constraints Importantes

- `idx_one_open_order_per_table` - Garante apenas um pedido OPEN por mesa
- `orders_status_check` - Valida status do pedido
- `orders_payment_status_check` - Valida status de pagamento

---

## Comandos Úteis

### Gerenciamento

```bash
# Subir Docker Core
cd docker-core
docker compose -f docker-compose.core.yml up -d

# Parar Docker Core
docker compose -f docker-compose.core.yml down

# Resetar banco (limpar tudo)
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d

# Ver logs
docker compose -f docker-compose.core.yml logs -f postgres
```

### Consultas Rápidas

```bash
# Ver restaurantes
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core \
  -c "SELECT id, name, slug FROM gm_restaurants LIMIT 5;"

# Ver mesas
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core \
  -c "SELECT id, number, status, qr_code FROM gm_tables LIMIT 10;"

# Ver produtos
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core \
  -c "SELECT id, name, price_cents FROM gm_products LIMIT 5;"

# Ver pedidos recentes
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core \
  -c "SELECT id, status, table_number, origin, total_cents, created_at FROM gm_orders ORDER BY created_at DESC LIMIT 5;"

# Contar registros
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core \
  -c "SELECT 
    (SELECT COUNT(*) FROM gm_restaurants) as restaurants,
    (SELECT COUNT(*) FROM gm_tables) as tables,
    (SELECT COUNT(*) FROM gm_products) as products,
    (SELECT COUNT(*) FROM gm_orders) as orders;"
```

### Verificar Schema

```bash
# Listar todas as tabelas
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "\dt"

# Verificar RPC
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "\df create_order_atomic"

# Verificar constraint
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "\d+ idx_one_open_order_per_table"

# Ver estrutura de uma tabela
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "\d+ gm_orders"
```

---

## Outros Bancos Docker (Não Usados)

### Supabase Local (Legado)

**Container:** `supabase_db_chefiapp-pos-core`  
**Porta:** `54322`  
**Status:** ⚠️ Rodando mas **NÃO usado** pelo sistema atual

Este banco foi substituído pelo Docker Core. Pode ser parado se não for necessário.

### Docker Tests

**Container:** `chefiapp-test-postgres`  
**Porta:** `54399`  
**Banco:** `chefiapp_test`  
**Uso:** Apenas para testes automatizados

---

## Configuração da UI

**Arquivo:** `merchant-portal/.env`

```env
# Docker Core (PostgREST)
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long
```

**Nota Importante:**  
A UI usa a variável `VITE_SUPABASE_URL` por compatibilidade com o cliente Supabase, mas na verdade aponta para o **PostgREST do Docker Core** (porta 3001), não para o Supabase local.

---

## Troubleshooting

### Banco não responde

```bash
# Verificar se container está rodando
docker ps | grep chefiapp-core-postgres

# Ver logs
docker logs chefiapp-core-postgres

# Reiniciar
cd docker-core
docker compose -f docker-compose.core.yml restart postgres
```

### PostgREST não conecta

```bash
# Verificar logs
docker logs chefiapp-core-postgrest

# Verificar se Postgres está saudável
docker exec chefiapp-core-postgres pg_isready -U postgres

# Reiniciar PostgREST
cd docker-core
docker compose -f docker-compose.core.yml restart postgrest
```

### Realtime não funciona

```bash
# Verificar logs
docker logs chefiapp-core-realtime

# Verificar conexão com Postgres
docker exec chefiapp-core-realtime env | grep DB_

# Reiniciar
cd docker-core
docker compose -f docker-compose.core.yml restart realtime
```

---

## Resumo Visual

```
┌─────────────────────────────────────────────────────────┐
│              DOCKER CORE (Em Uso)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │  Postgres    │    │  PostgREST  │    │ Realtime │ │
│  │  :54320      │───▶│  :3001      │───▶│  :4000   │ │
│  │  chefiapp_   │    │  (REST API) │    │ (WS)     │ │
│  │  core        │    │             │    │          │ │
│  └──────────────┘    └──────────────┘    └──────────┘ │
│                                                         │
│  Volume: postgres-core-data                            │
│  Schema: docker-core/schema/core_schema.sql            │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         SUPABASE LOCAL (Legado - Não Usado)             │
├─────────────────────────────────────────────────────────┤
│  Container: supabase_db_chefiapp-pos-core              │
│  Porta: 54322                                           │
│  Status: ⚠️ Rodando mas não usado                       │
└─────────────────────────────────────────────────────────┘
```

---

**Conclusão:** Seu banco está no Docker Core, porta 54320, container `chefiapp-core-postgres`. Este é o banco que você deve usar para desenvolvimento.
