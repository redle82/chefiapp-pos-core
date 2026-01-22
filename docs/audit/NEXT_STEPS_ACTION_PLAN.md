# 🎯 Plano de Ação — Próximos Passos ChefIApp

**Data:** 2026-01-30  
**Status Atual:** 85% do roadmap completo  
**Próximo Marco:** MVP Comercial (FASE 1 completa)

---

## 📊 Estado Atual Consolidado

### Fases Completas (4 de 9) ✅

| Fase | Status | Progresso |
|------|--------|-----------|
| FASE 0 | ✅ | 100% |
| FASE 2 | ✅ | 100% |
| FASE 3 | ✅ | 100% |
| FASE 4 | ✅ | 100% |

### Fases em Progresso (3 de 9) 🟢

| Fase | Status | Progresso | Bloqueador? |
|------|--------|-----------|------------|
| FASE 1 | 🟢 | 90% | ⚠️ **SIM** (deploy pendente) |
| FASE 5 | 🟢 | 90% | Não |
| FASE 6 | 🟢 | 80% | Não |

### Fases Pendentes (2 de 9) 🔴

| Fase | Status | Progresso | Prioridade |
|------|--------|-----------|------------|
| FASE 7 | 🔴 | 0% (Adiada) | Baixa |
| FASE 8 | 🔴 | 0% (Não prioritária) | Muito baixa |

---

## 🎯 Opções de Próximos Passos

### Opção 1: Finalizar FASE 1 (BLOQUEADOR) ⚠️ **RECOMENDADO**

**Objetivo:** Desbloquear vendas self-service

**Tarefas:**
1. ✅ Código completo (100%)
2. 🔴 Executar migration no banco (15 min)
3. 🔴 Deploy Edge Functions (15 min)
4. 🔴 Configurar variáveis de ambiente (10 min)
5. 🔴 Testes manuais (1-2 horas)

**Tempo Total:** 2-3 horas  
**Impacto:** ⭐⭐⭐⭐⭐ (Desbloqueia vendas)

**Resultado:** ChefIApp pode ser vendido comercialmente

---

### Opção 2: Finalizar FASE 5 e FASE 6 (Polimento)

**Objetivo:** Produto mais polido e estável

**Tarefas FASE 5:**
- 🔴 Testes de performance em dispositivos móveis (1 hora)

**Tarefas FASE 6:**
- 🔴 Testes de impressão em diferentes navegadores (30 min)
- 🔴 Testes em diferentes dispositivos (30 min)
- 🔴 Testes com impressoras térmicas reais (1 hora)

**Tempo Total:** 3 horas  
**Impacto:** ⭐⭐⭐ (Melhora percepção de qualidade)

**Resultado:** Produto mais polido e testado

---

### Opção 3: Iniciar FASE 7 (Mapa Visual)

**Objetivo:** Diferencial vs Last.app

**Tarefas:**
- 🔴 Decidir entre Opção A (grid por zonas) ou B (layout físico)
- 🔴 Implementar melhorias visuais
- 🔴 Testes de usabilidade

**Tempo Total:** 1 mês  
**Impacto:** ⭐⭐⭐⭐ (Empate técnico com Last.app)

**Resultado:** Diferencial visual implementado

---

## 🚀 Recomendação Estratégica

### Prioridade 1: FASE 1 (BLOQUEADOR) ⚠️

**Por quê:**
- Bloqueador para vendas self-service
- Código já está 100% completo
- Apenas deploy e testes pendentes
- Tempo curto (2-3 horas)

**Ações Imediatas:**
1. Executar migration: `supabase/migrations/20260130000000_create_billing_core_tables.sql`
2. Deploy Edge Functions:
   ```bash
   npx supabase functions deploy create-subscription
   npx supabase functions deploy update-subscription-status
   npx supabase functions deploy cancel-subscription
   npx supabase functions deploy change-plan
   ```
3. Configurar variáveis:
   - `STRIPE_SECRET_KEY` (Supabase Dashboard)
   - `VITE_STRIPE_PUBLISHABLE_KEY` (.env)
