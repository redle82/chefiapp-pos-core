# AUDITORIA DE FRAGMENTAÇÃO SISTÊMICA — CHEFIAPP

**Data:** 2026-01-18  
**Auditor:** Principal Systems Architect + Product Engineer  
**Objetivo:** Detectar se o sistema está FRAGMENTADO ou COESO  
**Status:** ✅ Análise Completa

---

## MAPA DE REFERÊNCIA

Este relatório avalia o ChefIApp contra o mapa mental obrigatório:

1. **CORE** → código que roda em produção
2. **OPS** → scripts operacionais
3. **DOCS** → documentação viva
4. **ARCHIVE** → histórico isolado

**Critério de Fragmentação:**
- Conceitos iguais em lugares diferentes
- Documentos se contradizem ou se sobrepõem
- Fluxos mentais exigem pular entre pastas sem motivo claro
- Código ativo depende de decisões espalhadas
- Não existe um "centro de gravidade" claro

---

## FASE 1 — FRAGMENTAÇÃO CONCEITUAL

### 🔴 ALTA FRAGMENTAÇÃO

#### 1. Billing (Conceito Fragmentado)

**Onde aparece:**
- `billing-core/` (código TypeScript)
- `supabase/functions/stripe-billing/` (Edge Function)
- `supabase/migrations/20260130000000_create_billing_core_tables.sql` (migration nova)
- `supabase/migrations/20260122170647_create_billing_tables.sql` (migration antiga)
- `merchant-portal/src/pages/Onboarding/BillingStep.tsx` (UI)
- `merchant-portal/src/pages/Settings/BillingPage.tsx` (UI)
- `merchant-portal/src/hooks/useSubscription.ts` (hook)
- `merchant-portal/src/core/billing/BillingBroker.ts` (broker)

**Problema:**
- **2 migrations diferentes** para billing (`gm_billing_subscriptions` vs `subscriptions`)
- **2 conceitos de billing** (antigo em `gm_billing_*`, novo em `billing-core`)
- Código usa `billing-core` mas migration antiga ainda existe

**Impacto:** 🟡 Médio — Pode confundir qual schema usar

**Evidência:**
```sql
-- Migration antiga (20260122)
CREATE TABLE gm_billing_subscriptions (...)
CREATE TABLE gm_billing_invoices (...)

-- Migration nova (20260130)
CREATE TABLE subscriptions (...)
CREATE TABLE billing_events (...)
CREATE TABLE billing_payments (...)
```

---

#### 2. Onboarding (Conceito Fragmentado)

**Onde aparece:**
- `merchant-portal/src/pages/Onboarding/OnboardingQuick.tsx` (fluxo rápido)
- `merchant-portal/src/pages/Onboarding/OnboardingWizard.tsx` (fluxo completo)
- `merchant-portal/src/pages/BootstrapPage.tsx` (bootstrap)
- `merchant-portal/src/core/kernel/GenesisKernel.ts` (kernel)
- `billing-core/onboarding.ts` (serviço de onboarding com billing)
- `onboarding-core/` (core separado)
- `docs/architecture/ONBOARDING_FLOW.md` (doc ativo)
- `docs/archive/PHASE1_ONBOARDING_FLOW.md` (doc histórico)
- `docs/archive/ONBOARDING_*.md` (11 docs obsoletos)

**Problema:**
- **3 implementações diferentes** de onboarding:
  1. `OnboardingQuick` (2 telas)
  2. `OnboardingWizard` (8 telas)
  3. `BootstrapPage` (bootstrap inicial)
- **2 cores diferentes** (`onboarding-core/` vs `billing-core/onboarding.ts`)
- Docs ativos e obsoletos misturados

**Impacto:** 🟡 Médio — Difícil saber qual fluxo usar

---

#### 3. Shift/Turno (Conceito Fragmentado)

**Onde aparece:**
- `mobile-app/context/AppStaffContext.tsx` (context principal)
- `mobile-app/components/ShiftGate.tsx` (gate de turno)
- `mobile-app/app/(tabs)/staff.tsx` (tela principal)
- `appstaff-core/contracts.ts` (contratos core)
- `appstaff-core/types.ts` (tipos)
- `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx` (context web)
- `merchant-portal/src/cinematic/context/StaffContext.tsx` (context cinematográfico)

**Problema:**
- **3 contextos diferentes** para shift:
  1. `AppStaffContext` (mobile)
  2. `StaffContext` (web portal)
  3. `StaffContext` (cinematic - duplicado)
- **2 definições de tipos** (`appstaff-core/types.ts` vs tipos locais)
- Lógica de shift espalhada entre context e componentes

**Impacto:** 🟡 Médio — Lógica duplicada, difícil manter consistência

---

#### 4. Gamificação (Conceito Fragmentado)

**Onde aparece:**
- `mobile-app/services/GamificationService.ts` (serviço)
- `mobile-app/app/(tabs)/leaderboard.tsx` (tela)
- `mobile-app/services/NowEngine.ts` (integração)
- `mobile-app/context/AppStaffContext.tsx` (context)
- `docs/audit/APPSTAFF_FIXES_APLICADOS.md` (decisão de remover)

**Problema:**
- Código existe mas **decisão foi remover** (documentada)
- Código ainda ativo mas não deve ser usado
- Decisão em doc, código não reflete

**Impacto:** 🟢 Baixo — Código morto, mas não quebra nada

---

### 🟢 BAIXA FRAGMENTAÇÃO

#### 5. Now Engine (Conceito Coeso)

**Onde aparece:**
- `mobile-app/services/NowEngine.ts` (única implementação)
- `mobile-app/hooks/useNowEngine.ts` (hook único)
- `mobile-app/components/NowActionCard.tsx` (UI única)
- `mobile-app/app/(tabs)/staff.tsx` (integração única)

**Status:** ✅ Coeso — Um lugar, uma responsabilidade

---

## FASE 2 — FRAGMENTAÇÃO DOCUMENTAL

### 🔴 ALTA FRAGMENTAÇÃO

#### 1. Billing — 39 Documentos

**Documentos encontrados:**
- `docs/audit/FASE_1_*.md` (12 arquivos)
- `docs/audit/PHASE_1_*.md` (12 arquivos)
- `docs/audit/EXECUTABLE_ROADMAP.md` (menciona FASE 1)
- `docs/audit/PRODUCT_CLOSURE_PLAN.md` (menciona billing)
- `docs/audit/FINAL_PRODUCT_AUDIT.md` (menciona billing)
- `docs/archive/Q2_2026_FEATURE_3_BILLING_ANALISE.md` (histórico)

**Problema:**
- **Nenhum documento-mãe** claro
- Múltiplos documentos com status diferentes
- Difícil saber qual é a "fonte da verdade"

**Exemplo de fragmentação:**
```
FASE_1_STATUS.md → "90% completo"
PHASE_1_FINAL_STATUS.md → "85% completo"
FASE_1_BILLING_CHECKLIST_DIARIO.md → "checklist diário"
PHASE_1_IMPLEMENTATION_PLAN.md → "plano de implementação"
```

**Impacto:** 🔴 Alto — Confusão sobre estado real

**Recomendação:** Declarar `EXECUTABLE_ROADMAP.md` como fonte da verdade para FASE 1

---

#### 2. Onboarding — 11+ Documentos

**Documentos encontrados:**
- `docs/architecture/ONBOARDING_FLOW.md` (ativo)
- `docs/archive/PHASE1_ONBOARDING_FLOW.md` (histórico)
- `docs/archive/ONBOARDING_*.md` (9 docs obsoletos)
- `ONBOARDING.md` (raiz - para devs)

**Problema:**
- Docs ativos e obsoletos misturados
- `ONBOARDING.md` na raiz vs `docs/architecture/ONBOARDING_FLOW.md`
- Difícil saber qual é atual

**Impacto:** 🟡 Médio — Confusão sobre qual doc ler

---

#### 3. Roadmap/Status — 20+ Documentos

**Documentos encontrados:**
- `docs/audit/EXECUTABLE_ROADMAP.md` (roadmap principal)
- `docs/audit/ROADMAP_FINAL_SUMMARY.md`
- `docs/audit/ROADMAP_PROGRESS_SUMMARY.md`
- `docs/audit/ROADMAP_STATUS_FINAL.md`
- `docs/audit/ROADMAP_INDEX.md`
- `docs/roadmap/` (pasta com mais docs)

**Problema:**
- Múltiplos "summaries" e "status"
- Difícil saber qual é o estado atual
- Roadmap em `docs/audit/` e `docs/roadmap/`

**Impacto:** 🟡 Médio — Confusão sobre progresso real

---

### 🟢 BAIXA FRAGMENTAÇÃO

#### 4. AppStaff — Documentação Coesa

**Documentos:**
- `docs/audit/APPSTAFF_AUDITORIA_TOTAL_V2.md` (auditoria completa)
- `docs/audit/APPSTAFF_FIXES_APLICADOS.md` (fixes aplicados)
- `docs/audit/APPSTAFF_OPERATIONAL_AUDIT.md` (audit operacional)

**Status:** ✅ Coeso — Hierarquia clara, fonte da verdade identificável

---

## FASE 3 — FRAGMENTAÇÃO DE FLUXO

### 🔴 ALTA FRAGMENTAÇÃO

#### 1. Fluxo de Billing (Fragmentado)

**Arquivos necessários para entender o fluxo completo:**
1. `merchant-portal/src/pages/Onboarding/BillingStep.tsx` (UI)
2. `merchant-portal/src/pages/Onboarding/CheckoutStep.tsx` (UI)
3. `merchant-portal/src/pages/Onboarding/TrialStart.tsx` (UI)
4. `merchant-portal/src/hooks/useSubscription.ts` (hook)
5. `supabase/functions/stripe-billing/index.ts` (Edge Function)
6. `supabase/functions/stripe-billing-webhook/index.ts` (webhook)
7. `billing-core/StripeBillingService.ts` (serviço)
8. `billing-core/onboarding.ts` (onboarding service)
9. `supabase/migrations/20260130000000_create_billing_core_tables.sql` (schema)
10. `merchant-portal/src/core/activation/RequireActivation.tsx` (gate)

**Problema:**
- **10 arquivos** em **6 pastas diferentes**
- Fluxo não é linear — exige "caça ao tesouro"
- Não há um documento que mapeie o fluxo completo

**Impacto:** 🔴 Alto — Difícil entender fluxo completo

**Recomendação:** Criar `docs/architecture/BILLING_FLOW.md` como mapa único

---

#### 2. Fluxo de Onboarding (Fragmentado)

**Arquivos necessários:**
1. `merchant-portal/src/pages/BootstrapPage.tsx` (bootstrap)
2. `merchant-portal/src/core/kernel/GenesisKernel.ts` (kernel)
3. `merchant-portal/src/pages/Onboarding/OnboardingQuick.tsx` (quick)
4. `merchant-portal/src/pages/Onboarding/OnboardingWizard.tsx` (wizard)
5. `merchant-portal/src/pages/Onboarding/BillingStep.tsx` (billing)
6. `merchant-portal/src/pages/Onboarding/MenuDemo.tsx` (menu)
7. `merchant-portal/src/core/flow/FlowGate.tsx` (gate)
8. `supabase/functions/create-tenant/index.ts` (provisioning)

**Problema:**
- **8 arquivos** em **5 pastas diferentes**
- 3 fluxos diferentes (Quick, Wizard, Bootstrap)
- Difícil saber qual usar quando

**Impacto:** 🟡 Médio — Confusão sobre qual fluxo seguir

---

### 🟢 BAIXA FRAGMENTAÇÃO

#### 3. Fluxo de Turno (Coeso)

**Arquivos necessários:**
1. `mobile-app/components/ShiftGate.tsx` (gate)
2. `mobile-app/context/AppStaffContext.tsx` (context)
3. `mobile-app/app/(tabs)/staff.tsx` (UI)

**Status:** ✅ Coeso — Fluxo linear, fácil de seguir

---

## FASE 4 — FRAGMENTAÇÃO DE CÓDIGO

### 🔴 ALTA FRAGMENTAÇÃO

#### 1. Estados de Subscription (Fragmentado)

**Onde está definido:**
- `billing-core/types.ts` → `SubscriptionStatus` type
- `billing-core/state-machine.ts` → Máquina de estados
- `supabase/migrations/20260130000000_create_billing_core_tables.sql` → CHECK constraint
- `merchant-portal/src/core/activation/RequireActivation.tsx` → Lógica de bloqueio

