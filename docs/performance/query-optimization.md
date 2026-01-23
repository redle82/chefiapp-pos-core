# ⚡ Otimização de Queries - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado

---

## 🎯 OBJETIVO

Otimizar queries críticas para suportar até 100 restaurantes com p95 < 500ms.

---

## 📊 QUERIES CRÍTICAS

### 1. Buscar Pedidos por Restaurante

**Query Original:**
```sql
SELECT * FROM gm_orders 
WHERE restaurant_id = 'xxx' 
ORDER BY created_at DESC;
```

**Otimização:**
```sql
-- Usar índice composto
SELECT id, table_id, status, total_amount, created_at 
FROM gm_orders 
WHERE restaurant_id = 'xxx' 
ORDER BY created_at DESC 
LIMIT 50; -- Sempre usar LIMIT
```

**Índice:**
```sql
CREATE INDEX idx_gm_orders_restaurant_status_created 
ON gm_orders(restaurant_id, status, created_at DESC);
```

---

### 2. Buscar Produtos Disponíveis

**Query Original:**
```sql
SELECT * FROM gm_products 
WHERE restaurant_id = 'xxx' AND available = true;
```

**Otimização:**
```sql
-- Usar índice parcial
SELECT id, name, price_cents, category_id 
FROM gm_products 
WHERE restaurant_id = 'xxx' AND available = true;
```

**Índice:**
```sql
CREATE INDEX idx_gm_products_restaurant_category_available 
ON gm_products(restaurant_id, category_id, available) 
WHERE available = true;
```

---

### 3. Buscar Pedidos por Status

**Query Original:**
```sql
SELECT * FROM gm_orders 
WHERE restaurant_id = 'xxx' AND status = 'pending';
```

**Otimização:**
```sql
-- Usar índice composto
SELECT id, table_id, total_amount, created_at 
FROM gm_orders 
WHERE restaurant_id = 'xxx' AND status = 'pending' 
ORDER BY created_at ASC;
```

**Índice:**
```sql
CREATE INDEX idx_gm_orders_restaurant_status_created 
ON gm_orders(restaurant_id, status, created_at DESC);
```

---

## 🔍 IDENTIFICAR QUERIES LENTAS

### Usar pg_stat_statements

```sql
-- Habilitar extensão (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Ver queries mais lentas
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%gm_orders%'
ORDER BY mean_time DESC
LIMIT 10;
```

---

### Usar EXPLAIN ANALYZE

```sql
-- Analisar query específica
EXPLAIN ANALYZE
SELECT * FROM gm_orders 
WHERE restaurant_id = 'xxx' 
AND status = 'pending';
```

**Interpretar resultados:**
- **Seq Scan:** Ruim (sem índice)
- **Index Scan:** Bom (usa índice)
- **Execution Time:** Deve ser < 500ms

---

## 📈 MÉTRICAS DE PERFORMANCE

### Targets

- **p95:** < 500ms
- **p99:** < 1s
- **Média:** < 200ms

### Monitoramento

```sql
-- Query para monitorar performance
SELECT 
  restaurant_id,
  COUNT(*) as query_count,
  AVG(execution_time) as avg_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time) as p99
FROM query_logs -- Tabela hipotética
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY restaurant_id;
```

---

## 🛠️ BOAS PRÁTICAS

### 1. Sempre usar LIMIT

```sql
-- ❌ Ruim
SELECT * FROM gm_orders WHERE restaurant_id = 'xxx';

-- ✅ Bom
SELECT * FROM gm_orders WHERE restaurant_id = 'xxx' LIMIT 50;
```

### 2. SELECT específico (não SELECT *)

```sql
-- ❌ Ruim
SELECT * FROM gm_orders;

-- ✅ Bom
SELECT id, table_id, status, total_amount FROM gm_orders;
```

### 3. Usar índices compostos

```sql
-- ✅ Bom: Índice cobre WHERE + ORDER BY
CREATE INDEX idx_orders_restaurant_status_created 
ON gm_orders(restaurant_id, status, created_at DESC);
```

### 4. Evitar N+1 queries

```sql
-- ❌ Ruim: N+1 queries
SELECT * FROM gm_orders WHERE restaurant_id = 'xxx';
-- Depois, para cada order:
SELECT * FROM gm_order_items WHERE order_id = 'yyy';

-- ✅ Bom: JOIN ou query única
SELECT o.*, json_agg(i.*) as items
FROM gm_orders o
LEFT JOIN gm_order_items i ON i.order_id = o.id
WHERE o.restaurant_id = 'xxx'
GROUP BY o.id;
```

---

## 📚 REFERÊNCIAS

- **PostgreSQL Performance:** https://www.postgresql.org/docs/current/performance-tips.html
- **pg_stat_statements:** https://www.postgresql.org/docs/current/pgstatstatements.html
- **EXPLAIN:** https://www.postgresql.org/docs/current/sql-explain.html

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado
