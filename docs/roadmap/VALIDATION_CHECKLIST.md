# ✅ Checklist de Validação - Roadmap Multi-Tenant

**Data:** 2026-01-22  
**Status:** Pronto para Validação

---

## 🎯 OBJETIVO

Validar todas as implementações do roadmap antes de deploy em produção.

---

## 📋 CHECKLIST POR FASE

### ✅ FASE 0: Go-Live Controlado

#### [F0-001] Monitoramento Básico
- [ ] Sentry configurado e funcionando
- [ ] Logs aparecendo no Sentry Dashboard
- [ ] Breadcrumbs funcionando
- [ ] Contexto de tenant nos logs
- [ ] ErrorBoundary capturando erros de UI

**Como testar:**
```bash
# 1. Forçar erro no app
# 2. Verificar Sentry Dashboard
# 3. Validar que logs incluem restaurant_id
```

---

#### [F0-002] Rollback
- [ ] Script `rollback-migration.sh` executável
- [ ] Documentação de rollback lida
- [ ] Processo de rollback testado em staging

**Como testar:**
```bash
# 1. Aplicar migration de teste
# 2. Executar rollback
# 3. Validar que rollback funcionou
```

---

#### [F0-003] Health Checks
- [ ] Health check endpoint funcionando
- [ ] Health check retorna status correto
- [ ] Métricas de performance sendo coletadas
- [ ] RLS check funcionando

**Como testar:**
```bash
# 1. Acessar /functions/v1/health
# 2. Validar resposta JSON
# 3. Verificar métricas (database, auth, RLS, performance)
```

---

### ✅ FASE 1: Multi-Restaurante Piloto

#### [F1-001] Auditoria de Tabelas
- [ ] Migration `audit_restaurant_id.sql` executada
- [ ] Todas as tabelas têm `restaurant_id` ou `tenant_id`
- [ ] Índices criados em `restaurant_id`

**Como testar:**
```sql
-- Verificar tabelas sem restaurant_id
SELECT table_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'restaurant_id';
```

---

#### [F1-002] RLS Policies
- [ ] RLS habilitado em todas as tabelas críticas
- [ ] Policies usando `get_user_restaurants()`
- [ ] Teste de isolamento passando

**Como testar:**
```bash
# Executar teste de isolamento
npm test -- isolation-test.ts
```

---

#### [F1-003] Tabela de Associação
- [ ] Tabela `gm_restaurant_members` existe
- [ ] Função `get_user_restaurants()` funcionando
- [ ] Função `get_user_restaurant_id()` funcionando

**Como testar:**
```sql
-- Testar função
SELECT get_user_restaurants();
SELECT get_user_restaurant_id();
```

---

#### [F1-004] Context Switching
- [ ] `RestaurantContext` funcionando
- [ ] Seletor de restaurante na UI
- [ ] Dados isolados por restaurante

**Como testar:**
1. Fazer login com usuário multi-restaurante
2. Trocar restaurante ativo
3. Validar que dados mudam

---

#### [F1-005] Script de Provisioning
- [ ] Script `provision-restaurant.sh` executável
- [ ] Script cria restaurante corretamente
- [ ] Dados seed criados

**Como testar:**
```bash
./scripts/provision-restaurant.sh "Test Restaurant" "test@example.com" "password123"
```

---

#### [F1-007] Testes de Isolamento
- [ ] Teste `isolation-test.ts` passando
- [ ] Isolamento validado com 2 restaurantes

**Como testar:**
```bash
npm test -- isolation-test.ts
```

---

### ✅ FASE 2: Multi-Tenant Básico

#### [F2-001] API de Provisioning
- [ ] Edge Function `create-tenant` funcionando
- [ ] Provisioning via API funciona

**Como testar:**
```bash
# Chamar Edge Function
curl -X POST https://[project].supabase.co/functions/v1/create-tenant \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"restaurant_name": "Test", "owner_email": "test@example.com", "password": "password123"}'
```

---

#### [F2-002] UI de Provisioning
- [ ] Página `/app/admin/provision-restaurant` acessível
- [ ] Formulário funciona
- [ ] Provisioning via UI funciona

**Como testar:**
1. Acessar `/app/admin/provision-restaurant`
2. Preencher formulário
3. Criar restaurante
4. Validar que restaurante foi criado

---

#### [F2-003] Modelagem de Billing
- [ ] Tabelas `gm_billing_subscriptions` e `gm_billing_invoices` criadas
- [ ] RLS policies aplicadas
- [ ] Índices criados

**Como testar:**
```sql
-- Verificar tabelas
SELECT * FROM gm_billing_subscriptions LIMIT 1;
SELECT * FROM gm_billing_invoices LIMIT 1;
```

---

#### [F2-004] Integração Stripe
- [ ] Webhook `stripe-billing-webhook` funcionando
- [ ] Eventos Stripe sendo processados
- [ ] Dados sendo salvos nas tabelas de billing

**Como testar:**
1. Criar checkout session no Stripe
2. Verificar webhook sendo chamado
3. Validar dados nas tabelas

---

