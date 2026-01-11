# ⚡ ACTION PLAN — Imediato (Hoje)

**Baseado em:** `PROJECT_HEALTH_AUDIT.md`  
**Status:** 🟢 Build Validado | 🔴 Testes Críticos | 🔴 Monitoring Ausente

---

## ✅ COMPLETADO (Hoje)

- [x] `npm install` → ✅ Dependências atualizadas
- [x] `type-check` → ✅ Sem erros TypeScript
- [x] `build` → ✅ Build funcionando (com warnings)
- [x] Constitution validation → ✅ Sistema limpo

---

## 🚨 PRÓXIMAS AÇÕES IMEDIATAS

### 1. 🔧 Aplicar Fix de Onboarding (URGENTE)

**Status:** ⏳ Pendente ação do usuário

**Ação:**
1. Acessar: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl
2. SQL Editor → Colar `FIX_ONBOARDING_SQL.sql`
3. Executar → Testar onboarding

**Arquivo:** `FIX_ONBOARDING_SQL.sql`  
**Guia:** `APLICAR_AGORA.md`

---

### 2. 🧪 Testar Onboarding Completo (Manual)

**Após aplicar o fix SQL:**

- [ ] Criar nova entidade (nome: "Teste")
- [ ] Verificar se avança para etapa 2
- [ ] Completar onboarding completo
- [ ] Verificar se redireciona para `/app` corretamente

---

### 3. 📦 Otimizar Build (Chunk Size)

**Problema:** Bundle principal de 938KB

**Ações:**
- [ ] Analisar imports dinâmicos
- [ ] Implementar code splitting para rotas
- [ ] Lazy load de componentes pesados
- [ ] Meta: Reduzir para <500KB

**Arquivo:** `merchant-portal/vite.config.ts`

---

## 📅 ESTA SEMANA (Prioridades)

### Testes Básicos (Crítico)

1. **FlowGate Tests**
   - [ ] Testar redirecionamentos
   - [ ] Testar estados de autenticação
   - [ ] Testar resolução de tenant

2. **RPC Tests**
   - [ ] Testar `create_tenant_atomic`
   - [ ] Testar idempotência
   - [ ] Testar constraints

3. **Coverage Setup**
   - [ ] Configurar Jest coverage
   - [ ] Adicionar script `test:coverage`
   - [ ] Meta: >30% cobertura

### Monitoring Mínimo

1. **Error Tracking**
   - [ ] Integrar Sentry (ou similar)
   - [ ] Capturar erros de frontend
   - [ ] Capturar erros de RPC

2. **Health Check**
   - [ ] Endpoint `/health`
   - [ ] Verificar DB connection
   - [ ] Verificar Supabase status

---

## 🎯 MÉTRICAS DE SUCESSO

| Ação | Critério de Sucesso |
|------|---------------------|
| Fix Onboarding | Botão "Estabelecer Entidade" funciona |
| Build Otimizado | Bundle <500KB |
| Testes Básicos | Cobertura >30% |
| Monitoring | Erros capturados automaticamente |

---

**Próxima Revisão:** Após aplicar fix SQL e testar onboarding
