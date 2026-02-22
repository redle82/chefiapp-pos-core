# CHEFIAPP POS CORE — Scripts de Auditoria Massiva

Scripts para executar o protocolo completo de caça-falha.

## Critical flow validation

- **Single flow:** `bash scripts/flows/run-critical-flow.sh`
- **Load (50–100 orders):** `bash scripts/flows/run-critical-flow-load.sh` (use `CRITICAL_FLOW_LOAD_COUNT=100` to override)
- **Chaos (network failure):** `bash scripts/flows/run-critical-flow-chaos.sh`
- **Full gate:** `bash scripts/flows/validate-critical-flow-full.sh` (single + load; add `CRITICAL_FLOW_CHAOS=1` to include chaos)

---

## TypeScript baseline gate

- **Baseline:** `scripts/baseline-ts-errors.txt` (current cap for TS error count).
- **Gate:** `bash scripts/ci/ts-error-gate.sh` — fails if TS errors exceed baseline. Used in CI.
- **Classification:** `docs/audit/ts-errors-classification.md`.

## Scripts Disponíveis

### 1. `preflight.sh` — Pré-Flight Check

Verifica pré-requisitos antes de rodar testes:

- Node.js e NPM instalados
- Docker e Docker Compose disponíveis
- PostgreSQL rodando e acessível

**Uso:**

```bash
./scripts/preflight.sh
```

### 2. `run_audit_hunt.sh` — Audit Hunt Completo

Executa os 3 níveis de teste sequencialmente:

1. **PILOT** (5 restaurantes, rápido)
2. **MASSIVE** (50 restaurantes, completo)
3. **STRESS** (100 restaurantes, extremo)

**Uso:**

```bash
./scripts/run_audit_hunt.sh
```

### 3. `seed_miner.sh` — Caça-Falha por Seed

Varre um range de seeds até encontrar o primeiro que falha.

**Uso:**

```bash
# Varre seeds de 1 a 5000
./scripts/seed_miner.sh 1 5000

# Range customizado
./scripts/seed_miner.sh 1000 2000
```

**Output quando falha:**

```
==> Testing SEED=4187...
    ✗ FAIL SEED=4187

================================================
FALHA ENCONTRADA!
================================================
Seed que falhou: 4187
Log: /tmp/chefiapp_seed_miner/audit_seed_4187.log
Report: audit-reports/audit-seed-4187.json

Para reproduzir:
  WORLD_SEED=4187 npm run test:massive
================================================
```

### 4. `seed_reducer.sh` — Minimizador de Falha

Reduz progressivamente a escala mantendo o seed que falhou, até encontrar a configuração mínima que ainda reproduz o bug.

**Uso:**

```bash
# Usar o seed que falhou no seed_miner
./scripts/seed_reducer.sh 4187
```

**Output:**

```
================================================
SEED REDUCER — Resultado
================================================
Seed: 4187
Status: ✗ Bug reproduzido
Nível mínimo: 4

Configuração mínima que falha:
  WORLD_SEED=4187
  WORLD_RESTAURANTS=5
  WORLD_TABLES_PER_RESTAURANT=5
  WORLD_ORDERS_PER_RESTAURANT=30
  WORLD_CONCURRENCY=5

Comando para reproduzir:
  WORLD_SEED=4187 WORLD_RESTAURANTS=5 ... npm run test:massive
================================================
```

## Workflow Completo de Caça-Falha

### 1. Verificação Inicial

```bash
./scripts/preflight.sh
```

### 2. Rodar Níveis Básicos

```bash
./scripts/run_audit_hunt.sh
```

### 3. Caçar Seeds que Falham

```bash
# Varre 1000 seeds
./scripts/seed_miner.sh 1 1000
```

### 4. Minimizar Falha Encontrada

```bash
# Supondo que seed 4187 falhou
./scripts/seed_reducer.sh 4187
```

### 5. Testar com Failpoints

```bash
# Injetar falhas probabilísticas (1%)
FAILPOINT_ENABLED=true \
FAILPOINT_PROB=0.01 \
WORLD_SEED=4187 \
npm run test:massive
```

## Logs e Relatórios

### Localização

- **Logs do Seed Miner**: `/tmp/chefiapp_seed_miner/audit_seed_*.log`
- **Logs do Seed Reducer**: `/tmp/chefiapp_seed_reducer/reduce_level*.log`
- **Relatórios JSON**: `./audit-reports/audit-*.json`
- **Relatórios Markdown**: `./audit-reports/audit-*.md`

