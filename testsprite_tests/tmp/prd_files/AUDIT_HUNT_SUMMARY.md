# MASSIVE AUDIT HUNT — Implementação Completa

## O Que Foi Implementado

Sistema completo de "caça-falha" para encontrar o menor defeito possível no CHEFIAPP POS CORE.

### 1. Scripts de Caça-Falha (`scripts/`)

#### ✓ `seed_miner.sh`
Varre seeds sequencialmente até encontrar o primeiro que falha.
- Para no primeiro FAIL
- Salva logs em `/tmp/chefiapp_seed_miner/`
- Gera relatórios em `audit-reports/audit-seed-*.{json,md}`

**Uso:**
```bash
./scripts/seed_miner.sh 1 20000
```

#### ✓ `seed_reducer.sh`
Minimiza a falha reduzindo progressivamente a escala.
- 6 níveis de redução (médio → nano)
- Mantém o seed que falhou
- Encontra configuração mínima reproduzível

**Uso:**
```bash
./scripts/seed_reducer.sh 4187
```

#### ✓ `preflight.sh`
Verifica pré-requisitos antes de rodar testes.
- Node/NPM instalados
- Docker rodando
- PostgreSQL acessível

**Uso:**
```bash
./scripts/preflight.sh
```

#### ✓ `run_audit_hunt.sh`
Executa os 3 níveis de teste sequencialmente.
- PILOT (5 restaurantes)
- MASSIVE (50 restaurantes)
- STRESS (100 restaurantes)

**Uso:**
```bash
./scripts/run_audit_hunt.sh
```

### 2. Failpoint Injection System

Sistema probabilístico de injeção de falhas para testes de resiliência.

#### ✓ `FailpointInjector` (`tests/harness/FailpointInjector.ts`)
- Controlado por ENV: `FAILPOINT_ENABLED`, `FAILPOINT_PROB`
- Erros identificáveis com `FailpointError`
- Estatísticas de injeção rastreadas

#### Failpoints Implementados:

**CoreTransactionManager** (`core-engine/persistence/CoreTransactionManager.ts`):
- `appendAndSeal.before` — Antes do append
- `appendAndSeal.middle` — Entre append e seal
- `appendAndSeal.after` — Antes do commit

**PostgresLegalSealStore** (`gate3-persistence/PostgresLegalSealStore.ts`):
- `createSeal.before` — Antes de criar seal
- `createSeal.after` — Depois de criar seal

**FiscalEventStore** (`fiscal-modules/FiscalEventStore.ts`):
- `recordInteraction.before` — Antes de gravar fiscal
- `recordInteraction.after` — Depois de gravar fiscal

**StandardProjectionManager** (`projections/StandardProjectionManager.ts`):
- `handleEvent.before` — Antes de atualizar projeções
- `handleEvent.after` — Depois de atualizar projeções

**Uso:**
```bash
FAILPOINT_ENABLED=true FAILPOINT_PROB=0.01 npm run test:massive
```

### 3. Documentação Atualizada

#### ✓ `MASSIVE_AUDIT_PROTOCOL.md`
Adicionada seção completa "Protocolo Caça-Falha":
- Fase 1: Pré-Flight Check
- Fase 2: 3 Camadas de Teste (PILOT → MASSIVE → STRESS)
- Fase 3: Seed Mining
- Fase 4: Minimização de Falha
- Fase 5: Hardening com Failpoints

#### ✓ `scripts/README.md`
Documentação completa dos scripts:
- Uso de cada script
- Workflow completo
- Variáveis de ambiente
- Exemplos práticos
- Troubleshooting

### 4. Relatórios Sempre Gerados

O sistema agora garante geração de relatórios mesmo em falha:
- `audit-reports/audit-report.json` — Sempre atualizado
- `audit-reports/audit-report.md` — Sempre atualizado
- `audit-reports/audit-seed-{SEED}.{json,md}` — Para cada seed testado

## Como Usar (Quick Start)

### 1. Verificação Inicial
```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
./scripts/preflight.sh
```

### 2. Rodar Audit Hunt Completo
```bash
./scripts/run_audit_hunt.sh
```

### 3. Caçar Seeds que Falham
```bash
# Testar 1000 seeds
./scripts/seed_miner.sh 1 1000
```

### 4. Minimizar Falha (se encontrou seed que falha)
```bash
# Exemplo: seed 4187 falhou
./scripts/seed_reducer.sh 4187
```

