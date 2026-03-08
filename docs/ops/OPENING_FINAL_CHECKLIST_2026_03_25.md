# Checklist Final de Abertura — 25/03/2026

**Objetivo:** Gate operacional final para abertura com evidência técnica verificável.
**Escopo:** TPV/Offline/Sync/Fiscal/Payments/Edge.
**Gate oficial aprovado:** `pnpm run audit:release:portal`.

---

## 1) Pré-condições de execução

- [ ] Core Docker ativo via `docker compose -f docker-core/docker-compose.core.yml up -d`
- [ ] Health do Core em `http://localhost:3001/rest/v1/` = 200
- [ ] Ambiente merchant-portal preparado (`pnpm install` concluído)
- [ ] Variáveis críticas configuradas (`VITE_API_BASE`, `VITE_INTERNAL_API_TOKEN`, Stripe/SumUp quando aplicável)
- [ ] Equipe ciente de janela de execução e rollback

Comando rápido de saúde:

```bash
bash scripts/core/health-check-core.sh
```

---

## 2) Gate de regressão (obrigatório)

### 2.1 Gate oficial (bloqueante)

```bash
pnpm run audit:release:portal
```

- [ ] PASS
- [ ] Evidência anexada (log + timestamp)

**Execução atual (2026-02-23):**

- **PASS** — gate concluído com exit 0 (~68s).
- **PASS (revalidação)** — após ajuste de detecção de External ID retry e estabilização de teste frágil (`SyncEngine.test`), gate voltou a concluir com exit 0 e validação de leis sem warnings.
- **PASS (revalidação)** — `83 files; 431 pass, 2 skip` (merchant-portal) e validação de leis em PASS.

### 2.2 Regressão focal adicional (recomendado)

```bash
pnpm --filter merchant-portal exec vitest run src/core/sync/SyncEngine.test.ts src/pages/TPV/components/PaymentModal.test.tsx src/core/print/PrintQueueProcessor.test.ts src/core/infra/CoreOrdersApi.integration.test.ts
```

- [ ] PASS
- [ ] Evidência anexada

---

## 3) Ritual de stress real (obrigatório)

### 3.1 Fluxo crítico consolidado

```bash
bash scripts/flows/validate-critical-flow-full.sh
```

- [ ] PASS
- [ ] Sem quebra de fluxo order → payment → sync

**Execução atual (2026-02-23):**

- **PASS** — `7 passed, 0 failed`.
- **Nota:** etapas de order/payment/fiscal ficaram em `SKIP` esperado por schema MVP (sem tabela de order no Docker Core neste fluxo específico).

### 3.2 Stress funcional da stack de verdade

```bash
bash scripts/truth-stress.sh
```

- [ ] PASS
- [ ] Sem regressão de consistência em condições de carga

**Execução atual (2026-02-23):**

- **FAIL** — `truth-stress` terminou com exit code 1.
- Resultado agregado observado: `380 failed`, `80 passed`, `40 skipped`, com timeouts recorrentes em specs Playwright truth (`page.textContent('h1')` timeout em Entry/Payments/Publish e múltiplos locks truth/banner/gating/health).

---

## 4) Prova fiscal + offline/sync (obrigatório)

### 4.1 Prova principal

```bash
bash scripts/flows/proof_fiscal_offline.sh
```

Resultado esperado mínimo:

- [ ] `26 passed | 0 failed | 0 skipped`

**Execução atual (2026-02-23):**

- **PASS** — `26 passed | 0 failed | 0 skipped`.

### 4.2 Rehearsal fiscal/sync completo

```bash
bash scripts/flows/run-fiscal-sync-rehearsal.sh
```

- [ ] PASS
- [ ] Sem violação de imutabilidade/chain/idempotência

**Execução atual (2026-02-23):**

- **PASS** — `35 passed | 0 failed | 0 skipped`.

---

## 5) Critérios técnicos de aprovação

- [ ] **Order create idempotent** (`p_idempotency_key` no Core + FE)
- [ ] **Payment idempotent** (sem duplicação por retry)
- [ ] **Fiscal immutable** (UPDATE/DELETE bloqueados)
- [ ] **Hash chain íntegra** (`event_store` + fiscal)
- [ ] **Offline safe** (fila IndexedDB + dedup backend)
- [ ] **Print safe** (`orderExistsInCore` antes de enviar)
- [ ] **Version conflict guard** ativo
- [ ] **Webhook ordering guard** ativo para Stripe

---

## 6) Risco residual (não-código)

Itens que permanecem operacionais (não bloqueiam release de código, mas exigem plano de operação):