### Relatório Principal

Sempre gerado em:

- `./audit-reports/audit-report.json`
- `./audit-reports/audit-report.md`

```bash
# Ver relatório markdown
cat audit-reports/audit-report.md

# Extrair informações do JSON
jq '.verdict' audit-reports/audit-report.json
jq '.assertions.failed' audit-reports/audit-report.json
jq '.metrics.failpoints' audit-reports/audit-report.json
```

## Variáveis de Ambiente

### Configuração do Mundo

| Variável                      | Padrão | Descrição                   |
| ----------------------------- | ------ | --------------------------- |
| `WORLD_SEED`                  | 1337   | Seed para reprodutibilidade |
| `WORLD_RESTAURANTS`           | 50     | Número de restaurantes      |
| `WORLD_TABLES_PER_RESTAURANT` | 20     | Mesas por restaurante       |
| `WORLD_ORDERS_PER_RESTAURANT` | 200    | Pedidos por restaurante     |
| `WORLD_CONCURRENCY`           | 20     | Operações concorrentes      |
| `WORLD_TIMEOUT_MS`            | 300000 | Timeout (5 min)             |

### Chaos Engineering

| Variável                       | Padrão | Descrição                    |
| ------------------------------ | ------ | ---------------------------- |
| `WORLD_DUPLICATE_WEBHOOK_PROB` | 0.05   | Prob. webhook duplicado (5%) |
| `WORLD_DELAYED_WEBHOOK_MAX_MS` | 5000   | Delay máximo webhook         |
| `WORLD_FISCAL_OFFLINE_PROB`    | 0.10   | Prob. fiscal offline (10%)   |

### Failpoint Injection

| Variável            | Padrão | Descrição                        |
| ------------------- | ------ | -------------------------------- |
| `FAILPOINT_ENABLED` | false  | Ativar injeção de falhas         |
| `FAILPOINT_PROB`    | 0.0    | Probabilidade de falha (0.0-1.0) |

### Relatórios

| Variável            | Padrão | Descrição                     |
| ------------------- | ------ | ----------------------------- |
| `AUDIT_REPORT_JSON` | auto   | Caminho do relatório JSON     |
| `AUDIT_REPORT_MD`   | auto   | Caminho do relatório Markdown |

## Exemplos de Uso

### Teste Rápido (Pilot)

```bash
WORLD_SEED=1337 \
WORLD_RESTAURANTS=5 \
WORLD_ORDERS_PER_RESTAURANT=50 \
npm run test:massive
```

### Teste Completo (Massive)

```bash
WORLD_SEED=20251222 \
WORLD_RESTAURANTS=50 \
WORLD_ORDERS_PER_RESTAURANT=200 \
WORLD_CONCURRENCY=20 \
npm run test:massive
```

### Teste com Chaos (Stress)

```bash
WORLD_SEED=999001 \
WORLD_RESTAURANTS=100 \
WORLD_ORDERS_PER_RESTAURANT=500 \
WORLD_CONCURRENCY=50 \
WORLD_DUPLICATE_WEBHOOK_PROB=0.20 \
WORLD_FISCAL_OFFLINE_PROB=0.30 \
npm run test:stress
```

### Reproduzir Bug Específico

```bash
# Bug encontrado no seed 4187 com configuração mínima
WORLD_SEED=4187 \
WORLD_RESTAURANTS=5 \
WORLD_TABLES_PER_RESTAURANT=5 \
WORLD_ORDERS_PER_RESTAURANT=30 \
WORLD_CONCURRENCY=5 \
npm run test:massive
```

## Troubleshooting

### Script não executa

```bash
# Dar permissão de execução
chmod +x scripts/*.sh
```

### PostgreSQL não conecta

```bash
# Verificar se está rodando
docker-compose ps

# Reiniciar
docker-compose down
docker-compose up -d

# Testar conexão
docker-compose exec db psql -U test_user -d chefiapp_core_test -c "SELECT NOW();"
```

### Teste trava (timeout)

```bash
# Aumentar timeout
WORLD_TIMEOUT_MS=600000 npm run test:massive

# Reduzir escala
WORLD_RESTAURANTS=10 WORLD_ORDERS_PER_RESTAURANT=50 npm run test:massive
```

### Seed Miner demorando muito

```bash
# Reduzir range
./scripts/seed_miner.sh 1 100  # Só 100 seeds

# Ou rodar em paralelo (cuidado com recursos)
for i in {1..10}; do
  START=$((($i - 1) * 100 + 1))
  END=$(($i * 100))
  ./scripts/seed_miner.sh $START $END &
done
wait
```

