# VARREDURA TOTAL DE REPOSITÓRIO — CHEFIAPP
## Análise de Lixo, Entropia e Consolidação

**Data:** 2026-01-18  
**Status:** ✅ Análise Completa  
**Objetivo:** Reduzir entropia sem quebrar nada

---

## MAPA DE REFERÊNCIA

Este relatório classifica TODO o repositório em 4 categorias:

1. **CORE** → Código que roda em produção
2. **OPS** → Scripts operacionais, deploy, migração
3. **DOCS** → Documentação viva e atual
4. **ARCHIVE** → Código morto, logs, dumps, histórico obsoleto

---

## PARTE 1 — INVENTÁRIO POR PASTA

### 📁 RAIZ DO REPOSITÓRIO

| Caminho | Tipo | Status | Justificativa |
|---------|------|--------|---------------|
| `package.json` | Config | **ATIVO** | Workspace root, scripts essenciais |
| `README.md` | Doc | **ATIVO** | Ponto de entrada principal |
| `ONBOARDING.md` | Doc | **ATIVO** | Guia para novos devs |
| `QUICK_START.md` | Doc | **ATIVO** | Início rápido |
| `QUICK_REFERENCE.md` | Doc | **ATIVO** | Referência rápida |
| `INICIO_AQUI.md` | Doc | **ATIVO** | Ponto de entrada alternativo |
| `VERSION` | Config | **ATIVO** | Controle de versão |
| `stripe-listen.log` | Log | **LIXO TÉCNICO** | Log de desenvolvimento |
| `merchant-001-record.json` | Dump | **HISTÓRICO** | Dados de teste, pode ser archive |
| `aplicar_migration*.sh` | Script | **OPS** | Scripts de migração (3 duplicados) |

### 📁 CORE (Código de Produção)

| Caminho | Tipo | Status | Justificativa |
|---------|------|--------|---------------|
| `core-engine/` | Código | **ATIVO** | Motor central do sistema |
| `billing-core/` | Código | **ATIVO** | Lógica de billing |
| `appstaff-core/` | Código | **ATIVO** | Core do AppStaff |
| `onboarding-core/` | Código | **ATIVO** | Lógica de onboarding |
| `event-log/` | Código | **ATIVO** | Event sourcing |
| `gate3-persistence/` | Código | **ATIVO** | Persistência |
| `legal-boundary/` | Código | **ATIVO** | Conformidade legal |
| `fiscal-modules/` | Código | **ATIVO** | Módulos fiscais |
| `gateways/` | Código | **ATIVO** | Gateways de integração |
| `projections/` | Código | **ATIVO** | Projeções de dados |
| `state-machines/` | Código | **ATIVO** | Máquinas de estado |
| `sdk/` | Código | **ATIVO** | Interface pública |
| `src/lib/legal-*` | Código | **ATIVO** | Perfis legais |
| `types/` | Código | **ATIVO** | Tipos compartilhados |

### 📁 APLICAÇÕES

| Caminho | Tipo | Status | Justificativa |
|---------|------|--------|---------------|
| `merchant-portal/` | App | **ATIVO** | Portal do comerciante (521 arquivos) |
| `customer-portal/` | App | **ATIVO** | Portal do cliente |
| `mobile-app/` | App | **ATIVO** | App mobile (120 arquivos) |
| `components/` | Código | **ATIVO** | Componentes compartilhados |
| `public/` | Assets | **ATIVO** | Assets públicos |

### 📁 OPS (Scripts Operacionais)

| Caminho | Tipo | Status | Justificativa |
|---------|------|--------|---------------|
| `scripts/` | Scripts | **OPS** | 92 arquivos (sh, ts, sql) |
| `supabase/` | Config | **OPS** | Migrações e edge functions |
| `migrations/` | SQL | **OPS** | Migrações de schema |
| `docker-compose.optimized.yml` | Config | **OPS** | Docker compose |
| `Dockerfile` | Config | **OPS** | Container config |
| `.github/` | CI/CD | **OPS** | GitHub Actions |
| `.vscode/` | Config | **SUPORTE** | Configuração IDE |
| `.cursor/` | Config | **SUPORTE** | Configuração Cursor |

