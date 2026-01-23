# 🔧 Troubleshooting - Roadmap Multi-Tenant ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-24

---

## 🎯 OBJETIVO

Guia rápido de troubleshooting para problemas comuns durante implementação do multi-tenancy.

---

## 🐛 PROBLEMAS COMUNS

### 1. RLS Policy Não Está Funcionando

**Sintoma:** Usuário consegue ver dados de outros restaurantes

**Diagnóstico:**
```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'gm_orders';

-- Verificar policies existentes
SELECT * FROM pg_policies 
WHERE tablename = 'gm_orders';
```

**Solução:**
1. Verificar se RLS está habilitado: `ALTER TABLE gm_orders ENABLE ROW LEVEL SECURITY;`
2. Verificar se policy existe e está correta
3. Verificar se função `get_user_restaurant_id()` está funcionando
4. Testar com usuário de teste

**Prevenção:**
- Executar testes de isolamento antes de cada deploy
- Validar policies em staging primeiro

---

### 2. Query Lenta com RLS

**Sintoma:** Query demora > 1s mesmo com índice

**Diagnóstico:**
```sql
-- Analisar query
EXPLAIN ANALYZE
SELECT * FROM gm_orders 
WHERE restaurant_id = '...';
```

**Solução:**
1. Verificar se índice em `restaurant_id` existe
2. Verificar se índice está sendo usado (EXPLAIN ANALYZE)
3. Criar índice composto se necessário: `(restaurant_id, status, created_at)`
4. Verificar se função `get_user_restaurant_id()` é STABLE

**Prevenção:**
- Criar índices desde o início
- Monitorar performance regularmente

---

### 3. Provisioning Falha

**Sintoma:** Script de provisioning retorna erro

**Diagnóstico:**
```bash
# Executar script com debug
bash -x ./scripts/provision-restaurant.sh "Nome" "email@example.com"
```

**Problemas Comuns:**
- Usuário não existe → Criar via Supabase Dashboard
- Slug duplicado → Usar slug único
- Permissões insuficientes → Verificar RLS policies

**Solução:**
1. Verificar logs do script
2. Verificar se usuário existe
3. Verificar se slug é único
4. Verificar permissões (RLS)

**Prevenção:**
- Validar inputs antes de executar
- Testar em staging primeiro

---

### 4. Context Switching Não Funciona

**Sintoma:** AppStaff não filtra dados por restaurante

**Diagnóstico:**
```typescript
// Verificar se RestaurantContext está sendo usado
console.log('Current restaurant:', currentRestaurantId);

// Verificar se queries filtram por restaurant_id
console.log('Query:', query);
```

**Solução:**
1. Verificar se `RestaurantContext` está sendo usado
2. Verificar se `currentRestaurantId` está sendo passado
3. Verificar se queries filtram por `restaurant_id`
4. Verificar se RLS está funcionando (backup)

**Prevenção:**
- Sempre usar `RestaurantContext` em queries
- RLS garante isolamento mesmo se filtro falhar

---

### 5. Billing Não Está Funcionando

**Sintoma:** Webhooks do Stripe não estão sendo processados

**Diagnóstico:**
```bash
# Verificar logs da Edge Function
supabase functions logs stripe-webhook
```

**Problemas Comuns:**
- Webhook não configurado no Stripe Dashboard
- Assinatura webhook inválida
- Edge Function com erro

**Solução:**
1. Verificar configuração do webhook no Stripe
2. Verificar assinatura do webhook
3. Verificar logs da Edge Function
4. Testar webhook manualmente

**Prevenção:**
- Testar webhooks em staging primeiro
- Validar assinatura do webhook
- Adicionar logging detalhado

---

### 6. Performance Degradada com Múltiplos Tenants

**Sintoma:** Queries ficam lentas com 20+ restaurantes