## Interpretação de Resultados

### ✓ Todos Passaram

Sistema robusto. Pode prosseguir para produção.

### ✗ PILOT Falhou

Problema básico. Verificar:

- Configuração do ambiente
- Schema do banco de dados
- Dependências instaladas

### ✗ MASSIVE Falhou (mas PILOT passou)

Bug em escala média. Ações:

1. Anotar o seed que falhou
2. Usar `seed_reducer.sh` para minimizar
3. Reproduzir localmente com configuração mínima
4. Debugar

### ✗ STRESS Falhou (mas MASSIVE passou)

Normal sob carga extrema. Avaliar:

- Se é limite esperado de recursos
- Se é bug de concorrência real
- Se precisa otimização de performance

### Failpoints Quebraram Tudo

Excelente! Significa que os failpoints estão funcionando. Verificar:

- Se o sistema se recupera após failpoint
- Se há rollback correto
- Se não há corrupção de dados

---

**Construído com rigor pelo Goldmonkey Empire**

---

## Backup & Restore (Postgres)

Automate full database backup and restore for the core Postgres container.

### Backup

```bash
./scripts/backup_restore.sh backup docker-core/backups/core_full_$(date +%Y%m%d_%H%M%S).sql
```

- Dumps the full database to a timestamped file in `docker-core/backups/`.
- Default database: `postgres` (override with third argument).

### Restore

```bash
./scripts/backup_restore.sh restore docker-core/backups/core_full_YYYYMMDD_HHMMSS.sql
```

- Restores the specified backup file to the database.
- Default database: `postgres` (override with third argument).

### Example

Backup:

```bash
./scripts/backup_restore.sh backup docker-core/backups/core_full_20260211_120000.sql
```

Restore:

```bash
./scripts/backup_restore.sh restore docker-core/backups/core_full_20260211_120000.sql
```

---

## Internal Alerting: Invalid States

Automate detection and logging of invalid states in the database.

### Scheduled Check

```bash
./scripts/check_invalid_states.sh
```

- Runs the `log_alerts_from_invalid_states()` function in Postgres.
- Logs alerts for any detected invalid states (e.g., orphaned shifts).
- Can be scheduled via cron or CI for continuous monitoring.

### How it works

- The database migration defines:
  - `check_invalid_states()`: returns rows with problems (e.g., orphaned records).
  - `log_alerts_from_invalid_states()`: logs alerts for each detected problem.
- The script triggers this logic and prints results.

---

## Quick Reference by Category

| Category       | Key Scripts                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **Setup**      | `chef-world-up.sh`, `preflight.sh`, `connect-db.sh`                                                      |
| **Migrations** | `migrate.ts`, `apply-migration-cli.ts`, `backup_restore.sh`                                              |
| **Testing**    | `stress-orders-massive.ts`, `chaos-test-massive.ts`, `load-test.js`                                      |
| **Audit**      | `audit-360.sh`, `audit-writes.ts`, `sovereignty-gate.sh`                                                 |
| **CI/CD**      | `sovereignty-gate.sh`, `contract-gate.sh`, `check-phase-guardian.sh`                                     |
| **Demo**       | `demo-one-command.sh`, `create-orders-all-origins.sh`                                                    |
| **Debug**      | `debug_connectivity.ts`, `diag-db.js`, `assess_reality.ts`                                               |
| **Deployment** | `deploy-production.sh`, `pre-flight-check.sh`, `smoke-test.sh`, `emergency-rollback.sh`                  |
| **Monitoring** | `setup-sentry.sh`, `verify-monitoring.sh`, `configure-sentry-alerts.sh`                                  |
| **Rollout**    | `t-plus-1h-checklist.sh`, `t-plus-6h-checklist.sh`, `t-plus-24h-checklist.sh`, `t-plus-48h-checklist.sh` |

---

# 🚀 Production Deployment & Monitoring

## Overview

Comprehensive automation pipeline for safe production rollouts with phased monitoring.

### Architecture

```
Pre-flight Check → validates deployment readiness
    ↓
Production Deployment → deploys to Vercel with safety confirmation
    ↓
Smoke Test → validates critical functionality (8 test categories)
    ↓
T+1h Checklist → internal team testing (GO/NO-GO decision)
    ↓
T+6h Checklist → pilot customer validation (3-5 restaurants)
    ↓
T+24h Checklist → full rollout monitoring (all users)
    ↓
T+48h Review → stabilization review and completion report
```