### 📁 DOCS (Documentação)

| Caminho | Tipo | Status | Justificativa |
|---------|------|--------|---------------|
| `docs/` | Docs | **ATIVO** | 306 arquivos (293 MD) |
| `docs/audit/` | Docs | **ATIVO** | 147 arquivos de auditoria |
| `docs/archive/` | Docs | **HISTÓRICO** | 798 arquivos obsoletos |
| `docs/architecture/` | Docs | **ATIVO** | Arquitetura |
| `docs/roadmap/` | Docs | **ATIVO** | Roadmap |
| `docs/ops/` | Docs | **ATIVO** | Operações |
| `:blueprint/` | Docs | **ATIVO** | Blueprints (9 arquivos) |

### 📁 TESTES

| Caminho | Tipo | Status | Justificativa |
|---------|------|--------|---------------|
| `tests/` | Testes | **ATIVO** | 164 arquivos (134 TS) |
| `testsprite_tests/` | Testes | **SUPORTE** | 280 arquivos (105 MD, 65 PY, 65 PYC) |
| `testsprite_uiux/` | Testes | **SUPORTE** | 104 arquivos (70 PNG, 17 MD) |
| `test-results/` | Artefato | **LIXO TÉCNICO** | Resultados de teste |
| `audit-reports/` | Relatórios | **HISTÓRICO** | 34+ relatórios datados |
| `audit-baselines/` | Baseline | **SUPORTE** | Baselines de auditoria |

### 📁 ARCHIVE (Código Morto)

| Caminho | Tipo | Status | Justificativa |
|---------|------|--------|---------------|
| `_graveyard/` | Archive | **ARCHIVE** | 43 arquivos (código morto) |
| `_graveyard/landing-page-standalone/` | Archive | **ARCHIVE** | Landing page obsoleta |
| `_graveyard/DELETE_ON_2026-01-15.sh` | Script | **ARCHIVE** | Script de deleção (data passou) |
| `phase2/` | Código | **HISTÓRICO** | 9 arquivos (tipos apenas, não usado) |
| `phase3/` | Código | **HISTÓRICO** | 7 arquivos (tipos apenas, não usado) |

### 📁 OUTROS

| Caminho | Tipo | Status | Justificativa |
|---------|------|--------|---------------|
| `server/` | Código | **ATIVO** | Servidores (webhook, billing, etc) |
| `audit-ui-*.json` | Artefato | **LIXO TÉCNICO** | Resultados de auditoria UI |

---

## PARTE 2 — DETECÇÃO DE ENTROPIA

### 🔴 TOP 15 FONTES DE PESO COGNITIVO

1. **`docs/archive/`** (798 arquivos)
   - Mistura docs obsoletos com histórico
   - **Peso:** Alto — confunde onboarding
   - **Exemplo:** `docs/archive/test-output.log`, `docs/archive/server-debug.log`

2. **`testsprite_tests/`** (280 arquivos, 65 `.pyc`)
   - Mistura testes Python com cache compilado
   - **Peso:** Médio — cache não deveria estar no repo
   - **Exemplo:** `testsprite_tests/__pycache__/*.pyc`

3. **`audit-reports/`** (34+ relatórios datados)
   - Relatórios históricos misturados com atuais
   - **Peso:** Médio — difícil encontrar o atual
   - **Exemplo:** `audit-report-2025-12-22T22-28-01-423Z.md`

4. **`docs/audit/`** (147 arquivos)
   - Muitos documentos de auditoria sem índice claro
   - **Peso:** Médio — difícil navegar
   - **Exemplo:** `APPSTAFF_AUDITORIA_TOTAL_V2.md`, `FINAL_HANDOFF.md`

5. **`scripts/`** (92 arquivos)
   - Mistura scripts operacionais com one-shots
   - **Peso:** Médio — difícil saber qual usar
   - **Exemplo:** `ritual_*.ts`, `demo-*.sh`, `test-*.sh`