4. Executar testes (ver `PHASE_1_VERIFICATION_GUIDE.md`)

---

### Prioridade 2: FASE 5 e FASE 6 (Polimento)

**Por quê:**
- Melhora percepção de qualidade
- Testes importantes para estabilidade
- Tempo moderado (3 horas)

**Ações:**
- Testes de performance (FASE 5)
- Testes de impressão (FASE 6)

---

### Prioridade 3: FASE 7 (Futuro)

**Por quê:**
- Não é bloqueador
- Pode ser feito após lançamento
- Tempo longo (1 mês)

**Ações:**
- Decisão estratégica sobre layout
- Implementação após feedback inicial

---

## 📋 Checklist de Execução (FASE 1)

### Pré-requisitos

- [ ] Acesso ao Supabase Dashboard
- [ ] Acesso ao Stripe Dashboard (teste ou produção)
- [ ] Chaves Stripe disponíveis:
  - [ ] `STRIPE_SECRET_KEY` (sk_test_xxx ou sk_live_xxx)
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (pk_test_xxx ou pk_live_xxx)
- [ ] Supabase CLI instalado (para deploy de Edge Functions)

---

### Passo 1: Executar Migration (15 min)

**Opção A: Via Supabase Dashboard**
1. Acesse Supabase Dashboard → SQL Editor
2. Abra arquivo: `supabase/migrations/20260130000000_create_billing_core_tables.sql`
3. Copie e cole o conteúdo
4. Execute a query
5. Verifique se tabelas foram criadas:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('subscriptions', 'billing_events', 'billing_payments');
   ```

**Opção B: Via CLI**
```bash
supabase db push
```

---

### Passo 2: Configurar Variáveis de Ambiente (10 min)

**Supabase Dashboard (Edge Functions):**
1. Project Settings → Edge Functions → Secrets
2. Adicionar:
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   ```

**Frontend (.env):**
1. Criar/editar `.env` em `merchant-portal/`
2. Adicionar:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```

---

### Passo 3: Deploy Edge Functions (15 min)

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# Deploy cada função
npx supabase functions deploy create-subscription
npx supabase functions deploy update-subscription-status
npx supabase functions deploy cancel-subscription
npx supabase functions deploy change-plan

# Verificar deploy
npx supabase functions list
```

---

### Passo 4: Testes Manuais (1-2 horas)

Seguir `docs/audit/PHASE_1_VERIFICATION_GUIDE.md`:

1. ✅ Teste 1: Fluxo Trial Completo
2. ✅ Teste 2: Fluxo Pago Completo
3. ✅ Teste 3: Bloqueio sem Subscription
4. ✅ Teste 4: Bloqueio com SUSPENDED
5. ✅ Teste 5: Cancelamento

---

## 📊 Métricas de Sucesso

### FASE 1 Completa Quando:

- [x] Código implementado (100%)
- [ ] Migration executada
- [ ] Edge Functions deployadas
- [ ] Variáveis configuradas
- [ ] Testes passando (5/5)
- [ ] Fluxo trial funcionando
- [ ] Fluxo pago funcionando
- [ ] Bloqueio funcionando

---

## 🎯 Resultado Esperado

Após completar FASE 1:

- ✅ ChefIApp pode ser vendido self-service
- ✅ Trial automático funcionando
- ✅ Checkout Stripe funcionando
- ✅ Bloqueio sem plano funcionando
- ✅ Cancelamento funcionando

**Status:** MVP Comercial completo

---

## 📈 Progresso Após FASE 1

| Fase | Antes | Depois |
|------|-------|--------|
| FASE 1 | 90% | 100% |
| Progresso Geral | 85% | 90% |
| Bloqueadores | 1 | 0 |

---

## ✅ Conclusão

**Recomendação Final:** Priorizar FASE 1 (2-3 horas) para desbloquear vendas, depois finalizar FASE 5 e FASE 6 (3 horas) para polimento completo.

**Tempo Total para MVP Comercial:** ~5-6 horas de trabalho

**Próximo Marco:** Produto vendável comercialmente

---

**Última atualização:** 2026-01-30