## Quick Start Guide

### 1. Setup Monitoring (One-time)

```bash
# Configure Sentry for error tracking
bash scripts/monitoring/setup-sentry.sh

# Verify monitoring infrastructure
bash scripts/monitoring/verify-monitoring.sh

# Create alert rules (4 critical alerts)
bash scripts/monitoring/configure-sentry-alerts.sh
```

### 2. Production Deployment

```bash
# Validate deployment readiness
bash scripts/deploy/pre-flight-check.sh

# Deploy to production (with safety confirmation)
bash scripts/deploy/deploy-production.sh

# Validate deployment success
bash scripts/deploy/smoke-test.sh
```

### 3. Rollout Monitoring

```bash
# T+1h: Internal team validation
bash scripts/rollout/t-plus-1h-checklist.sh

# T+6h: Pilot customers (3-5 restaurants)
bash scripts/rollout/t-plus-6h-checklist.sh

# T+24h: Full rollout monitoring
bash scripts/rollout/t-plus-24h-checklist.sh

# T+48h: Stabilization review
bash scripts/rollout/t-plus-48h-checklist.sh
```

### 4. Emergency Response

```bash
# Quick rollback if critical issues detected
bash scripts/deploy/emergency-rollback.sh
```

## Script Details

### Deployment Scripts (`scripts/deploy/`)

#### `pre-flight-check.sh`

Validates deployment readiness with 7 comprehensive checks:

- Release gate (runs `npm run audit:release:portal`)
- Environment variables (required + optional Sentry vars)
- Vercel CLI authentication
- Production build test
- Critical files check (BrowserBlockGuard, tests, docs)
- Git status (uncommitted changes, branch validation)
- Browser-block guard verification (DEV bypass removed)

**Exit Codes:** 0 = passed, 1 = failed (blocking)

#### `deploy-production.sh`

Executes production deployment with safety checks:

1. Safety confirmation (requires typing "yes")
2. Pre-flight checks (exits if fails)
3. Records deployment metadata
4. Deploys to Vercel (`vercel --prod`)
5. Verifies deployment (HTTP 200 + browser-block enforcement)
6. Displays post-deployment checklist

**Output Files:**

- `/tmp/vercel-deploy.log`
- `/tmp/production-url.txt`
- `/tmp/deployment-metadata.json`

#### `smoke-test.sh`

Validates critical functionality with 8 test categories:

1. Site reachability
2. Critical pages (/, /merchant, /merchant/login)
3. **Browser-block enforcement** (CRITICAL: /op/tpv, /op/kds, /app/staff must block)
4. Static assets
5. API endpoints
6. Performance (response time)
7. Security headers
8. Sentry integration detection

**Critical:** Browser-block bypass = immediate rollback recommendation

#### `emergency-rollback.sh`

Quick rollback with verification:

1. Shows last 5 deployments
2. Operator selects target deployment
3. Records rollback metadata (reason, operator, timestamps)
4. Executes rollback (`vercel promote`)
5. Verifies rollback success
6. Runs smoke tests on rolled-back version

**Requires:** Typing "ROLLBACK" to confirm

### Monitoring Scripts (`scripts/monitoring/`)

#### `setup-sentry.sh`

Interactive Sentry configuration:

- Collects DSN, auth token, org, project
- Auto-extracts org/project from DSN
- Tests Sentry API connection
- Sets 4 Vercel environment variables
- Creates `.env.production` and `.sentry/config.json`

**Vercel Env Vars:** VITE_SENTRY_DSN, VITE_SENTRY_AUTH_TOKEN, VITE_SENTRY_ORG, VITE_SENTRY_PROJECT

#### `verify-monitoring.sh`

Verifies monitoring infrastructure (12 checks):

- Sentry config file
- Vercel environment variables
- Sentry SDK in code
- ErrorBoundary component
- Logger service
- Vite config (Sentry plugin, sourcemaps)
- Analytics tracking
- Monitoring documentation

**Exit Codes:** 0 = ready, 1 = not ready

#### `configure-sentry-alerts.sh`

Creates 4 critical alert rules via Sentry API:

1. **High Error Rate** - >5% in 1h → Email
2. **New Unhandled Error** - First seen → Email
3. **Performance Degradation** - p95 >3s → Email
4. **Browser-Block Bypass** - Any bypass → Immediate Email

**Requires:** SENTRY_AUTH_TOKEN in environment

