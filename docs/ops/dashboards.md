# 📊 Dashboards Operacionais - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado

---

## 🎯 OBJETIVO

Criar dashboards operacionais para monitorar métricas por tenant e agregadas. Suportar até 100 restaurantes.

---

## 📊 DASHBOARDS NECESSÁRIOS

### 1. Dashboard de Métricas por Tenant

**Objetivo:** Monitorar métricas individuais de cada restaurante

**Métricas:**
- Número de pedidos por dia
- Performance de queries (p95, p99)
- Erros por tenant
- Uso de recursos
- Status de assinatura
- Última atividade

**Ferramenta:** Supabase Dashboard (nativo) ou Metabase

**Queries SQL:**

```sql
-- Pedidos por dia por restaurante
SELECT 
  restaurant_id,
  DATE(created_at) as date,
  COUNT(*) as order_count
FROM gm_orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY restaurant_id, DATE(created_at)
ORDER BY date DESC, restaurant_id;

-- Performance de queries (p95, p99)
-- Usar pg_stat_statements ou Supabase Analytics

-- Erros por tenant (via audit_logs)
SELECT 
  tenant_id,
  COUNT(*) as error_count
FROM gm_audit_logs
WHERE action = 'ERROR'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY tenant_id
ORDER BY error_count DESC;

-- Status de assinatura
SELECT 
  restaurant_id,
  plan,
  status,
  current_period_end
FROM gm_billing_subscriptions
WHERE status IN ('active', 'trialing', 'past_due');
```

---

### 2. Dashboard Agregado (Admin)

**Objetivo:** Visão geral do sistema

**Métricas:**
- Total de restaurantes ativos
- Total de pedidos (hoje, semana, mês)
- Revenue total (se billing implementado)
- Health geral do sistema
- Taxa de erro agregada
- Performance média (p95, p99)

**Queries SQL:**

```sql
-- Total de restaurantes ativos
SELECT COUNT(*) as active_restaurants
FROM gm_restaurants
WHERE status = 'active';

-- Total de pedidos (hoje)
SELECT COUNT(*) as orders_today
FROM gm_orders
WHERE DATE(created_at) = CURRENT_DATE;

-- Revenue total (mês atual)
SELECT 
  SUM(amount_cents) / 100.0 as revenue_eur
FROM gm_billing_invoices
WHERE status = 'paid'
  AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE);

-- Health geral
SELECT 
  COUNT(*) FILTER (WHERE status = 'healthy') as healthy_checks,
  COUNT(*) FILTER (WHERE status = 'unhealthy') as unhealthy_checks
FROM (
  -- Simular health checks (em produção, usar tabela de health checks)
  SELECT 'healthy' as status
  UNION ALL
  SELECT 'unhealthy'
) checks;
```

---

## 🔧 IMPLEMENTAÇÃO

### Opção 1: Supabase Dashboard (Nativo)

**Vantagens:**
- ✅ Já integrado
- ✅ Sem configuração adicional
- ✅ Queries SQL diretas

**Como usar:**
1. Acesse Supabase Dashboard
2. Vá em **SQL Editor**
3. Crie queries salvos
4. Visualize resultados

---

### Opção 2: Metabase (Recomendado para escala)

**Vantagens:**
- ✅ Dashboards visuais
- ✅ Gráficos interativos
- ✅ Compartilhamento fácil
- ✅ Alertas integrados

**Setup:**
1. Instalar Metabase (Docker ou self-hosted)
2. Conectar ao Supabase PostgreSQL
3. Criar dashboards
4. Configurar refresh automático

**Configuração:**
```yaml
# docker-compose.yml
metabase:
  image: metabase/metabase
  ports:
    - "3000:3000"
  environment:
    MB_DB_TYPE: postgres
    MB_DB_DBNAME: postgres
    MB_DB_HOST: db.xxxxx.supabase.co
    MB_DB_USER: postgres
    MB_DB_PASS: [password]
```

---

### Opção 3: Grafana (Enterprise)

**Vantagens:**
- ✅ Dashboards profissionais
- ✅ Alertas avançados
- ✅ Integração com múltiplas fontes

**Setup:**
1. Instalar Grafana
2. Conectar ao PostgreSQL
3. Criar dashboards
4. Configurar alertas

---

## 📈 MÉTRICAS RECOMENDADAS

### Por Tenant
- Pedidos/dia (últimos 30 dias)
- Revenue/mês
- Taxa de erro (últimas 24h)
- Performance p95 (últimas 24h)
- Status de assinatura
- Última atividade

### Agregado
- Total restaurantes ativos
- Total pedidos (hoje, semana, mês)
- Revenue total (mês)
- Taxa de erro agregada
- Performance média (p95, p99)
- Health geral

---

## 🔄 REFRESH AUTOMÁTICO

### Supabase Dashboard
- Manual (atualizar query)
- Ou usar cron jobs para atualizar tabelas materializadas

### Metabase/Grafana
- Configurar refresh automático (ex: a cada 5 minutos)
- Cache configurável

---

## 📚 REFERÊNCIAS

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Metabase Docs:** https://www.metabase.com/docs
- **Grafana Docs:** https://grafana.com/docs

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado
