# Arquivamento Realizado — 2026-01-28

**Status:** ✅ **COMPLETO** (100% concluído — 29/29 arquivos arquivados)
**Objetivo:** Mover documentos históricos para `docs/archive/` com header ARCHIVED

---

## 📋 Processo de Arquivo

### Padrão aplicado

Cada arquivo arquivado recebe header no topo:

```markdown
**Status:** ARCHIVED
**Reason:** [Motivo específico]
**Arquivado em:** 2026-01-28

---
```

Depois o conteúdo original é preservado.

---

## ✅ Arquivos já arquivados

### Fixes históricos

| Arquivo                         | Motivo                               | Status       |
| ------------------------------- | ------------------------------------ | ------------ |
| `FIX_AUTH_SESSION_MISSING.md`   | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_DOCKER_CORE_SEM_AUTH.md`   | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_ERROS_500_VITE.md`         | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_INVENTORY_CONTEXT_404.md`  | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_JWSError_DOCKER_CORE.md`   | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_ORDERCONTEXT_ERROR_500.md` | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_POSTGREST_404.md`          | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_POSTGREST_JWT_SECRET.md`   | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_POSTGREST_NGINX_PROXY.md`  | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_POSTGREST_URL_PATH.md`     | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_REALTIME_WEBSOCKET.md`     | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_RESTAURANT_ID_MISSING.md`  | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_SYSTEMNODE_IMPORT.md`      | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_TPV_CONTEXTENGINE.md`      | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |
| `FIX_TPV_ORDERPROVIDER.md`      | Fix aplicado; sistema em PURE DOCKER | ✅ Arquivado |

✅ **Todos arquivados** (15 arquivos)

### Refatorações por fase

| Arquivo                              | Motivo                | Status       |
| ------------------------------------ | --------------------- | ------------ |
| `REFATORACAO_FASE_1_2_VALIDADA.md`   | Refatoração concluída | ✅ Arquivado |
| `REFATORACAO_FASE_3_4_MAPEAMENTO.md` | Refatoração concluída | ✅ Arquivado |
| `REFATORACAO_FASE_3_5_MAPEAMENTO.md` | Refatoração concluída | ✅ Arquivado |
| `REFATORACAO_FASE_3_CONCLUSAO.md`    | Refatoração concluída | ✅ Arquivado |
| `REFATORACAO_FASE_3_PLANO.md`        | Refatoração concluída | ✅ Arquivado |
| `REFATORACAO_FASE_3_STATUS.md`       | Refatoração concluída | ✅ Arquivado |
| `REFATORACAO_PLANO.md`               | Refatoração concluída | ✅ Arquivado |
| `REFATORACAO_PROGRESSO.md`           | Refatoração concluída | ✅ Arquivado |
| `REFATORACAO_RESUMO.md`              | Refatoração concluída | ✅ Arquivado |

---

### Snapshots e checklists

| Arquivo                            | Motivo                                       | Status       |
| ---------------------------------- | -------------------------------------------- | ------------ |
| `SNAPSHOT_PRE_REFACTOR.md`         | Snapshot antes do refactor PURE DOCKER       | ✅ Arquivado |
| `CHECKLIST_DEBUG_ONBOARDING.md`    | Checklist de debug específico de fase        | ✅ Arquivado |
| `CHECKLIST_FINAL_IMPLEMENTACAO.md` | Checklist de implementação concluída         | ✅ Arquivado |
| `CHECKLIST_PROXIMOS_PASSOS.md`     | Checklist de próximos passos (já executados) | ✅ Arquivado |
| `CHECKLIST_VENDA_V1.md`            | Checklist de venda v1 (referência histórica) | ✅ Arquivado |

✅ **Todos arquivados** (5 arquivos)

---

## 🛠️ Scripts disponíveis

### 1. `docs/scripts/archive_fixes.sh`

Script para arquivar fixes históricos em lote.

**Uso:**

```bash
cd docs
./scripts/archive_fixes.sh
```

**Status:** ✅ Executado — 14 fixes arquivados (total: 15 com exemplo anterior)

### 1. `docs/scripts/archive_fixes.sh`

Script para arquivar fixes históricos em lote.

**Uso:**

```bash
cd docs
./scripts/archive_fixes.sh
```

**Status:** ✅ Executado — 14 fixes arquivados (total: 15 com exemplo anterior)

### 2. `docs/scripts/archive_refactoracoes.sh`

Script para arquivar refatorações por fase em lote.

**Uso:**

```bash
cd docs
./scripts/archive_refactoracoes.sh
```

**Status:** ✅ Executado — 9 refatorações arquivadas

### 3. `docs/scripts/archive_snapshots_checklists.sh`

Script para arquivar snapshots e checklists históricos em lote.

**Uso:**

```bash
cd docs
./scripts/archive_snapshots_checklists.sh
```

**Status:** ✅ Executado — 4 snapshots/checklists arquivados (+ 1 manual = 5 total)

**Nota:** Scripts adicionam header ARCHIVED automaticamente e movem para `archive/`.

---

## 📊 Estatísticas

| Categoria            | Total  | Arquivados | Restantes |
| -------------------- | ------ | ---------- | --------- |
| Fixes históricos     | 15     | **15** ✅  | 0         |
| Refatorações         | 9      | **9** ✅   | 0         |
| Snapshots/Checklists | 5      | **5** ✅   | 0         |
| **Total**            | **29** | **29** ✅  | **0**     |

---

## ✅ Conclusão

**Status:** ✅ **100% COMPLETO** — Todos os 29 arquivos foram arquivados!

**Concluído:**

- ✅ 15 fixes históricos (todos)
- ✅ 9 refatorações por fase (todas)
- ✅ 5 snapshots e checklists (todos)

**Resultado:**

Todos os documentos históricos identificados foram movidos para `docs/archive/` com header ARCHIVED apropriado. Sistema está completamente organizado e pronto para uso.

---

**Última atualização:** 2026-01-28
