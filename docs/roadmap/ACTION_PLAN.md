# 🎯 Plano de Ação - Próximos Passos Práticos

**Data:** 2026-01-24  
**Status:** ✅ Roadmap Completo - Pronto para Validação Humana

---

## 🚨 PRIORIDADE MÁXIMA: Bloqueadores de UX

**ANTES de qualquer validação técnica, corrigir:**

👉 **[docs/audit/UX_BLOCKERS.md](../audit/UX_BLOCKERS.md)** - 4 erros críticos (1-2 dias)

**Estes bloqueadores impedem uso real com clientes.**

---

## ⚡ AÇÃO IMEDIATA (HOJE - 2 horas)

### 1. Revisar o que foi feito (15 min)
```bash
# Ler resumo executivo
cat docs/roadmap/FINAL_SUMMARY.md

# Ver índice completo
cat docs/roadmap/INDEX.md
```

### 2. Configurar ambiente local (30 min)
```bash
# Verificar variáveis de ambiente
cat mobile-app/.env
cat merchant-portal/.env

# Configurar se necessário:
# - EXPO_PUBLIC_SENTRY_DSN
# - EXPO_PUBLIC_SUPABASE_URL
# - VITE_SUPABASE_URL
```

### 3. Aplicar migrations em staging (45 min)
```bash
# Conectar ao Supabase staging
supabase link --project-ref [staging-project-ref]

# Aplicar migrations
supabase migration up

# Verificar status
supabase migration list
```

### 4. Testar funcionalidades críticas (30 min)
```bash
# Teste de isolamento
npm test -- isolation-test.ts

# Health check
curl https://[project].supabase.co/functions/v1/health
```

---

## 📅 ESTA SEMANA (4-8 horas)

### Dia 1-2: Validação Completa

**Executar checklist:**
```bash
# Abrir checklist
open docs/roadmap/VALIDATION_CHECKLIST.md

# Executar cada item:
# ✅ Fase 0: Monitoramento, Rollback, Health Checks
# ✅ Fase 1: RLS, Isolamento, Context Switching
# ✅ Fase 2: Billing, Provisioning, Logging
# ✅ Fase 3: Performance, Caching, Tickets
# ✅ Fase 4: APM, Disaster Recovery
```

**Testes end-to-end:**
1. Provisionar restaurante via UI
2. Fazer login como owner
3. Criar pedido
4. Validar isolamento
5. Testar billing (se configurado)

---

### Dia 3-4: Configuração de Produção

**Sentry:**
1. Criar projeto em https://sentry.io
2. Obter DSN
3. Configurar em `mobile-app/app.json`
4. Testar captura de erros

**Stripe (se billing ativo):**
1. Criar conta Stripe
2. Obter API keys
3. Configurar webhook: `https://[project].supabase.co/functions/v1/stripe-billing-webhook`
4. Testar checkout

**Alertas:**
1. Configurar UptimeRobot (health checks)
2. Configurar alertas no Sentry
3. Testar notificações

---

### Dia 5: Deploy em Staging

**Aplicar migrations:**
```bash
supabase migration up
```

**Deploy apps:**
```bash
# Mobile App
cd mobile-app
eas build --profile staging
eas update --branch staging

# Merchant Portal
cd merchant-portal
npm run build
# Deploy para staging
```

**Validar:**
- [ ] Health checks funcionando
- [ ] Provisioning funcionando
- [ ] Billing funcionando (se configurado)
- [ ] Logs aparecendo no Sentry

---

## 📅 PRÓXIMAS 2 SEMANAS

### Semana 1: Testes com Pilotos

**Objetivo:** Validar com 3-5 restaurantes reais

**Passos:**
1. Provisionar 3-5 restaurantes
2. Onboard owners
3. Coletar feedback
4. Iterar melhorias

**Métricas a coletar:**
- Performance (p95, p99)
- Taxa de erro
- Tempo de provisioning
- Satisfação dos usuários

---

### Semana 2: Preparação para Produção

