# CHEFIAPP POS CORE - Massive Audit Protocol

> **Sistema de Auditoria Mundial para Validação de Gates 0-7**
> Documento de referência para execução, interpretação e reprodução de auditorias massivas.

---

## Visão Geral

Este protocolo define como executar testes massivos que simulam centenas de restaurantes operando globalmente, validando todos os gates (0-7) do sistema sob carga real.

### O Que Este Teste Prova

1. **Gate 0-1 (Core & Invariants)**: Máquina de estados determinística, replay idempotente
2. **Gate 2-3 (Legal Seals & Persistence)**: Toda transação confirmada gera seal imutável
3. **Gate 4 (Atomicity)**: Operações atômicas sob concorrência extrema
4. **Gate 5 (Fiscal Isolation)**: Falha fiscal NÃO bloqueia vendas
5. **Gate 7 (UI Projections)**: Projeções consistentes e rebuilváveis

---

## Configuração por Variáveis de Ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| `WORLD_SEED` | 1337 | Seed para reprodutibilidade |
| `WORLD_RESTAURANTS` | 50 | Número de restaurantes simulados |
| `WORLD_TABLES_PER_RESTAURANT` | 20 | Mesas por restaurante |
| `WORLD_ORDERS_PER_RESTAURANT` | 200 | Pedidos por restaurante |
| `WORLD_ITEMS_PER_ORDER_MAX` | 12 | Máximo de itens por pedido |
| `WORLD_CONCURRENCY` | 20 | Operações concorrentes |
| `WORLD_TIMEZONES` | Europe/Madrid,America/New_York,America/Sao_Paulo | Fusos horários |
| `WORLD_CURRENCIES` | EUR,USD,BRL | Moedas |
| `WORLD_DUPLICATE_WEBHOOK_PROB` | 0.05 | Probabilidade de webhook duplicado |
| `WORLD_FISCAL_OFFLINE_PROB` | 0.10 | Probabilidade de fiscal offline |

---

## Como Executar

### 1. Instalação

```bash
# Instalar dependências
npm install

# Verificar se tudo está ok
npm test
```

### 2. Testes Pilot (Sanity Check)

```bash
# Rápido, ~1 minuto
npm run test:pilot

# Equivalente a:
# 5 restaurantes, 10 mesas, 50 pedidos
```

### 3. Testes Massivos (World Simulation)

```bash
# Configuração padrão (~5 minutos)
npm run test:massive

# Equivalente a:
# 50 restaurantes, 20 mesas, 200 pedidos por restaurante
```

### 4. Testes de Stress (Extreme Load)

```bash
# Carga extrema (~10 minutos)
npm run test:stress

# Equivalente a:
# 100 restaurantes, 30 mesas, 500 pedidos por restaurante
# 50 operações concorrentes
```

### 5. Auditoria Completa com Relatório

```bash
# Gera relatório JSON + Markdown
npm run audit:report

# Relatórios salvos em: ./audit-reports/
```

### 6. Reprodução por Seed

```bash
# Reproduzir exatamente o mesmo teste
WORLD_SEED=42 npm run test:massive

# Customização completa
WORLD_SEED=1234 \
WORLD_RESTAURANTS=100 \
WORLD_ORDERS_PER_RESTAURANT=500 \
npm run test:stress
```

### 7. Seed Miner — Caça-Falha Automático

```bash
# Varre seeds de 1 até 20000, para no primeiro que falha
./scripts/seed_miner.sh 1 20000

# Range customizado
./scripts/seed_miner.sh 5000 10000

# Logs salvos em /tmp/chefiapp_seed_miner/
# Relatórios em audit-reports/audit-seed-*.{json,md}
```

### 8. Seed Reducer — Minimizador de Falha

```bash
# Após encontrar seed que falha, reduzir escala até mundo mínimo
./scripts/seed_reducer.sh 4187

# Resultado: menor configuração que ainda reproduz a falha
```

### 9. Failpoint Injection — Testes de Resiliência

```bash
# Ativar injeção de falhas probabilística (1% de chance)
FAILPOINT_ENABLED=true \
FAILPOINT_PROB=0.01 \
WORLD_SEED=1337 \
npm run test:massive

# Simula falhas de rede/DB em:
# - CoreTransactionManager.appendAndSeal
# - PostgresLegalSealStore.createSeal
# - FiscalEventStore.recordInteraction
# - ProjectionManager.handleEvent
```

---

## Protocolo Caça-Falha (Massive Audit Hunter)

