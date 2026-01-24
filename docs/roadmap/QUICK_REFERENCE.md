# ⚡ Quick Reference - ChefIApp Multi-Tenant

**Última atualização:** 2026-01-22  
**Status:** ✅ **ROADMAP 100% COMPLETO**

---

## 🎯 STATUS ATUAL

✅ **Roadmap 100% executado** (5 fases, 25 tasks)  
✅ **Sistema pronto para 500 restaurantes**  
⏳ **Aguardando validação e deploy**

---

## 🚀 AÇÕES IMEDIATAS

### 1. Validar Implementações
```bash
# Ver checklist completo
cat docs/roadmap/VALIDATION_CHECKLIST.md

# Executar testes críticos
npm test -- isolation-test.ts
```

### 2. Aplicar Migrations
```bash
# Staging primeiro
supabase migration up

# Verificar status
supabase migration list
```

### 3. Configurar Variáveis
```bash
# Mobile App
EXPO_PUBLIC_SENTRY_DSN=your-dsn
EXPO_PUBLIC_SUPABASE_URL=your-url

# Merchant Portal
VITE_SUPABASE_URL=your-url
```

---

## 📋 COMANDOS ESSENCIAIS

### Provisioning
```bash
# Via script
./scripts/provision-restaurant.sh "Nome" "email@example.com" "password"

# Via UI
# Acessar: /app/admin/provision-restaurant
```

### Health Check
```bash
curl https://[project].supabase.co/functions/v1/health
```

### Rollback
```bash
# Migration
./scripts/rollback-migration.sh

# App
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

## 📊 ROTAS IMPORTANTES

### Merchant Portal
- `/app/admin/provision-restaurant` - Provisioning
- `/app/settings/billing` - Billing
- `/app/settings` - Settings

### Mobile App
- Context switching via `RestaurantContext`
- Seleção em `/app/(tabs)/settings`

---

## 🗂️ ESTRUTURA PRINCIPAL

### Migrations (10)
```
supabase/migrations/
├── 20260122170643_audit_restaurant_id.sql
├── 20260122170644_add_restaurant_id_indexes.sql
├── 20260122170645_create_helper_functions.sql
├── 20260122170646_ensure_rls_complete.sql
├── 20260122170647_create_billing_tables.sql
├── 20260122170648_performance_optimization.sql
└── 20260122170649_support_tickets.sql
```

### Serviços (5)
```
mobile-app/services/
├── logging.ts          # Sentry + Supabase
├── healthCheck.ts      # Health checks
└── cache.ts            # Caching
```

### UIs (2)
```
merchant-portal/src/pages/
├── Admin/ProvisionRestaurantPage.tsx
└── Settings/BillingPage.tsx
```

---

## 📚 DOCUMENTAÇÃO PRINCIPAL

### Para Começar
- **START_HERE_ROADMAP.md** - Ponto de entrada
- **VALIDATION_CHECKLIST.md** - Checklist de validação
- **NEXT_STEPS.md** - Próximos passos
- **HANDOFF.md** - Handoff completo

### Operação
- **monitoring.md** - Monitoramento
- **rollback-procedure.md** - Rollback
- **health-checks.md** - Health checks
- **provisioning.md** - Provisioning

### Arquitetura
- **tenant-model.md** - Multi-tenant
- **query-optimization.md** - Performance

---

## ⚠️ PONTOS CRÍTICOS

### RLS (Row-Level Security)
- ✅ Todas as policies implementadas
- ✅ Funções helper criadas
- ⚠️ Sempre testar isolamento

### Performance
- ✅ Índices criados
- ✅ Cache implementado
- ⚠️ Target: p95 < 500ms

### Billing
- ✅ Tabelas criadas
- ✅ Webhooks configurados
- ⚠️ Validar Stripe config

---

## 🧪 TESTES RÁPIDOS

### Isolamento
```bash
npm test -- isolation-test.ts
```

### Health Check
```bash
curl https://[project].supabase.co/functions/v1/health
```

### Provisioning
```bash
./scripts/provision-restaurant.sh "Test" "test@example.com" "pass123"
```

---

## 🆘 TROUBLESHOOTING

### Migration Falha
```bash
./scripts/rollback-migration.sh
```

### RLS Bloqueando
```sql
SELECT get_user_restaurants();
```

### Performance Lenta
```sql
EXPLAIN ANALYZE SELECT * FROM gm_orders WHERE restaurant_id = 'xxx';
```

---

## ✅ CHECKLIST RÁPIDO

### Antes de Deploy
- [ ] Migrations aplicadas em staging
- [ ] Teste de isolamento passando
- [ ] Health checks funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Sentry configurado
- [ ] Stripe configurado (se billing ativo)

---

## 🎯 PRÓXIMOS PASSOS

1. **Validar:** Executar `VALIDATION_CHECKLIST.md`
2. **Configurar:** Variáveis de ambiente
3. **Testar:** Com 3-5 restaurantes piloto
4. **Deploy:** Em produção quando validado

---

**Versão:** 2.0  
**Data:** 2026-01-22  
**Status:** ✅ Roadmap Completo - Ver VALIDATION_CHECKLIST.md