### Rollout Scripts (`scripts/rollout/`)

#### `t-plus-1h-checklist.sh`

Internal testing (6 sections, ~20 checks):

- Device access tests (PWA installation on 2 devices)
- **Browser-block verification** (CRITICAL section)
- Core functionality (login, menu, orders, payment)
- Error monitoring (Sentry: error rate <1%, bypass count = 0)
- Performance (LCP <2.5s)
- Core RPC health (Supabase connection pool <90%)

**GO/NO-GO Decision:**

- 0 failures → GO (proceed to T+6h)
- <20% failure rate → CONDITIONAL GO (operator decides)
- ≥20% failure rate → NO-GO (rollback recommended)

#### `t-plus-6h-checklist.sh`

Pilot customer validation:

- Enter 3-5 pilot restaurant names
- Per-restaurant testing (apps installed, staff trained, test order processed)
- Aggregate metrics (6-hour error rate, performance)
- User feedback tracking
- Operational metrics (order processing, payments)
- Infrastructure health

**GO/NO-GO Threshold:** <15% failure rate

#### `t-plus-24h-checklist.sh`

Full rollout monitoring (7 sections):

- User adoption metrics
- Error monitoring (24h window)
- Performance metrics (Core Web Vitals)
- Business metrics (order volume, payment success)
- Support & user feedback (critical ticket tracking)
- Infrastructure stability (24h trends)
- Security & compliance

**Status Threshold:** <10% failure rate = stable

#### `t-plus-48h-checklist.sh`

Stabilization review and completion report:

- Overall rollout health (48h metrics)
- Performance review (sustained validation)
- Business impact assessment
- Incident summary (document all incidents)
- Lessons learned capture
- Documentation & closeout

**Output:** Generates comprehensive T+48h report in `/tmp/`

## Critical Thresholds

| Metric                 | Good  | Warning | Critical         |
| ---------------------- | ----- | ------- | ---------------- |
| Error Rate             | <1%   | 1-5%    | >5% (rollback)   |
| LCP                    | <2.5s | 2.5-4s  | >4s              |
| Browser-Block Bypasses | **0** | N/A     | >0 (investigate) |
| T+1h Failure Rate      | 0%    | <20%    | ≥20% (NO-GO)     |
| T+6h Failure Rate      | 0%    | <15%    | ≥15% (Pause)     |
| T+24h Failure Rate     | 0%    | <10%    | ≥10% (Unstable)  |
| Response Time          | <1s   | 1-3s    | >3s              |
| Connection Pool        | <80%  | 80-90%  | >90%             |

## Environment Variables

See `merchant-portal/.env.production.example` for complete documentation.

**Required:**

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE=https://api.your-domain.com
VITE_INTERNAL_API_TOKEN=secure-token
```

**Optional (Monitoring):**

```bash
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_AUTH_TOKEN=sntrys_...
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=merchant-portal
```

## Emergency Procedures

### Critical Error Detected

```bash
# 1. Check Sentry for error details
# 2. Assess impact (affected users, severity)
# 3. If widespread, execute rollback
bash scripts/deploy/emergency-rollback.sh
# Reason: "Critical error affecting X% of users"
```

### Browser-Block Bypass Detected

```bash
# CRITICAL: Immediate rollback required
bash scripts/deploy/emergency-rollback.sh
# Reason: "Browser-block bypass detected - security violation"
```

### Performance Degradation

```bash
# 1. Check Vercel Analytics and Sentry Performance
# 2. Identify slow queries/endpoints
# 3. If severe (LCP >4s), consider rollback
# 4. Otherwise, prepare performance hotfix
```

## Related Documentation

- [Production Rollout Monitoring Plan](../docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md)
- [Rollout Quick Reference](../docs/ops/ROLLOUT_QUICK_REFERENCE.md)
- [Monitoring Dashboard Setup](../docs/ops/MONITORING_DASHBOARD_SETUP.md)
- [Observability Setup](../docs/ops/OBSERVABILITY_SETUP.md)

## Monitoring Dashboards

**Sentry:**

- Issues: https://sentry.io/organizations/[org]/issues/
- Performance: https://sentry.io/organizations/[org]/performance/
- Alerts: https://sentry.io/organizations/[org]/alerts/rules/

**Vercel:**

- Deployments: https://vercel.com/dashboard/deployments
- Analytics: https://vercel.com/analytics

**Supabase:**

- Database Metrics: [Project] → Database → Metrics
- Logs: [Project] → Logs