Este protocolo NÃO tenta "passar" — ele tenta **quebrar o sistema** até achar o mínimo defeito.

### Fase 1: Pré-Flight (Obrigatório)

Eliminar falsos-positivos antes de começar:

```bash
# 1. Verificar Docker
docker-compose up -d

# 2. Verificar Node/NPM
node -v
npm -v

# 3. Verificar PostgreSQL
psql "postgres://test_user:test_password@localhost:5432/chefiapp_core_test" -c "select now();"

# Se o psql falhar, todo "teste massivo" vira ruído
```

### Fase 2: Massive Test — 3 Camadas

#### A) PILOT (Sanity Check — ~1 minuto)

```bash
WORLD_SEED=1337 \
WORLD_RESTAURANTS=5 \
WORLD_TABLES_PER_RESTAURANT=10 \
WORLD_ORDERS_PER_RESTAURANT=50 \
WORLD_CONCURRENCY=5 \
WORLD_DUPLICATE_WEBHOOK_PROB=0.10 \
WORLD_FISCAL_OFFLINE_PROB=0.20 \
npm run test:massive
```

#### B) MASSIVE (Onde Aparece o "Mínimo Falho" — ~5 minutos)

```bash
WORLD_SEED=20251222 \
WORLD_RESTAURANTS=50 \
WORLD_TABLES_PER_RESTAURANT=20 \
WORLD_ORDERS_PER_RESTAURANT=200 \
WORLD_CONCURRENCY=20 \
WORLD_BATCH_SIZE=200 \
WORLD_TIMEOUT_MS=300000 \
WORLD_DUPLICATE_WEBHOOK_PROB=0.05 \
WORLD_DELAYED_WEBHOOK_MAX_MS=5000 \
WORLD_FISCAL_OFFLINE_PROB=0.10 \
npm run test:massive
```

#### C) STRESS + CHAOS (Quebrar de Propósito — ~10 minutos)

```bash
WORLD_SEED=999001 \
WORLD_RESTAURANTS=100 \
WORLD_TABLES_PER_RESTAURANT=30 \
WORLD_ORDERS_PER_RESTAURANT=500 \
WORLD_CONCURRENCY=50 \
WORLD_TIMEOUT_MS=600000 \
WORLD_DUPLICATE_WEBHOOK_PROB=0.20 \
WORLD_DELAYED_WEBHOOK_MAX_MS=10000 \
WORLD_FISCAL_OFFLINE_PROB=0.30 \
npm run test:massive
```

### Fase 3: Seed Mining — Encontrar o Seed que Quebra

```bash
# Varre seeds de 1 a 5000
./scripts/seed_miner.sh 1 5000

# Quando falhar, você terá:
# 1. O seed exato que quebrou
# 2. Log completo em /tmp/chefiapp_seed_miner/audit_seed_*.log
# 3. Relatório em audit-reports/audit-seed-*.json
```

Exemplo de output quando falha:

```
==> Testing SEED=4187...
    ✗ FAIL SEED=4187

================================================
FALHA ENCONTRADA!
================================================
Seed que falhou: 4187
Log completo: /tmp/chefiapp_seed_miner/audit_seed_4187.log
Report JSON: audit-reports/audit-seed-4187.json
Report MD: audit-reports/audit-seed-4187.md

Para reproduzir:
  WORLD_SEED=4187 npm run test:massive

Para reduzir escala (minimizar falha):
  WORLD_SEED=4187 WORLD_RESTAURANTS=10 WORLD_ORDERS_PER_RESTAURANT=50 npm run test:massive
================================================
```

### Fase 4: Minimização da Falha — Reduzir até o Mundo Mínimo

Com o seed que falhou (ex: 4187), use o reducer:

```bash
./scripts/seed_reducer.sh 4187
```

O reducer testa progressivamente:

1. **Mundo médio**: 50 restaurantes, 20 mesas, 200 pedidos
2. **Mundo pequeno**: 20 restaurantes, 10 mesas, 100 pedidos
3. **Mundo tiny**: 10 restaurantes, 10 mesas, 50 pedidos
4. **Mundo minimal**: 5 restaurantes, 5 mesas, 30 pedidos
5. **Mundo micro**: 3 restaurantes, 5 mesas, 20 pedidos
6. **Mundo nano**: 1 restaurante, 3 mesas, 10 pedidos

Meta: **Chegar num mundo mínimo que ainda quebra** — isso vira bug reproduzível em 30s.