**Problema:**
- Estados definidos em **4 lugares diferentes**
- Se adicionar novo status, precisa atualizar 4 lugares
- Risco de inconsistência

**Impacto:** 🟡 Médio — Risco de desalinhamento

---

#### 2. Tipos de Shift (Fragmentado)

**Onde está definido:**
- `appstaff-core/types.ts` → `Shift` interface
- `mobile-app/context/AppStaffContext.tsx` → `ShiftState` type local
- `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx` → `shiftState` type local
- `mobile-app/supabase_schema.sql` → `gm_shifts` table schema

**Problema:**
- Tipos definidos em **4 lugares diferentes**
- `ShiftState` vs `shiftState` (naming inconsistente)
- Risco de desalinhamento entre mobile e web

**Impacto:** 🟡 Médio — Risco de inconsistência entre apps

---

### 🟢 BAIXA FRAGMENTAÇÃO

#### 3. Now Engine (Coeso)

**Onde está:**
- `mobile-app/services/NowEngine.ts` → Lógica única
- `mobile-app/hooks/useNowEngine.ts` → Hook único
- Tipos definidos no mesmo arquivo

**Status:** ✅ Coeso — Tudo em um lugar

---

## FASE 5 — FRAGMENTAÇÃO OPERACIONAL

### 🔴 ALTA FRAGMENTAÇÃO

#### 1. Scripts de Migração (Fragmentado)

**Scripts encontrados:**
- `aplicar_migration.sh` (raiz)
- `aplicar_migration_cli.sh` (movido para archive)
- `aplicar_migration_mcp.sh` (movido para archive)
- `scripts/apply-migration-cli.ts` (TypeScript)
- `scripts/apply-migrations-via-api.ts` (TypeScript)
- `scripts/apply-fix-via-migration.sh` (bash)
- `scripts/apply-hardening-migrations.sh` (bash)
- `scripts/apply-onboarding-fix.sh` (bash)
- `scripts/apply-onboarding-fix-mcp.ts` (TypeScript)

**Problema:**
- **9 scripts diferentes** para aplicar migrations
- Formas diferentes de fazer a mesma coisa
- Novo dev não sabe qual usar

**Impacto:** 🔴 Alto — Confusão operacional

---

#### 2. Scripts de Validação (Fragmentado)

**Scripts encontrados:**
- `scripts/validate-system.sh`
- `scripts/validate-system-laws.sh`
- `scripts/validate-hardening.sh`
- `scripts/validate-hardening-migrations.sql`
- `scripts/validate-commercial.sh`
- `scripts/validate-representation.sh`
- `scripts/validate-single-entry-policy.sh`
- `scripts/validate-single-entry-policy.py`
- `scripts/validate-tenant-isolation.sh`
- `scripts/validate-tpv-go-nogo.ts`

**Problema:**
- **10 scripts diferentes** de validação
- Cada um valida algo diferente
- Não há script "master" que valida tudo

**Impacto:** 🟡 Médio — Difícil saber o que validar

---

#### 3. Scripts de Teste (Fragmentado)

**Scripts encontrados:**
- `scripts/test-truth.sh`
- `scripts/test-truth:stress.sh`
- `scripts/test-truth:chaos.sh`
- `scripts/test-e2e-flow.sh`
- `scripts/test-endpoint-external-id.sh`
- `scripts/test-external-id-complete.sh`
- `scripts/test-gloriafood-webhook.sh`
- `scripts/test-order-creation-manual.sh`

**Problema:**
- **8 scripts diferentes** de teste
- Nomes inconsistentes (`test-*` vs `test:*`)
- Difícil saber qual executar

**Impacto:** 🟡 Médio — Confusão sobre testes

---

### 🟢 BAIXA FRAGMENTAÇÃO

#### 4. Scripts de Deploy (Coeso)

**Scripts encontrados:**
- `scripts/deploy-billing.sh` (específico)
- `scripts/deploy-p1-p2.sh` (específico)

**Status:** ✅ Coeso — Poucos scripts, propósito claro

---

## FASE 6 — VEREDITO DE COESÃO

### 📊 NOTA DE COESÃO SISTÊMICA: **6.5/10**

