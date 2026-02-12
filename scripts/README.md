# CHEFIAPP POS CORE — Scripts de Auditoria Massiva

Scripts para executar o protocolo completo de caça-falha.

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