Exemplo de output:

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
  WORLD_SEED=4187 WORLD_RESTAURANTS=5 WORLD_TABLES_PER_RESTAURANT=5 WORLD_ORDERS_PER_RESTAURANT=30 WORLD_CONCURRENCY=5 npm run test:massive
================================================
```

### Fase 5: Hardening Extra — Armas de Caça

#### 1. Failpoint Injection (Simular Erro de Rede/DB)

```bash
# Probabilidade baixa (1%) para não virar caos total
FAILPOINT_ENABLED=true \
FAILPOINT_PROB=0.01 \
WORLD_SEED=1337 \
npm run test:massive
```

Failpoints injetados em:
- `CoreTransactionManager.appendAndSeal` (antes, meio, depois)
- `PostgresLegalSealStore.createSeal` (antes, depois)
- `FiscalEventStore.recordInteraction` (antes, depois)
- `ProjectionManager.handleEvent` (antes, depois)

#### 2. Concurrency Collision Real

Gerar múltiplas operações no mesmo `stream_id` com versions conflitantes:

```bash
WORLD_CONCURRENCY=50 \
WORLD_SEED=1337 \
npm run test:massive
```

#### 3. Verificação de Estatísticas de Failpoint

```bash
# Após teste com failpoints, verificar estatísticas no relatório:
cat audit-reports/audit-report.json | jq '.metrics.failpoints'

# Exemplo de output:
# {
#   "enabled": true,
#   "probability": 0.01,
#   "injected": 15,
#   "total": 1523,
#   "injectionRate": 0.00985
# }
```

---

## Estrutura de Arquivos

```
tests/
├── harness/                    # Infraestrutura de teste
│   ├── WorldConfig.ts          # Configuração e SeededRandom
│   ├── WorldFactory.ts         # Geração de mundo simulado
│   ├── ScenarioRunner.ts       # Execução de cenários
│   ├── AuditAsserts.ts         # Assertions por gate
│   ├── Metrics.ts              # Coleta de métricas
│   ├── ReportWriter.ts         # Geração de relatórios
│   └── index.ts                # Exports
│
├── massive/                    # Testes massivos
│   ├── gate0_1.invariants.world.test.ts
│   ├── gate2_3.seals.persistence.world.test.ts
│   ├── gate4.atomicity.concurrency.world.test.ts
│   ├── gate5.fiscal.isolation.world.test.ts
│   ├── gate7.projections.world.test.ts
│   └── global.end_to_end.audit.test.ts
│
└── setup.ts                    # Configuração global
```

---

## Interpretação do Relatório

### Estrutura do Relatório

```
audit-reports/
├── audit-report.json           # Dados completos
├── audit-report.md             # Visualização humana
└── audit-report-{timestamp}.{json,md}  # Histórico
```

### Seções do Relatório

1. **Verdict**: Aprovado/Reprovado com grau (A-F)
2. **World Statistics**: Estatísticas do mundo gerado
3. **Performance Metrics**: Throughput, latência
4. **Gate Assertions**: Resultados por gate
5. **Failed Assertions**: Detalhes de falhas
6. **Recommendations**: Sugestões de melhoria

### Graus

| Grau | Critério |
|------|----------|
| A | 100% dos gates críticos + 99%+ assertions |
| B | 100% críticos + 95%+ assertions |
| C | 100% críticos + 90%+ assertions |
| D | 100% críticos + 80%+ assertions |
| F | Qualquer gate crítico falhando |

### Gates Críticos (Não Negociáveis)

- **Gate 0-1**: Invariantes financeiras
- **Gate 2-3**: Imutabilidade de seals
- **Gate 4**: Atomicidade de transações

---

## Assertions Obrigatórias (Audit Proof)

### Gate 0-1: Core Invariants

| Assertion | Descrição |
|-----------|-----------|
| `REPLAY_DETERMINISM` | Mesma seed = mesmo resultado |
| `VALID_STATE_TRANSITION` | Só transições válidas na máquina de estados |
| `NON_NEGATIVE_AMOUNTS` | Nunca valores financeiros negativos |
| `STREAM_VERSION_SEQUENTIAL` | Versões sempre sequenciais |

### Gate 2-3: Legal Seals

| Assertion | Descrição |
|-----------|-----------|
| `NO_EVENT_WITHOUT_SEAL` | Todo PAYMENT_CONFIRMED gera PAYMENT_SEALED |
| `NO_SEAL_WITHOUT_EVENT` | Todo seal referencia evento real (FK) |
| `NO_DUPLICATE_SEALS` | UNIQUE (entity_type, entity_id, legal_state) |
| `SEAL_SEQUENCE_MONOTONIC` | sequence sempre crescente |
| `IMMUTABILITY_ENFORCED` | UPDATE/DELETE bloqueados |

### Gate 4: Atomicity

| Assertion | Descrição |
|-----------|-----------|
| `CONCURRENCY_CONFLICT_DETECTION` | Conflitos de versão detectados |
| `ATOMIC_ROLLBACK` | Rollback completo ou commit completo |
| `IDEMPOTENCY` | Operações idempotentes |

### Gate 5: Fiscal

| Assertion | Descrição |
|-----------|-----------|
| `FISCAL_ISOLATION` | Fiscal offline não bloqueia core |
| `FISCAL_IDEMPOTENCY` | Sem registros fiscais duplicados |
| `FISCAL_SEQUENCE_INCREASING` | Sequência fiscal crescente |

### Gate 7: Projections

| Assertion | Descrição |
|-----------|-----------|
| `PROJECTION_CONSISTENCY` | Projeção = verdade do evento |
| `ORDER_SUMMARY_CORRECTNESS` | Status e totais corretos |
| `ACTIVE_ORDERS_FILTER` | Filtro OPEN/PAID funciona |
| `PROJECTION_REBUILDABLE` | Reset + replay = mesmo estado |

---

## Canais de Pagamento Simulados

O teste simula 4 canais distintos, todos convergindo para a mesma verdade:

| Canal | Fluxo |
|-------|-------|
| `TABLE_QR` | Mesa → QR → Gateway → Webhook → Core |
| `WEB_LINK` | Link → Gateway → Webhook → Core |
| `WAITER_CASH` | Garçom → DECLARE_CASH → Core |
| `TOTEM` | Totem → Gateway → Webhook → Core |

**Ponto crítico**: Nenhum canal "confirma" pagamento. A confirmação só vem de:
- Gateway (webhook verificado)
- Core (cash declarado validado)

---

## Métricas de Performance

### Mínimos Aceitáveis

| Métrica | Mínimo | Ideal |
|---------|--------|-------|
| Events/sec | 100 | 1000+ |
| Seals/sec | 50 | 500+ |
| P99 Latency | < 1000ms | < 100ms |
| Error Rate | < 5% | < 0.1% |

### Como Otimizar

1. **Batch inserts** para eventos (respeitando atomicidade)
2. **Connection pooling** para PostgreSQL
3. **Indexes** nos campos mais consultados
4. **Async fiscal** para não bloquear

---

## Usando com Docker (PostgreSQL)

```bash
# Subir PostgreSQL
docker-compose up -d