### 5. Testar com Failpoints
```bash
# Injeção de falhas (1% de probabilidade)
FAILPOINT_ENABLED=true \
FAILPOINT_PROB=0.01 \
WORLD_SEED=1337 \
npm run test:massive
```

## Comandos dos 3 Níveis

### PILOT (Rápido — ~1 min)
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

### MASSIVE (Completo — ~5 min)
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

### STRESS (Extremo — ~10 min)
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

## Estrutura de Arquivos Criados/Modificados

```
chefiapp-pos-core/
├── scripts/                                          [NOVO]
│   ├── README.md                                    ✓ Criado
│   ├── preflight.sh                                 ✓ Criado
│   ├── run_audit_hunt.sh                            ✓ Criado
│   ├── seed_miner.sh                                ✓ Criado
│   └── seed_reducer.sh                              ✓ Criado
│
├── tests/harness/
│   ├── FailpointInjector.ts                         ✓ Criado
│   └── index.ts                                     ✓ Modificado (export)
│
├── core-engine/persistence/
│   └── CoreTransactionManager.ts                    ✓ Modificado (+ failpoints)
│
├── gate3-persistence/
│   └── PostgresLegalSealStore.ts                    ✓ Modificado (+ failpoints)
│
├── fiscal-modules/
│   └── FiscalEventStore.ts                          ✓ Modificado (+ failpoints)
│
├── projections/
│   └── StandardProjectionManager.ts                 ✓ Modificado (+ failpoints)
│
├── MASSIVE_AUDIT_PROTOCOL.md                        ✓ Atualizado (+ caça-falha)
└── AUDIT_HUNT_SUMMARY.md                            ✓ Este arquivo
```

## O Que Você Deve Fazer Agora

### 1. Executar Pré-Flight
```bash
./scripts/preflight.sh
```

### 2. Rodar PILOT (teste rápido)
```bash
WORLD_SEED=1337 WORLD_RESTAURANTS=5 WORLD_ORDERS_PER_RESTAURANT=50 npm run test:massive
```

### 3. Se PILOT passar, rodar Audit Hunt Completo
```bash
./scripts/run_audit_hunt.sh
```

### 4. Analisar Relatório
```bash
cat audit-reports/audit-report.md
```

### 5. Se Algum Teste Falhar

#### Seed conhecido que falhou:
```bash
# Minimizar
./scripts/seed_reducer.sh <SEED>

# Reproduzir com configuração mínima
WORLD_SEED=<SEED> WORLD_RESTAURANTS=5 ... npm run test:massive
```

#### Seed desconhecido:
```bash
# Caçar
./scripts/seed_miner.sh 1 1000
```

### 6. Testar Resiliência com Failpoints
```bash
FAILPOINT_ENABLED=true FAILPOINT_PROB=0.01 WORLD_SEED=1337 npm run test:massive
```

## Quando Você Receber o Primeiro FAIL

O script vai te mostrar:

```
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

Últimas 30 linhas do log:
---
[trecho do erro]
---
```

**Envie para mim:**
1. O seed que falhou
2. O trecho "Failed Assertions" do `audit-report.md`
3. Ou o arquivo `audit-seed-{SEED}.json` completo

Aí eu entro no modo "cirurgião" e te devolvo a menor correção possível.

## Métricas Esperadas

### Sistema Saudável
- ✓ PILOT: 100% pass
- ✓ MASSIVE: 100% pass
- ✓ STRESS: 95%+ pass (aceitável falhas sob carga extrema)
- ✓ Failpoints: Sistema se recupera corretamente

### Sistema com Problemas
- ✗ PILOT falha → Bug básico
- ✗ MASSIVE falha → Bug em escala real
- ✗ Failpoints corrompem dados → Falta atomicidade

## Filosofia do Caça-Falha

> **Este protocolo NÃO tenta passar — ele tenta QUEBRAR o sistema até achar o mínimo defeito.**

1. **Seed Mining**: Varre milhares de seeds até achar 1 que falha
2. **Reduction**: Reduz a falha ao menor mundo possível
3. **Failpoints**: Injeta falhas de infraestrutura em pontos críticos
4. **Chaos**: Duplica webhooks, simula fiscal offline, cria race conditions

Se o sistema sobrevive a isso, ele está pronto para produção.

---

**Status**: ✓ Implementação Completa
**Próximo Passo**: Executar `./scripts/preflight.sh` e depois `./scripts/run_audit_hunt.sh`

---

*Construído com rigor pelo Goldmonkey Empire*
*22 de Dezembro de 2025*