6. **`_graveyard/`** (43 arquivos)
   - Código morto não deletado
   - **Peso:** Baixo — já está marcado como archive
   - **Exemplo:** `_graveyard/landing-page-standalone/`

7. **`phase2/` e `phase3/`** (16 arquivos)
   - Tipos TypeScript não usados
   - **Peso:** Baixo — não importados
   - **Exemplo:** `phase2/analytics/types.ts`

8. **Logs na raiz** (múltiplos arquivos)
   - Logs de desenvolvimento commitados
   - **Peso:** Médio — não deveriam estar no repo
   - **Exemplo:** `stripe-listen.log`, `a3-server.log`, `billing-server.log`

9. **`merchant-001-record.json`** (raiz)
   - Dump de dados de teste
   - **Peso:** Baixo — pode ser archive
   - **Exemplo:** `merchant-001-record.json`

10. **`testsprite_uiux/.gitignore`** (malformado)
    - Arquivo `.gitignore` com código JavaScript
    - **Peso:** Baixo — erro técnico
    - **Exemplo:** `testsprite_uiux/.gitignore` (linha 18+)

11. **`docs/roadmap/`** (muitos arquivos)
    - Roadmap histórico misturado com atual
    - **Peso:** Médio — difícil saber o estado atual
    - **Exemplo:** `END_OF_ROADMAP.md`, `COMPLETION.md`

12. **Scripts duplicados** (raiz)
    - 3 scripts de migração similares
    - **Peso:** Baixo — confusão sobre qual usar
    - **Exemplo:** `aplicar_migration.sh`, `aplicar_migration_cli.sh`, `aplicar_migration_mcp.sh`

13. **`test-results/`** (raiz)
    - Artefatos de teste
    - **Peso:** Baixo — deveria estar no `.gitignore`
    - **Exemplo:** `test-results/*.json`

14. **`audit-ui-*.json`** (raiz)
    - Resultados de auditoria UI
    - **Peso:** Baixo — artefato temporário
    - **Exemplo:** `audit-ui-click-findings.json`

15. **`docs/` com muitos índices**
    - Múltiplos arquivos de índice sem hierarquia clara
    - **Peso:** Médio — confusão sobre onde começar
    - **Exemplo:** `INDICE_COMPLETO.md`, `README.md`, `MASTER_INDEX.md`

---

## PARTE 3 — CANDIDATOS À LIMPEZA

### 1️⃣ REMOÇÃO SEGURA (Alto Grau de Certeza)

#### Logs
- ✅ `stripe-listen.log` (raiz)
- ✅ `stripe-listen-3099.log` (raiz)
- ✅ `a3-server.log` (raiz)
- ✅ `billing-server.log` (raiz)
- ✅ `merchant-portal/test_output.log`
- ✅ `merchant-portal/test-output-3.log`
- ✅ `merchant-portal/test_output_2.log`
- ✅ `docs/archive/test-output.log`
- ✅ `docs/archive/test-output-3.log`
- ✅ `docs/archive/test-output-2.log`
- ✅ `docs/archive/web_module.log`
- ✅ `docs/archive/massive_results.log`
- ✅ `docs/archive/server-debug.log`
- ✅ `docs/archive/server-prod.log`

**Justificativa:** Logs são gerados automaticamente e não devem estar no repo.

#### Cache Python
- ✅ `testsprite_tests/__pycache__/` (65 arquivos `.pyc`)

**Justificativa:** Cache compilado não deve estar no repo.

#### Artefatos de Teste
- ✅ `test-results/` (raiz)
- ✅ `audit-ui-click-findings.json` (raiz)
- ✅ `audit-ui-comprehensive.json` (raiz)

**Justificativa:** Artefatos temporários gerados por ferramentas.

#### Arquivos Temporários
- ✅ `merchant-portal/node_modules/.tmp`
- ✅ `customer-portal/node_modules/.tmp`
- ✅ `_graveyard/landing-page-standalone/node_modules/.tmp`
- ✅ `mobile-app/node_modules/nested-error-stacks/README.md~`

**Justificativa:** Arquivos temporários do sistema.

---

### 2️⃣ MOVER PARA ARCHIVE

#### Código Morto
- ✅ `_graveyard/` → **JÁ É ARCHIVE** (manter estrutura)
- ✅ `phase2/` → `archive/code/phase2/`
- ✅ `phase3/` → `archive/code/phase3/`

**Justificativa:** Código não usado, mas pode ter valor histórico.

#### Relatórios Históricos
- ✅ `audit-reports/audit-report-*.md` (todos exceto os 3 mais recentes) → `archive/reports/audit-reports/`
- ✅ `audit-reports/E2E-*.md` (exceto o mais recente) → `archive/reports/audit-reports/`

**Justificativa:** Relatórios históricos não são consultados frequentemente.

#### Dumps de Dados
- ✅ `merchant-001-record.json` → `archive/data/merchant-001-record.json`

**Justificativa:** Dados de teste, não são código.

#### Documentação Obsoleta
- ✅ `docs/archive/` → **JÁ É ARCHIVE** (manter estrutura, mas consolidar)

**Justificativa:** Docs obsoletos já estão em archive, mas podem ser consolidados.

---

### 3️⃣ RECLASSIFICAÇÃO

#### Scripts One-Shot
- ✅ `scripts/ritual_*.ts` → `archive/scripts/ritual/`
- ✅ `scripts/demo-*.sh` → `archive/scripts/demo/`
- ✅ `scripts/test-*.sh` → `archive/scripts/test/` (exceto os usados em CI)

**Justificativa:** Scripts executados uma vez não são OPS contínuo.

#### Scripts Duplicados
- ✅ `aplicar_migration.sh` → **MANTER** (script principal)
- ✅ `aplicar_migration_cli.sh` → `archive/scripts/` (duplicado)
- ✅ `aplicar_migration_mcp.sh` → `archive/scripts/` (duplicado)

**Justificativa:** Consolidar em um único script.

#### Documentação de Roadmap Histórico
- ✅ `docs/roadmap/END_OF_ROADMAP.md` → `archive/docs/roadmap/`
- ✅ `docs/roadmap/COMPLETION.md` → `archive/docs/roadmap/`
- ✅ `docs/roadmap/DELIVERY_COMPLETE.md` → `archive/docs/roadmap/`

**Justificativa:** Roadmap histórico não é documentação ativa.

---

## PARTE 4 — RISCOS

### 🔴 Remoção Segura (Logs, Cache, Artefatos)

| Risco | Nível | Impacto | Mitigação |
|-------|-------|---------|-----------|
| **Técnico** | 🟢 Baixo | Nenhum — logs são gerados automaticamente | Verificar `.gitignore` |
| **Build** | 🟢 Baixo | Nenhum — não são dependências | N/A |
| **Deploy** | 🟢 Baixo | Nenhum — não são usados em produção | N/A |
| **Leitura** | 🟢 Baixo | Positivo — reduz ruído | N/A |

### 🟡 Mover para Archive (Código Morto, Relatórios)

| Risco | Nível | Impacto | Mitigação |
|-------|-------|---------|-----------|
| **Técnico** | 🟡 Médio | Baixo — código não é importado | Verificar imports antes |
| **Build** | 🟢 Baixo | Nenhum — não são compilados | N/A |
| **Deploy** | 🟢 Baixo | Nenhum — não são deployados | N/A |
| **Leitura** | 🟢 Baixo | Positivo — reduz confusão | Criar índice em `archive/README.md` |

### 🟡 Reclassificação (Scripts, Docs)

| Risco | Nível | Impacto | Mitigação |
|-------|-------|---------|-----------|
| **Técnico** | 🟡 Médio | Médio — scripts podem ser referenciados | Buscar referências antes |
| **Build** | 🟢 Baixo | Nenhum — scripts não são compilados | N/A |
| **Deploy** | 🟡 Médio | Médio — scripts podem ser usados em CI/CD | Verificar `.github/workflows/` |
| **Leitura** | 🟢 Baixo | Positivo — estrutura mais clara | Atualizar documentação |

---

## PARTE 5 — PLANO DE LIMPEZA EM 2 FASES

### FASE A — LIMPEZA NÃO-DESTRUTIVA (Imediata)

**Objetivo:** Reduzir ruído sem risco de quebrar nada.

#### A1. Remover Logs e Cache
```bash
# Logs na raiz
rm stripe-listen.log stripe-listen-3099.log a3-server.log billing-server.log

# Logs em merchant-portal
rm merchant-portal/test_output*.log

# Logs em docs/archive
rm docs/archive/*.log

# Cache Python
rm -rf testsprite_tests/__pycache__/

# Artefatos de teste
rm -rf test-results/
rm audit-ui-*.json
```

**Risco:** 🟢 Baixo  
**Tempo:** 5 minutos  
**Impacto:** Reduz ~20 arquivos de ruído

#### A2. Criar Estrutura de Archive
```bash
# Criar estrutura
mkdir -p archive/{code,reports,scripts,docs,data}

# Mover código morto
mv phase2 archive/code/
mv phase3 archive/code/

# Mover relatórios históricos (manter 3 mais recentes)
# (fazer manualmente após verificar datas)

# Mover dumps
mv merchant-001-record.json archive/data/

# Mover scripts one-shot
mkdir -p archive/scripts/{ritual,demo,test}
mv scripts/ritual_*.ts archive/scripts/ritual/ 2>/dev/null
mv scripts/demo-*.sh archive/scripts/demo/ 2>/dev/null
# (verificar quais test-*.sh são usados em CI antes)
```

**Risco:** 🟡 Médio  
**Tempo:** 30 minutos  
**Impacto:** Reorganiza ~50 arquivos

#### A3. Consolidar Scripts Duplicados
```bash
# Manter apenas aplicar_migration.sh
# Mover duplicados para archive
mv aplicar_migration_cli.sh archive/scripts/
mv aplicar_migration_mcp.sh archive/scripts/
```

**Risco:** 🟢 Baixo  
**Tempo:** 5 minutos  
**Impacto:** Remove 2 scripts duplicados

#### A4. Criar Índice de Archive
```bash
# Criar archive/README.md explicando estrutura
```

**Risco:** 🟢 Baixo  
**Tempo:** 10 minutos  
**Impacto:** Facilita navegação

**TOTAL FASE A:**
- ⏱️ **Tempo:** ~50 minutos
- 🟢 **Risco:** Baixo
- 📉 **Redução:** ~70 arquivos movidos/removidos

---

### FASE B — LIMPEZA DEFINITIVA (Futura)

**Objetivo:** Deletar permanentemente após período de quarentena.

#### B1. Deletar Archive Após 90 Dias
```bash
# Após 90 dias sem uso, deletar:
rm -rf archive/code/phase2/
rm -rf archive/code/phase3/
rm -rf archive/reports/audit-reports/audit-report-*.md  # (exceto 3 mais recentes)
```

**Critérios:**
- ✅ Nenhum import encontrado
- ✅ Nenhuma referência em docs atuais
- ✅ 90 dias sem modificação
- ✅ Build funciona sem eles

#### B2. Consolidar Documentação
```bash
# Consolidar docs/archive/ (798 arquivos)
# Manter apenas:
# - README.md explicando o que foi archive
# - Índice de arquivos importantes
# - Deletar logs e dumps duplicados
```

**Critérios:**
- ✅ Documentação consolidada em docs ativos
- ✅ Nenhuma referência em docs atuais

#### B3. Limpar _graveyard/
```bash
# Executar DELETE_ON_2026-01-15.sh (data já passou)
# Ou deletar manualmente após confirmar
rm -rf _graveyard/
```

**Critérios:**
- ✅ Script de deleção já existe
- ✅ Data de quarentena passou
- ✅ Confirmar que não é necessário

**TOTAL FASE B:**
- ⏱️ **Tempo:** ~2 horas (após 90 dias)
- 🟡 **Risco:** Médio (requer validação)
- 📉 **Redução:** ~200 arquivos deletados

---

## PARTE 6 — MAPA FINAL PROPOSTO

### Estrutura Recomendada