**Classificação:** 🟡 **PARCIALMENTE FRAGMENTADO**

---

### 🔴 PONTOS DE FRAGMENTAÇÃO CRÍTICOS (Top 5)

#### 1. Billing — 2 Schemas Diferentes
**Impacto:** 🔴 Alto  
**Evidência:** 
- Migration antiga: `gm_billing_subscriptions`
- Migration nova: `subscriptions`
- Código usa novo, mas migration antiga ainda existe

**Risco:** Confusão sobre qual schema usar, possível quebra em produção

---

#### 2. Documentação de Billing — 39 Arquivos
**Impacto:** 🔴 Alto  
**Evidência:**
- 12 arquivos `FASE_1_*.md`
- 12 arquivos `PHASE_1_*.md`
- Múltiplos "status" e "summaries"
- Nenhum documento-mãe claro

**Risco:** Confusão sobre estado real, decisões baseadas em docs obsoletos

---

#### 3. Scripts de Migração — 9 Diferentes
**Impacto:** 🔴 Alto  
**Evidência:**
- `aplicar_migration.sh`
- `apply-migration-cli.ts`
- `apply-migrations-via-api.ts`
- `apply-fix-via-migration.sh`
- `apply-hardening-migrations.sh`
- `apply-onboarding-fix.sh`
- `apply-onboarding-fix-mcp.ts`
- + 2 movidos para archive

**Risco:** Novo dev não sabe qual usar, possível erro em produção

---

#### 4. Fluxo de Billing — 10 Arquivos em 6 Pastas
**Impacto:** 🟡 Médio  
**Evidência:**
- UI: `BillingStep.tsx`, `CheckoutStep.tsx`, `TrialStart.tsx`
- Backend: `StripeBillingService.ts`, Edge Functions
- Schema: Migration SQL
- Gate: `RequireActivation.tsx`

**Risco:** Difícil entender fluxo completo, difícil debugar

---

#### 5. Onboarding — 3 Implementações Diferentes
**Impacto:** 🟡 Médio  
**Evidência:**
- `OnboardingQuick` (2 telas)
- `OnboardingWizard` (8 telas)
- `BootstrapPage` (bootstrap)

**Risco:** Confusão sobre qual usar, manutenção duplicada

---

### ✅ PONTOS DE FORTE COESÃO (Top 5)

#### 1. Now Engine — Coeso
**Evidência:**
- `NowEngine.ts` → Lógica única
- `useNowEngine.ts` → Hook único
- `NowActionCard.tsx` → UI única
- Tudo em `mobile-app/services/` e `mobile-app/hooks/`

**Impacto:** ✅ Fácil entender, fácil manter

---

#### 2. Core Engine — Coeso
**Evidência:**
- `core-engine/` → Pasta única
- `core-engine/guards/` → Guards organizados
- `core-engine/effects/` → Effects organizados
- `core-engine/executor/` → Executor único

**Impacto:** ✅ Estrutura clara, responsabilidades definidas

---

#### 3. AppStaff Auditoria — Coeso
**Evidência:**
- `APPSTAFF_AUDITORIA_TOTAL_V2.md` → Fonte da verdade
- `APPSTAFF_FIXES_APLICADOS.md` → Fixes documentados
- Hierarquia clara

**Impacto:** ✅ Fácil encontrar informação

---

#### 4. SDK — Coeso
**Evidência:**
- `sdk/` → Interface pública única
- `sdk/README.md` → Documentação clara
- Separação clara entre SDK e internals

**Impacto:** ✅ Integradores sabem onde olhar

---

#### 5. Estrutura de Pastas — Coeso
**Evidência:**
- `CORE/` → Código de produção
- `OPS/` → Scripts operacionais
- `DOCS/` → Documentação
- `ARCHIVE/` → Histórico isolado

**Impacto:** ✅ Após FASE A, estrutura está clara

---

## RISCOS REAIS SE NADA FOR FEITO

### 🔴 Risco Alto

1. **Billing em Produção Quebra**
   - 2 schemas diferentes podem causar confusão
   - Migration antiga pode ser executada por engano
   - **Probabilidade:** Média | **Impacto:** Alto

