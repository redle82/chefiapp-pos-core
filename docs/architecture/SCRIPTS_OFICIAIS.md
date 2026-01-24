# SCRIPTS OFICIAIS — DECLARAÇÃO

**Data:** 2026-01-18  
**Status:** ✅ Fonte da Verdade

---

## 🎯 DECLARAÇÃO OFICIAL

**Scripts oficiais são os únicos que devem ser usados em produção.**  
Outros scripts são deprecated, experimentais ou históricos.

---

## 📋 SCRIPTS OFICIAIS

### 1. Aplicar Migration

**✅ OFICIAL:** `aplicar_migration.sh` (raiz)

**Uso:**
```bash
./aplicar_migration.sh
```

**O que faz:**
- Aplica migrations do Supabase
- Valida estrutura
- Executa em ordem cronológica

**❌ DEPRECATED:**
- `scripts/apply-migration-cli.ts` — Use apenas se necessário
- `scripts/apply-migrations-via-api.ts` — Use apenas se necessário
- `aplicar_migration_cli.sh` — Movido para archive
- `aplicar_migration_mcp.sh` — Movido para archive

---

### 2. Validar Sistema

**✅ OFICIAL:** `scripts/validate-system.sh`

**Uso:**
```bash
./scripts/validate-system.sh
```

**O que faz:**
- Valida estrutura de arquivos
- Valida imports
- Valida documentação

**📎 COMPLEMENTARES:**
- `scripts/validate-system-laws.sh` — Valida leis do sistema
- `scripts/validate-hardening.sh` — Valida hardening
- `scripts/validate-tenant-isolation.sh` — Valida isolamento

---

### 3. Deploy

**✅ OFICIAL:** Scripts específicos por feature

- `scripts/deploy-billing.sh` — Deploy de billing
- `scripts/deploy-p1-p2.sh` — Deploy de fases 1 e 2

**Uso:**
```bash
./scripts/deploy-billing.sh
```

---

## 🚫 SCRIPTS DEPRECATED

### Migration
- ❌ `scripts/apply-migration-cli.ts` — Use `aplicar_migration.sh`
- ❌ `scripts/apply-migrations-via-api.ts` — Use `aplicar_migration.sh`
- ❌ `scripts/apply-fix-via-migration.sh` — One-shot, não reutilizar
- ❌ `scripts/apply-hardening-migrations.sh` — One-shot, não reutilizar
- ❌ `scripts/apply-onboarding-fix.sh` — One-shot, não reutilizar

**Nota:** Scripts one-shot podem ser mantidos para histórico, mas não devem ser usados em produção.

---

### Validação
- ❌ `scripts/validate-commercial.sh` — Específico, não geral
- ❌ `scripts/validate-representation.sh` — Específico, não geral
- ❌ `scripts/validate-single-entry-policy.sh` — Específico, não geral
- ❌ `scripts/validate-tenant-isolation.sh` — Específico, mas pode ser útil

**Nota:** Scripts específicos podem ser úteis, mas não são "oficiais" para validação geral.

---

### Teste
- ❌ `scripts/test-truth.sh` — Específico, não geral
- ❌ `scripts/test-e2e-flow.sh` — Específico, não geral
- ❌ `scripts/test-*.sh` — Específicos, não gerais

**Nota:** Scripts de teste são específicos e não têm "oficial" geral.

---

## 📝 POLÍTICA DE SCRIPTS

### Quando Criar Script Oficial
- Script será usado regularmente
- Script é crítico para operação
- Script precisa ser confiável

### Quando NÃO Criar Script Oficial
- Script é one-shot (executado uma vez)
- Script é experimental
- Script é específico para um caso

### Naming
- **Oficial:** Nome claro, sem sufixos (`aplicar_migration.sh`)
- **Deprecated:** Adicionar `_deprecated` ou mover para archive
- **One-shot:** Adicionar data ou contexto (`apply-onboarding-fix.sh`)

---

## 🔄 MIGRAÇÃO DE SCRIPTS

**Scripts movidos para archive:**
- `archive/scripts/aplicar_migration_cli.sh`
- `archive/scripts/aplicar_migration_mcp.sh`

**Scripts a mover (após 90 dias):**
- Scripts one-shot executados uma vez
- Scripts experimentais não usados

---

**ÚLTIMA ATUALIZAÇÃO:** 2026-01-18