```
chefiapp-pos-core/
├── 📁 CORE (Código de Produção)
│   ├── core-engine/
│   ├── billing-core/
│   ├── appstaff-core/
│   ├── onboarding-core/
│   ├── event-log/
│   ├── gate3-persistence/
│   ├── legal-boundary/
│   ├── fiscal-modules/
│   ├── gateways/
│   ├── projections/
│   ├── state-machines/
│   ├── sdk/
│   ├── src/lib/legal-*/
│   └── types/
│
├── 📁 APPS (Aplicações)
│   ├── merchant-portal/
│   ├── customer-portal/
│   ├── mobile-app/
│   ├── components/
│   └── public/
│
├── 📁 OPS (Operações)
│   ├── scripts/          # Scripts operacionais ativos
│   ├── supabase/         # Migrações e edge functions
│   ├── migrations/       # Migrações de schema
│   ├── .github/          # CI/CD
│   ├── docker-compose.optimized.yml
│   └── Dockerfile
│
├── 📁 DOCS (Documentação)
│   ├── docs/
│   │   ├── audit/        # Auditorias atuais
│   │   ├── architecture/
│   │   ├── roadmap/      # Roadmap atual
│   │   ├── ops/
│   │   └── ...           # Outros docs ativos
│   └── :blueprint/
│
├── 📁 TESTS (Testes)
│   ├── tests/            # Testes principais
│   ├── testsprite_tests/ # Testes TestSprite (sem __pycache__)
│   └── testsprite_uiux/
│
├── 📁 ARCHIVE (Histórico)
│   ├── code/            # Código morto (phase2, phase3)
│   ├── reports/         # Relatórios históricos
│   ├── scripts/         # Scripts one-shot
│   ├── docs/            # Docs obsoletos consolidados
│   ├── data/            # Dumps de dados
│   └── README.md        # Índice do archive
│
├── 📁 CONFIG (Configuração)
│   ├── package.json
│   ├── README.md
│   ├── ONBOARDING.md
│   ├── QUICK_START.md
│   └── .gitignore
│
└── 📁 SERVER (Servidores)
    └── server/          # Servidores (webhook, billing, etc)
```

### README do Archive

Criar `archive/README.md`:

```markdown
# Archive

Este diretório contém código, documentação e artefatos históricos que não são mais usados ativamente, mas são mantidos para referência.

## Estrutura

- `code/` - Código morto (phase2, phase3)
- `reports/` - Relatórios históricos de auditoria
- `scripts/` - Scripts one-shot executados uma vez
- `docs/` - Documentação obsoleta consolidada
- `data/` - Dumps de dados de teste

## Política de Limpeza

- Arquivos aqui podem ser deletados após 90 dias sem uso
- Antes de deletar, verificar:
  - Nenhum import encontrado
  - Nenhuma referência em docs atuais
  - Build funciona sem eles
```

---

## RESUMO EXECUTIVO

### 📊 Estatísticas

- **Total de arquivos analisados:** ~2000+
- **Arquivos candidatos à remoção:** ~70 (Fase A)
- **Arquivos candidatos à archive:** ~200 (Fase B, após 90 dias)
- **Redução de entropia estimada:** ~15%

### 🎯 Impacto Esperado

**Antes:**
- Logs e cache no repo
- Código morto misturado com ativo
- Relatórios históricos confundem
- Scripts duplicados
- Estrutura confusa

**Depois:**
- Apenas código ativo visível
- Archive organizado com índice
- Scripts consolidados
- Estrutura clara (CORE/OPS/DOCS/ARCHIVE)

### ⚠️ Próximos Passos

1. **Imediato (Fase A):**
   - Remover logs e cache
   - Criar estrutura de archive
   - Mover código morto
   - Consolidar scripts duplicados

2. **Após 90 dias (Fase B):**
   - Validar que archive não é usado
   - Deletar permanentemente
   - Consolidar documentação

3. **Contínuo:**
   - Manter `.gitignore` atualizado
   - Não commitar logs
   - Não commitar cache
   - Mover código morto para archive imediatamente

---

**RELATÓRIO GERADO:** 2026-01-18  
**PRÓXIMA REVISÃO:** Após execução da Fase A