**Diagnóstico:**
```sql
-- Identificar queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solução:**
1. Criar índices faltantes
2. Otimizar queries (evitar SELECT *, usar LIMIT)
3. Implementar caching
4. Considerar read replicas (Fase 4)

**Prevenção:**
- Criar índices desde o início
- Monitorar performance regularmente
- Otimizar queries antes de escalar

---

### 7. Teste de Isolamento Falha

**Sintoma:** `tests/isolation-test.ts` retorna erro

**Diagnóstico:**
```bash
# Executar teste com debug
npx tsx tests/isolation-test.ts
```

**Problemas Comuns:**
- RLS policies não implementadas
- Função `get_user_restaurant_id()` não funciona
- Dados de teste não foram limpos

**Solução:**
1. Verificar se RLS policies estão implementadas
2. Verificar se função helper funciona
3. Limpar dados de teste
4. Executar teste novamente

**Prevenção:**
- Executar testes antes de cada deploy
- Validar RLS em staging primeiro

---

### 8. Migration Falha

**Sintoma:** Migration retorna erro ao executar

**Diagnóstico:**
```bash
# Verificar status das migrations
supabase migration list

# Verificar logs
supabase db logs
```

**Problemas Comuns:**
- Migration não é idempotente
- Dependência de migration anterior
- Erro de sintaxe SQL

**Solução:**
1. Verificar se migration é idempotente (usar `IF NOT EXISTS`)
2. Verificar ordem das migrations
3. Verificar sintaxe SQL
4. Executar rollback se necessário

**Prevenção:**
- Sempre usar `IF NOT EXISTS` em migrations
- Testar migrations em staging primeiro
- Validar sintaxe antes de aplicar

---

### 9. Health Check Falha

**Sintoma:** Health check retorna `unhealthy`

**Diagnóstico:**
```bash
# Testar health check manualmente
curl https://your-project.supabase.co/functions/v1/health-check
```

**Problemas Comuns:**
- Conexão com banco falhando
- RLS policies quebradas
- Performance degradada

**Solução:**
1. Verificar conexão com banco
2. Verificar RLS policies
3. Verificar performance de queries
4. Verificar logs da Edge Function

**Prevenção:**
- Monitorar health checks regularmente
- Configurar alertas

---

### 10. Rollback Não Funciona

**Sintoma:** Rollback de migration falha

**Diagnóstico:**
```bash
# Verificar status das migrations
supabase migration list

# Tentar rollback manual
supabase migration down
```

**Problemas Comuns:**
- Migration não tem rollback definido
- Dependências de outras migrations
- Dados já foram modificados

**Solução:**
1. Verificar se migration tem rollback
2. Verificar dependências
3. Fazer backup antes de rollback
4. Executar rollback manual se necessário

**Prevenção:**
- Sempre definir rollback em migrations
- Fazer backup antes de migrations críticas
- Testar rollback em staging primeiro

---

## 🔍 COMANDOS ÚTEIS

### Verificar RLS
```sql
-- Listar todas as policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Verificar Performance
```sql
-- Queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Verificar Índices
```sql
-- Índices em restaurant_id
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef LIKE '%restaurant_id%';
```

### Verificar Isolamento
```bash
# Executar teste automatizado
npx tsx tests/isolation-test.ts
```

---

## 📞 SUPORTE

### Documentação
- **Roadmap:** [MULTI_TENANT_ROADMAP.md](./MULTI_TENANT_ROADMAP.md)
- **Arquitetura:** [../architecture/MULTI_TENANT_ARCHITECTURE.md](../architecture/MULTI_TENANT_ARCHITECTURE.md)
- **Migrations:** [MIGRATION_EXAMPLES.md](./MIGRATION_EXAMPLES.md)

### Logs
- **Supabase Dashboard:** Ver logs de queries e functions
- **Sentry:** Ver erros e crashes
- **Health Checks:** Ver status do sistema

---

**Versão:** 1.0  
**Data:** 2026-01-24