- [ ] Impressão física (drivers/dispositivo/rede local)
- [ ] Qualidade da rede do restaurante
- [ ] Treino da equipa para fallback offline
- [ ] Rotina de suporte no dia de abertura

---

## 7) Rollback rápido

Se qualquer gate bloqueante falhar:

1. Suspender abertura operacional.
1. Reverter para artefato conhecido estável (último release aprovado).
1. Reexecutar:

```bash
bash scripts/core/health-check-core.sh
bash scripts/flows/proof_fiscal_offline.sh
```

1. Reabrir apenas com todos os bloqueantes em PASS.

---

## 8) Registro de evidências (preencher)

| Data/Hora              | Execução                                            | Resultado                                           | Operador | Evidência                              |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------- | -------- | -------------------------------------- |
| 2026-02-23             | `pnpm run audit:release:portal`                     | **PASS** (83 files; 431 pass, 2 skip)               | Copilot  | agent-tools output                     |
| 2026-02-23             | `bash scripts/truth-stress.sh`                      | **FAIL** (380 failed, 80 pass, 40 skip)             | Copilot  | output terminal + artifacts Playwright |
| 2026-02-23 11:36       | `pnpm run audit:release:portal`                     | **FAIL** (12 falhas)                                | Copilot  | log do comando em workspaceStorage     |
| 2026-02-23 11:43       | `bash scripts/flows/validate-critical-flow-full.sh` | **PASS** (7/0)                                      | Copilot  | output terminal                        |
| 2026-02-23 11:43–12:31 | `bash scripts/truth-stress.sh`                      | **FAIL** (380 falhas)                               | Copilot  | output terminal + artifacts Playwright |
| 2026-02-23 12:25       | `bash scripts/flows/proof_fiscal_offline.sh`        | **PASS** (26/0/0)                                   | Copilot  | output terminal                        |
| 2026-02-23 12:26       | `bash scripts/flows/run-fiscal-sync-rehearsal.sh`   | **PASS** (35/0/0)                                   | Copilot  | output terminal                        |
| 2026-02-22             | `pnpm run audit:release:portal`                     | **FAIL** (11 falhas)                                | Agent    | Vitest merchant-portal                 |
| 2026-02-22             | `bash scripts/flows/validate-critical-flow-full.sh` | **PASS** (7/0)                                      | Agent    | output terminal                        |
| 2026-02-22             | `bash scripts/flows/proof_fiscal_offline.sh`        | **PASS** (26/0/0)                                   | Agent    | output terminal                        |
| 2026-02-22             | `bash scripts/flows/run-fiscal-sync-rehearsal.sh`   | **PASS** (35/0/0)                                   | Agent    | output terminal                        |
| 2026-02-22             | `bash scripts/truth-stress.sh`                      | **FAIL** (timeout 10 min; muitas falhas Playwright) | Agent    | terminals/840167.txt (parcial)         |
| 2026-02-23             | `pnpm run audit:release:portal`                     | **PASS** (~68s)                                     | Agent    | agent-tools output                     |
| 2026-02-23             | `bash scripts/flows/validate-critical-flow-full.sh` | **PASS** (7/0)                                      | Agent    | output terminal                        |
| 2026-02-23             | `bash scripts/flows/proof_fiscal_offline.sh`        | **PASS** (26/0/0)                                   | Agent    | output terminal                        |
| 2026-02-23             | `bash scripts/flows/run-fiscal-sync-rehearsal.sh`   | **PASS** (35/0/0)                                   | Agent    | output terminal                        |
| 2026-02-23             | `bash scripts/truth-stress.sh`                      | **Em execução** (background)                        | Agent    | terminals/347952.txt                   |
| 2026-02-23 12:37       | `pnpm run audit:release:portal`                     | **PASS** (83 files; 431 pass, 2 skip)               | Agent    | agent-tools output                     |
| 2026-02-23 12:40       | `bash scripts/validate-system-laws.sh`              | **PASS** (0 erros, 0 warnings)                      | Agent    | output terminal                        |
| 2026-02-23 12:41       | `pnpm run audit:release:portal`                     | **PASS** (revalidação pós-fix)                      | Agent    | agent-tools output                     |

---

## 9) Decisão Go/No-Go

- [ ] **GO** — todos os bloqueantes em PASS
- [ ] **NO-GO** — ao menos um bloqueante falhou

**Estado desta execução:** `NO-GO` para abertura formal por **truth-stress** ainda falho no último snapshot conhecido (timeouts em `page.textContent('h1')`). Gate oficial e validação das leis: **PASS**.

Responsável técnico: **\*\*\*\***\_\_\_\_**\*\*\*\***
Data: **\*\*\*\***\_\_\_\_**\*\*\*\***
