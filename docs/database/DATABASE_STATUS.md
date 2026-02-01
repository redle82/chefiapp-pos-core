# Status do Banco de Dados - Verificação Completa

**Data:** 2026-01-25  
**Hora:** 21:09

---

## Resultados da Verificação

### 1. Docker Core - Status dos Containers

| Container | Status | Porta | Saúde |
|-----------|--------|-------|-------|
| `chefiapp-core-postgres` | ✅ Up 5 hours | `54320` | Healthy |
| `chefiapp-core-postgrest` | ✅ Up 5 hours | `3001` | Running |
| `chefiapp-core-realtime` | ⚠️ Restarting | `4000` | Problema |

**Observação:** O Realtime está reiniciando. Isso pode afetar sincronização em tempo real, mas não impede operações básicas.

---

### 2. Conectividade

**Postgres:**
- ✅ `pg_isready` responde: `/var/run/postgresql:5432 - accepting connections`
- ✅ Versão: PostgreSQL 15.15
- ✅ Banco `chefiapp_core` existe

**PostgREST:**
- ✅ Responde em `http://localhost:3001`

**Realtime:**
- ❌ Não responde em `http://localhost:4000/health` (container reiniciando)

---

### 3. Schema e RPCs

**RPC `create_order_atomic`:**
- ✅ Existe e está funcional
- ✅ Assinatura: `(p_restaurant_id uuid, p_items jsonb, p_payment_method text DEFAULT 'cash', p_sync_metadata jsonb DEFAULT NULL)`

**Constraint `idx_one_open_order_per_table`:**
- ✅ Existe e está ativa
- ✅ Tipo: unique, btree
- ✅ Predicado: `status = 'OPEN' AND table_id IS NOT NULL`

**Tabelas Principais:**
- ✅ `gm_restaurants`
- ✅ `gm_orders`
- ✅ `gm_order_items`
- ✅ `gm_products`
- ✅ `gm_tables`
- ✅ `gm_menu_categories`
- ✅ `saas_tenants`

---

### 4. Dados no Banco

**Restaurantes:**
- Total: **1 restaurante**
- Exemplo: `Restaurante Piloto` (slug: `restaurante-piloto`, ID: `00000000-0000-0000-0000-000000000100`)

**Mesas:**
- Total: **10 mesas**
- Estrutura: `id`, `number`, `status`, `qr_code`, `restaurant_id`

**Produtos:**
- Total: **7 produtos**
- Exemplos: Bruschetta (€8.50), Nachos (€12.00), Hambúrguer Artesanal (€18.00), Pizza Margherita (€16.00), Água (€2.00)

**Pedidos:**
- Total: **312 pedidos**
- Últimos pedidos têm origem `OFFLINE_REPLAY` (testes de sincronização offline)

---

## Estrutura da Tabela `gm_tables`

**Colunas:**
- `id` (uuid, PK)
- `restaurant_id` (uuid, FK para gm_restaurants)
- `number` (integer, NOT NULL)
- `qr_code` (text, nullable)
- `status` (text, default: 'closed')
- `created_at` (timestamptz, default: now())

**Constraints:**
- UNIQUE: `(restaurant_id, number)` - Não pode ter duas mesas com mesmo número no mesmo restaurante
- FK: `restaurant_id` referencia `gm_restaurants(id)`

**Nota:** A tabela não tem coluna `is_active` nem `zone`. Use `status` para verificar se mesa está ativa.

---

## Problemas Identificados

### Realtime Reiniciando

**Sintoma:** Container `chefiapp-core-realtime` está em loop de restart.

**Impacto:**
- Sincronização em tempo real pode não funcionar
- KDS pode não receber atualizações automáticas
- TPV pode não sincronizar em tempo real

**Solução:**
```bash
cd docker-core
docker compose -f docker-compose.core.yml logs realtime
# Verificar erro específico e corrigir
docker compose -f docker-compose.core.yml restart realtime
```

---

## Comandos de Verificação Rápida

```bash
# Status geral
docker ps --filter "name=chefiapp-core"

# Conectividade Postgres
docker exec chefiapp-core-postgres pg_isready -U postgres

# Conectividade PostgREST
curl http://localhost:3001

# Verificar dados
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core \
  -c "SELECT 
    (SELECT COUNT(*) FROM gm_restaurants) as restaurants,
    (SELECT COUNT(*) FROM gm_tables) as tables,
    (SELECT COUNT(*) FROM gm_products) as products,
    (SELECT COUNT(*) FROM gm_orders) as orders;"
```

---

## Conclusão

**Banco Principal:** ✅ Funcional  
**PostgREST:** ✅ Funcional  
**Realtime:** ⚠️ Com problemas (reiniciando)  
**Dados:** ✅ Presentes (1 restaurante, 10 mesas, 7 produtos, 312 pedidos)

**Recomendação:** Investigar e corrigir o problema do Realtime para garantir sincronização em tempo real completa.