#### [F2-005] UI de Billing
- [ ] Página `/app/settings/billing` acessível
- [ ] Dados de subscription sendo exibidos
- [ ] Histórico de invoices sendo exibido

**Como testar:**
1. Acessar `/app/settings/billing`
2. Validar que dados aparecem
3. Testar checkout (se configurado)

---

#### [F2-006] Logging Estruturado
- [ ] Logs sendo salvos em `gm_audit_logs`
- [ ] Logs incluem `tenant_id`
- [ ] Logs incluem contexto completo

**Como testar:**
```sql
-- Verificar logs recentes
SELECT * FROM gm_audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

#### [F2-007] Health Checks Avançados
- [ ] Health check inclui verificação de RLS
- [ ] Health check inclui verificação de performance
- [ ] Métricas de tempo de resposta sendo coletadas

**Como testar:**
```bash
# Acessar health check
curl https://[project].supabase.co/functions/v1/health
```

---

### ✅ FASE 3: Multi-Tenant Robusto

#### [F3-001] Dashboards Operacionais
- [ ] Documentação lida
- [ ] Queries SQL testadas
- [ ] Dashboard configurado (se aplicável)

**Como testar:**
1. Executar queries SQL da documentação
2. Validar resultados
3. Configurar dashboard (Metabase/Grafana se necessário)

---

#### [F3-002] Sistema de Alertas
- [ ] Documentação lida
- [ ] Alertas configurados (Sentry/UptimeRobot)
- [ ] Testes de alertas realizados

**Como testar:**
1. Forçar erro crítico
2. Validar que alerta é enviado
3. Testar integração Slack/Email

---

#### [F3-003] Otimização de Queries
- [ ] Migration `performance_optimization.sql` executada
- [ ] Índices criados
- [ ] Queries otimizadas

**Como testar:**
```sql
-- Verificar índices
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
```

---

#### [F3-004] Caching Estratégico
- [ ] Serviço `cache.ts` funcionando
- [ ] Hook `useCachedMenu` funcionando
- [ ] Cache sendo usado

**Como testar:**
1. Carregar menu (primeira vez)
2. Carregar menu novamente (deve usar cache)
3. Invalidar cache e validar refresh

---

#### [F3-005] Sistema de Tickets
- [ ] Tabelas `gm_support_tickets` e `gm_support_ticket_comments` criadas
- [ ] RLS policies aplicadas
- [ ] UI básica funcionando (se criada)

**Como testar:**
```sql
-- Criar ticket de teste
INSERT INTO gm_support_tickets (restaurant_id, user_id, subject, description)
VALUES ('restaurant-id', 'user-id', 'Test', 'Test description');
```

---

#### [F3-006] Reprodutibilidade de Bugs
- [ ] Script `reproduce-bug.sh` executável
- [ ] Documentação lida
- [ ] Processo testado

**Como testar:**
```bash
./scripts/reproduce-bug.sh TICKET-123 restaurant-id
```

---

### ✅ FASE 4: Escala 500

#### [F4-001] Automação de Provisioning
- [ ] Edge Function `create-tenant` validada
- [ ] Onboarding completo (se implementado)

**Como testar:**
1. Criar restaurante via UI
2. Validar que onboarding funciona
3. Validar que dados seed são criados

---

#### [F4-002] APM e Tracing
- [ ] Documentação lida
- [ ] APM configurado (se aplicável)
- [ ] Tracing funcionando

**Como testar:**
1. Executar ações no app
2. Verificar traces no Sentry/APM
3. Validar performance metrics

---

#### [F4-003] Disaster Recovery
- [ ] Documentação lida
- [ ] Backups configurados
- [ ] Processo de restauração testado

**Como testar:**
1. Criar backup manual
2. Restaurar backup em ambiente de teste
3. Validar dados

---

## 🧪 TESTES END-TO-END

### Teste 1: Provisioning Completo
1. Criar restaurante via UI
2. Fazer login como owner
3. Validar que dados seed existem
4. Criar pedido
5. Validar isolamento

### Teste 2: Multi-Tenant Isolamento
1. Criar 2 restaurantes
2. Associar usuário a ambos
3. Trocar contexto
4. Validar que dados são isolados

### Teste 3: Billing End-to-End
1. Criar restaurante
2. Iniciar checkout Stripe
3. Completar pagamento
4. Validar webhook
5. Validar dados em `gm_billing_subscriptions`

---

## 📊 MÉTRICAS DE SUCESSO

### Performance
- [ ] p95 < 500ms para queries críticas
- [ ] p99 < 1s para queries críticas
- [ ] Health check < 200ms

### Funcionalidade
- [ ] Provisioning < 2 minutos
- [ ] Isolamento 100% funcional
- [ ] Billing funcionando

### Observabilidade
- [ ] Logs sendo coletados
- [ ] Alertas configurados
- [ ] Dashboards funcionando

---

## 🚀 PRÓXIMOS PASSOS APÓS VALIDAÇÃO

1. ✅ Executar todas as migrations em staging
2. ✅ Testar com 3-5 restaurantes piloto
3. ✅ Validar performance
4. ✅ Deploy em produção
5. ✅ Monitorar por 7 dias

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Pronto para Validação
