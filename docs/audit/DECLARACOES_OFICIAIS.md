# DECLARAÇÕES OFICIAIS — CHEFIAPP

**Data:** 2026-01-18  
**Objetivo:** Declarar fontes da verdade e resolver fragmentação sem refatoração

---

## 🎯 PRINCÍPIO

**Fragmentação não se resolve apagando, se resolve declarando.**

Este documento declara oficialmente:
- Qual schema usar
- Qual documento é fonte da verdade
- Qual script é oficial
- Onde encontrar informações

---

## 📋 DECLARAÇÕES OFICIAIS

### 1. BILLING — Schema Oficial

**✅ OFICIAL:**
- Tabelas: `subscriptions`, `billing_events`, `billing_payments`
- Migration: `supabase/migrations/20260130000000_create_billing_core_tables.sql`
- Código: `billing-core/` (TypeScript)

**❌ LEGADO (NÃO USAR):**
- Tabelas: `gm_billing_subscriptions`, `gm_billing_invoices`
- Migration: `supabase/migrations/20260122170647_create_billing_tables.sql`
- **Mantida apenas para histórico**

**📋 FONTE DA VERDADE:**
- Fluxo: `docs/architecture/BILLING_FLOW.md`
- Status: `docs/audit/EXECUTABLE_ROADMAP.md` (FASE 1)

---

### 2. BILLING — Documentação

**✅ FONTE DA VERDADE:**
- **Status e Progresso:** `docs/audit/EXECUTABLE_ROADMAP.md` (FASE 1)
- **Fluxo Completo:** `docs/architecture/BILLING_FLOW.md`

**📎 DERIVADOS (úteis, mas não fonte da verdade):**
- `docs/audit/FASE_1_BILLING_CHECKLIST_DIARIO.md` — Checklist diário
- `docs/audit/PHASE_1_FINAL_STATUS.md` — Status histórico
- `docs/audit/PHASE_1_IMPLEMENTATION_PLAN.md` — Plano histórico

**📚 HISTÓRICOS (não usar para decisões):**
- `docs/archive/Q2_2026_FEATURE_3_BILLING_ANALISE.md`
- Outros docs em `docs/archive/`

---

### 3. SCRIPTS — Scripts Oficiais

**✅ OFICIAL:**
- **Migration:** `aplicar_migration.sh` (raiz)
- **Validação:** `scripts/validate-system.sh`
- **Deploy:** `scripts/deploy-billing.sh`, `scripts/deploy-p1-p2.sh`

**❌ DEPRECATED:**
- `scripts/apply-migration-cli.ts` — Use `aplicar_migration.sh`
- `scripts/apply-migrations-via-api.ts` — Use `aplicar_migration.sh`
- Scripts one-shot (executados uma vez)

**📋 FONTE DA VERDADE:**
- `docs/architecture/SCRIPTS_OFICIAIS.md`

---

### 4. ONBOARDING — Fluxo Oficial

**✅ OFICIAL:**
- **Fluxo Rápido:** `merchant-portal/src/pages/Onboarding/OnboardingQuick.tsx` (2 telas)
- **Fluxo Completo:** `merchant-portal/src/pages/Onboarding/OnboardingWizard.tsx` (8 telas)
- **Bootstrap:** `merchant-portal/src/pages/BootstrapPage.tsx`

**📋 FONTE DA VERDADE:**
- `docs/architecture/ONBOARDING_FLOW.md`

**📚 HISTÓRICOS:**
- `docs/archive/PHASE1_ONBOARDING_FLOW.md`
- Outros docs em `docs/archive/`

---

### 5. SHIFT/TURNO — Tipos Oficiais

**✅ OFICIAL:**
- **Tipos:** `appstaff-core/types.ts` (fonte única)
- **Contratos:** `appstaff-core/contracts.ts`
- **Context Mobile:** `mobile-app/context/AppStaffContext.tsx`

**📋 FONTE DA VERDADE:**
- `appstaff-core/README.md`
- `docs/audit/APPSTAFF_AUDITORIA_TOTAL_V2.md`

---

## 🗺️ MAPAS DE FLUXO

**Fluxos críticos documentados:**
- ✅ `docs/architecture/BILLING_FLOW.md` — Billing completo
- ✅ `docs/architecture/ONBOARDING_FLOW.md` — Onboarding completo
- 🟡 `docs/architecture/SHIFT_FLOW.md` — A criar (se necessário)

---

## 📝 COMO USAR ESTAS DECLARAÇÕES

### Para Desenvolvedores
1. **Billing:** Use `subscriptions` table, não `gm_billing_subscriptions`
2. **Status:** Consulte `EXECUTABLE_ROADMAP.md` para status atual
3. **Fluxo:** Consulte `BILLING_FLOW.md` para entender fluxo completo
4. **Scripts:** Use `aplicar_migration.sh` para migrations

### Para Operações
1. **Deploy:** Use scripts oficiais listados em `SCRIPTS_OFICIAIS.md`
2. **Validação:** Use `validate-system.sh` para validação geral
3. **Troubleshooting:** Consulte `BILLING_FLOW.md` seção troubleshooting

### Para Documentação
1. **Atualizar Status:** Sempre atualizar `EXECUTABLE_ROADMAP.md`
2. **Criar Docs:** Sempre referenciar fonte da verdade
3. **Marcar Derivados:** Docs derivados devem referenciar fonte da verdade

---

## 🔄 ATUALIZAÇÕES

**Quando atualizar:**
- Schema muda → Atualizar `BILLING_FLOW.md`
- Script oficial muda → Atualizar `SCRIPTS_OFICIAIS.md`
- Fonte da verdade muda → Atualizar este documento

**Como atualizar:**
- Sempre manter histórico (não apagar)
- Sempre referenciar documento anterior
- Sempre justificar mudança

---

**ÚLTIMA ATUALIZAÇÃO:** 2026-01-18  
**PRÓXIMA REVISÃO:** Após deploy completo de FASE 1