2. **Decisões Baseadas em Docs Obsoletos**
   - 39 docs de billing, difícil saber qual é atual
   - Decisões podem ser baseadas em status antigo
   - **Probabilidade:** Alta | **Impacto:** Médio

3. **Erro em Deploy por Script Errado**
   - 9 scripts de migration, novo dev pode usar o errado
   - **Probabilidade:** Média | **Impacto:** Alto

### 🟡 Risco Médio

4. **Manutenção Duplicada**
   - 3 implementações de onboarding
   - 2 definições de tipos de shift
   - **Probabilidade:** Alta | **Impacto:** Médio

5. **Onboarding de Dev Lento**
   - Fluxos fragmentados exigem "caça ao tesouro"
   - **Probabilidade:** Alta | **Impacto:** Baixo

---

## RECOMENDAÇÕES (DIREÇÕES, NÃO AÇÕES)

### 🔴 Prioridade Alta

1. **Unificar Fonte da Verdade para Billing**
   - Declarar `EXECUTABLE_ROADMAP.md` como fonte da verdade para FASE 1
   - Marcar outros docs como "derivados" ou "históricos"
   - Criar `docs/architecture/BILLING_FLOW.md` como mapa único do fluxo

2. **Resolver Duplicação de Schema de Billing**
   - Decidir: usar `subscriptions` (novo) ou `gm_billing_subscriptions` (antigo)
   - Se novo: marcar migration antiga como obsoleta
   - Se antigo: atualizar código para usar schema antigo

3. **Consolidar Scripts de Migração**
   - Criar `scripts/apply-migration.sh` único (master)
   - Marcar outros como "deprecated" ou mover para archive
   - Documentar qual usar quando

### 🟡 Prioridade Média

4. **Declarar Documento-Mãe para Onboarding**
   - Escolher: `docs/architecture/ONBOARDING_FLOW.md` ou criar novo
   - Marcar outros como "derivados"
   - Atualizar links em outros docs

5. **Unificar Tipos de Shift**
   - Mover tipos para `appstaff-core/types.ts` (fonte única)
   - Remover tipos locais, importar de core
   - Garantir consistência entre mobile e web

6. **Criar Mapa de Fluxos Críticos**
   - `docs/architecture/BILLING_FLOW.md`
   - `docs/architecture/ONBOARDING_FLOW.md` (já existe, melhorar)
   - `docs/architecture/SHIFT_FLOW.md` (novo)

---

## CONCLUSÃO FINAL

### 🎯 VEREDITO

**O ChefIApp está PARCIALMENTE FRAGMENTADO (6.5/10)**

**Justificativa:**
- ✅ Estrutura de pastas coesa (após FASE A)
- ✅ Core Engine coeso
- ✅ Now Engine coeso
- 🔴 Billing fragmentado (2 schemas, 39 docs)
- 🔴 Scripts operacionais fragmentados (9 migrations, 10 validações)
- 🟡 Onboarding fragmentado (3 implementações)
- 🟡 Tipos fragmentados (shift, subscription)

### 🚨 BLOQUEADORES DE PRODUÇÃO

**Nenhum bloqueador crítico**, mas:

1. **Billing:** Risco de confusão entre schemas
2. **Scripts:** Risco de usar script errado em deploy
3. **Docs:** Risco de decisões baseadas em docs obsoletos

### ✅ PONTOS FORTES

1. **Estrutura clara** (CORE/OPS/DOCS/ARCHIVE)
2. **Core Engine coeso**
3. **Now Engine coeso**
4. **SDK bem definido**

---

## PRÓXIMOS PASSOS RECOMENDADOS

### Imediato (Antes de Produção)
1. Resolver duplicação de schema de billing
2. Declarar fonte da verdade para billing docs
3. Consolidar scripts de migration

### Curto Prazo (1-2 semanas)
4. Criar mapas de fluxos críticos
5. Unificar tipos de shift
6. Declarar documento-mãe para onboarding

### Médio Prazo (1 mês)
7. Revisar e consolidar scripts de validação
8. Revisar e consolidar scripts de teste
9. Criar índice mestre de documentação

---

**AUDITORIA CONCLUÍDA:** 2026-01-18  
**PRÓXIMA REVISÃO:** Após resolver bloqueadores de produção
