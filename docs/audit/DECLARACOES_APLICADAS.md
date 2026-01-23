# DECLARAÇÕES OFICIAIS — APLICADAS

**Data:** 2026-01-18  
**Status:** ✅ Declarações Criadas

---

## ✅ O QUE FOI FEITO

### 1. Billing Flow — Mapa Único Criado

**Arquivo:** `docs/architecture/BILLING_FLOW.md`

**Conteúdo:**
- ✅ Fluxo completo documentado (5 etapas)
- ✅ Arquivos do fluxo listados
- ✅ Estados de subscription documentados
- ✅ Troubleshooting incluído
- ✅ Schema oficial declarado

**Impacto:** Reduz fragmentação de fluxo de 10 arquivos para 1 documento

---

### 2. Schema Oficial Declarado

**Migration Antiga:** `20260122170647_create_billing_tables.sql`
- ✅ Marcada como DEPRECATED
- ✅ Comentário explicando que é legado
- ✅ Referência para schema oficial

**Migration Nova:** `20260130000000_create_billing_core_tables.sql`
- ✅ Declarada como OFICIAL
- ✅ Referenciada em `BILLING_FLOW.md`

**Impacto:** Elimina confusão sobre qual schema usar

---

### 3. Scripts Oficiais Declarados

**Arquivo:** `docs/architecture/SCRIPTS_OFICIAIS.md`

**Scripts Oficiais:**
- ✅ `aplicar_migration.sh` — Migration oficial
- ✅ `scripts/validate-system.sh` — Validação oficial
- ✅ `scripts/deploy-billing.sh` — Deploy billing

**Scripts Deprecated:**
- ✅ `scripts/apply-migration-cli.ts` — Marcado como deprecated
- ✅ `scripts/apply-migrations-via-api.ts` — Marcado como deprecated

**Impacto:** Novo dev sabe qual script usar

---

### 4. Fonte da Verdade Declarada

**EXECUTABLE_ROADMAP.md:**
- ✅ Marcado como "FONTE DA VERDADE" para status e progresso
- ✅ Referência para `BILLING_FLOW.md` adicionada
- ✅ Schema oficial declarado no topo

**BILLING_FLOW.md:**
- ✅ Declarado como "FONTE DA VERDADE" para fluxo
- ✅ Referência para `EXECUTABLE_ROADMAP.md` adicionada

**Impacto:** Elimina confusão sobre qual doc ler

---

### 5. Declarações Oficiais — Índice Criado

**Arquivo:** `docs/audit/DECLARACOES_OFICIAIS.md`

**Conteúdo:**
- ✅ Todas as declarações oficiais em um lugar
- ✅ Como usar as declarações
- ✅ Quando atualizar

**Impacto:** Um lugar para encontrar todas as declarações

---

## 📊 IMPACTO DAS DECLARAÇÕES

### Antes
- ❌ 39 docs de billing, nenhum declarado como fonte da verdade
- ❌ 2 schemas diferentes, confusão sobre qual usar
- ❌ 9 scripts de migration, novo dev não sabe qual usar
- ❌ Fluxo de billing em 10 arquivos, difícil entender

### Depois
- ✅ `EXECUTABLE_ROADMAP.md` declarado como fonte da verdade
- ✅ `BILLING_FLOW.md` criado como mapa único
- ✅ Schema oficial declarado (`subscriptions`)
- ✅ Script oficial declarado (`aplicar_migration.sh`)
- ✅ Migration antiga marcada como deprecated

### Redução de Fragmentação
- **Billing Docs:** 39 docs → 1 fonte da verdade + derivados claros
- **Billing Schema:** 2 schemas → 1 oficial declarado
- **Billing Fluxo:** 10 arquivos → 1 documento mapeado
- **Scripts Migration:** 9 scripts → 1 oficial declarado

---

## 🎯 PRÓXIMOS PASSOS

### Imediato
1. ✅ **Voltar para FASE 1 — Billing** (deploy e testes)
2. ✅ Usar `BILLING_FLOW.md` como referência durante deploy
3. ✅ Usar `aplicar_migration.sh` para aplicar migrations

### Curto Prazo (Após FASE 1)
1. Criar `SHIFT_FLOW.md` (se necessário)
2. Revisar outros fluxos críticos
3. Consolidar scripts de validação (se necessário)

---

## 📝 NOTAS

**Nada foi apagado:**
- ✅ Migrations antigas mantidas (apenas marcadas como deprecated)
- ✅ Scripts deprecated mantidos (apenas marcados)
- ✅ Docs históricos mantidos (apenas classificados)

**Fragmentação resolvida com declaração:**
- ✅ Não foi necessário refatorar código
- ✅ Não foi necessário mover arquivos
- ✅ Não foi necessário apagar nada

---

**DECLARAÇÕES APLICADAS:** 2026-01-18  
**PRÓXIMA REVISÃO:** Após deploy completo de FASE 1