# Executar schema
docker exec -i postgres psql -U postgres < schema.sql

# Rodar testes de integração
npm run test:massive

# Derrubar
docker-compose down
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: chefiapp_test
    ports:
      - "5432:5432"
    volumes:
      - ./schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
```

---

## Troubleshooting

### Teste Travando

```bash
# Aumentar timeout
WORLD_STRESS=true jest --testTimeout=900000
```

### Muitos Conflitos de Concorrência

Esperado! O sistema deve detectar e rejeitar conflitos. Se tudo passar, há problema.

### Assertions Falhando

1. Verifique qual gate está falhando
2. Leia a evidência no relatório JSON
3. Reproduza com a mesma seed
4. Investigue o código do gate específico

### Fiscal Travando Core

Se fiscal está bloqueando vendas, o Gate 5 falhou. Verifique:
- FiscalObserver está usando timeouts?
- Erros fiscais estão sendo capturados?
- Core continua após falha fiscal?

---

## Checklist Pré-Deploy

Antes de ir para produção, execute:

```bash
# 1. Pilot run (1 min)
npm run test:pilot

# 2. Full world (5 min)
npm run test:massive

# 3. Stress (10 min) - opcional mas recomendado
npm run test:stress

# 4. Gerar relatório final
npm run audit:report

# 5. Verificar relatório
cat audit-reports/audit-report.md
```

Se grau = A e zero critical issues → **GO**.

---

## Suporte

Para dúvidas sobre este protocolo:

1. Leia o relatório de auditoria
2. Reproduza com a mesma seed
3. Verifique logs de erro
4. Consulte documentação dos gates

---

**Última Atualização**: 2024-12-22
**Versão do Protocolo**: 1.0.0

---

*Construído com rigor pelo Goldmonkey Empire*