**Checklist final:**
- [ ] Todas as validações passando
- [ ] Performance validada (< 500ms p95)
- [ ] Alertas configurados
- [ ] Backups configurados
- [ ] Equipe treinada
- [ ] Documentação revisada

**Deploy em produção:**
1. Aplicar migrations
2. Deploy de apps
3. Monitorar por 7 dias
4. Coletar métricas

---

## 🔧 COMANDOS ESSENCIAIS

### Provisioning
```bash
# Via script
./scripts/provision-restaurant.sh "Nome" "email@example.com" "password"

# Via UI
# Acessar: /app/admin/provision-restaurant
```

### Health Check
```bash
# Backend
curl https://[project].supabase.co/functions/v1/health

# Client-side
# Usar: mobile-app/services/healthCheck.ts
```

### Rollback
```bash
# Migration
./scripts/rollback-migration.sh

# App (Expo EAS)
eas update:rollback
```

### Testes
```bash
# Isolamento
npm test -- isolation-test.ts

# Reprodutibilidade
./scripts/reproduce-bug.sh TICKET-123 restaurant-id
```

---

## 📊 MÉTRICAS DE SUCESSO

### Performance
- ✅ p95 < 500ms para queries críticas
- ✅ p99 < 1s para queries críticas
- ✅ Health check < 200ms

### Funcionalidade
- ✅ Provisioning < 2 minutos
- ✅ Isolamento 100% funcional
- ✅ Billing funcionando (se ativo)

### Observabilidade
- ✅ Logs sendo coletados
- ✅ Alertas configurados
- ✅ Dashboards funcionando

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Migration Falha
```bash
# Ver logs
supabase migration list

# Rollback
./scripts/rollback-migration.sh
```

### RLS Bloqueando
```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'gm_orders';

-- Testar função
SELECT get_user_restaurants();
```

### Performance Lenta
```sql
-- Verificar índices
SELECT indexname FROM pg_indexes WHERE tablename = 'gm_orders';

-- Analisar query
EXPLAIN ANALYZE SELECT * FROM gm_orders WHERE restaurant_id = 'xxx';
```

---

## 📚 DOCUMENTAÇÃO ESSENCIAL

### Para Começar
- **START_HERE_ROADMAP.md** - Visão geral
- **VALIDATION_CHECKLIST.md** - Validar tudo
- **NEXT_STEPS.md** - Próximos passos
- **HANDOFF.md** - Handoff completo

### Para Operação
- **monitoring.md** - Monitoramento
- **rollback-procedure.md** - Rollback
- **health-checks.md** - Health checks
- **provisioning.md** - Provisioning

### Para Referência
- **QUICK_REFERENCE.md** - Referência rápida
- **INDEX.md** - Índice completo
- **FINAL_SUMMARY.md** - Resumo executivo

---

## ✅ CHECKLIST FINAL

### Antes de Deploy em Produção
- [ ] Todas as migrations aplicadas em staging
- [ ] Teste de isolamento passando
- [ ] Health checks funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Sentry configurado e testado
- [ ] Stripe configurado (se billing ativo)
- [ ] Alertas configurados
- [ ] Backups configurados
- [ ] Equipe treinada
- [ ] Documentação revisada

---

## 🎯 CONCLUSÃO

**Status:** ✅ Roadmap 100% Completo (Estrutural)  
**Próximo passo:** Corrigir bloqueadores de UX → Rodar 1 turno real  
**Tempo estimado:** 1-2 dias (UX) + 1 turno (validação) + ajustes

**Foco:** Humanos > Código  
**Ver:** [`docs/audit/HUMAN_NEXT_STEPS.md`](../audit/HUMAN_NEXT_STEPS.md)

**Documentos essenciais:**
1. Este documento (ACTION_PLAN.md)
2. VALIDATION_CHECKLIST.md
3. NEXT_STEPS.md
4. HANDOFF.md

**Boa sorte! 🚀**

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Pronto para Execução
