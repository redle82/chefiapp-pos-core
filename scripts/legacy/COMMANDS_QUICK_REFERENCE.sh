#!/usr/bin/env bash
# CHEFIAPP POS CORE — Comandos Prontos para Copiar e Colar
# 
# Use este arquivo como referência rápida.
# Todos os comandos estão prontos para executar.

# ==============================================================================
# 1. PRÉ-FLIGHT CHECK (OBRIGATÓRIO PRIMEIRO)
# ==============================================================================

./scripts/preflight.sh


# ==============================================================================
# 2. TESTES RÁPIDOS — PILOT (Sanity Check ~1 min)
# ==============================================================================

WORLD_SEED=1337 \
WORLD_RESTAURANTS=5 \
WORLD_TABLES_PER_RESTAURANT=10 \
WORLD_ORDERS_PER_RESTAURANT=50 \
WORLD_CONCURRENCY=5 \
WORLD_DUPLICATE_WEBHOOK_PROB=0.10 \
WORLD_FISCAL_OFFLINE_PROB=0.20 \
npm run test:massive


# ==============================================================================
# 3. TESTES COMPLETOS — MASSIVE (World Simulation ~5 min)
# ==============================================================================

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


# ==============================================================================
# 4. TESTES EXTREMOS — STRESS (Extreme Load ~10 min)
# ==============================================================================

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


# ==============================================================================
# 5. AUDIT HUNT COMPLETO (Executa todos os 3 níveis sequencialmente)
# ==============================================================================

./scripts/run_audit_hunt.sh


# ==============================================================================
# 6. SEED MINER — Caça-Falha (Varre seeds até encontrar falha)
# ==============================================================================

# Varre 1000 seeds (ajuste o range conforme necessário)
./scripts/seed_miner.sh 1 1000

# Ranges sugeridos:
./scripts/seed_miner.sh 1 100      # Teste rápido
./scripts/seed_miner.sh 1 1000     # Caça básica
./scripts/seed_miner.sh 1 5000     # Caça profunda
./scripts/seed_miner.sh 1 20000    # Caça exaustiva (pode demorar)


# ==============================================================================
# 7. SEED REDUCER — Minimizador (Após encontrar seed que falha)
# ==============================================================================

# Substitua 4187 pelo seed que falhou no seed_miner
./scripts/seed_reducer.sh 4187


# ==============================================================================
# 8. REPRODUZIR BUG COM SEED CONHECIDO
# ==============================================================================

# Exemplo: Reproduzir falha do seed 4187
WORLD_SEED=4187 npm run test:massive

# Com configuração mínima (após reducer)
WORLD_SEED=4187 \
WORLD_RESTAURANTS=5 \
WORLD_TABLES_PER_RESTAURANT=5 \
WORLD_ORDERS_PER_RESTAURANT=30 \
WORLD_CONCURRENCY=5 \
npm run test:massive


# ==============================================================================
# 9. FAILPOINT INJECTION — Teste de Resiliência
# ==============================================================================

# Baixa probabilidade (0.5% - recomendado para começar)
FAILPOINT_ENABLED=true \
FAILPOINT_PROB=0.005 \
WORLD_SEED=1337 \
npm run test:massive

# Média probabilidade (1% - caça bugs de atomicidade)
FAILPOINT_ENABLED=true \
FAILPOINT_PROB=0.01 \
WORLD_SEED=1337 \
npm run test:massive

# Alta probabilidade (5% - teste extremo de resiliência)
FAILPOINT_ENABLED=true \
FAILPOINT_PROB=0.05 \
WORLD_SEED=1337 \
npm run test:massive


# ==============================================================================
# 10. ANÁLISE DE RELATÓRIOS
# ==============================================================================

# Ver relatório principal (Markdown)
cat audit-reports/audit-report.md

# Ver veredito do último teste
cat audit-reports/audit-report.json | jq '.verdict'

# Ver assertions que falharam
cat audit-reports/audit-report.json | jq '.assertions.details[] | select(.passed == false)'

# Ver estatísticas de failpoints
cat audit-reports/audit-report.json | jq '.metrics.failpoints'

# Listar todos os relatórios gerados
ls -lht audit-reports/


# ==============================================================================
# 11. DOCKER / POSTGRESQL
# ==============================================================================

# Subir PostgreSQL
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f db

# Conectar ao PostgreSQL
docker-compose exec db psql -U test_user -d chefiapp_core_test

# Parar tudo
docker-compose down

# Reiniciar (limpar dados)
docker-compose down -v
docker-compose up -d


# ==============================================================================
# 12. LIMPEZA E MANUTENÇÃO
# ==============================================================================

# Limpar logs do seed miner (economizar espaço)
rm -rf /tmp/chefiapp_seed_miner/*.log

# Limpar logs do seed reducer
rm -rf /tmp/chefiapp_seed_reducer/*.log

# Limpar relatórios antigos (manter só os últimos 10)
cd audit-reports && ls -t audit-report-*.json | tail -n +11 | xargs rm -f
cd audit-reports && ls -t audit-report-*.md | tail -n +11 | xargs rm -f


# ==============================================================================
# 13. DEBUGGING ESPECÍFICO
# ==============================================================================

# Rodar com Jest verbose
WORLD_SEED=1337 npm run test:massive -- --verbose

# Rodar só um arquivo de teste
WORLD_SEED=1337 npx jest tests/massive/gate4.atomicity.concurrency.world.test.ts

# Aumentar timeout manualmente
WORLD_SEED=1337 npx jest tests/massive --testTimeout=900000


# ==============================================================================
# 14. CHECKLIST PRÉ-DEPLOY
# ==============================================================================

# Execute estes comandos nesta ordem antes de ir para produção:

# 1. Pré-flight
./scripts/preflight.sh

# 2. PILOT (deve passar)
WORLD_SEED=1337 WORLD_RESTAURANTS=5 WORLD_ORDERS_PER_RESTAURANT=50 npm run test:massive

# 3. MASSIVE (deve passar)
WORLD_SEED=20251222 WORLD_RESTAURANTS=50 WORLD_ORDERS_PER_RESTAURANT=200 npm run test:massive

# 4. Seed Mining (pelo menos 1000 seeds sem falhas)
./scripts/seed_miner.sh 1 1000

# 5. Failpoints (sistema deve se recuperar)
FAILPOINT_ENABLED=true FAILPOINT_PROB=0.01 WORLD_SEED=1337 npm run test:massive

# 6. Verificar relatório final
cat audit-reports/audit-report.md

# Se grau = A e zero critical issues → GO!


# ==============================================================================
# 15. ATALHOS ÚTEIS
# ==============================================================================

# Teste "one-liner" super rápido
WORLD_SEED=1337 WORLD_RESTAURANTS=3 WORLD_ORDERS_PER_RESTAURANT=20 npm run test:massive

# Teste com todos os chaos habilitados
WORLD_SEED=1337 \
WORLD_DUPLICATE_WEBHOOK_PROB=0.30 \
WORLD_FISCAL_OFFLINE_PROB=0.30 \
WORLD_DELAYED_WEBHOOK_MAX_MS=10000 \
npm run test:massive

# Teste de concorrência extrema
WORLD_SEED=1337 \
WORLD_CONCURRENCY=100 \
WORLD_RESTAURANTS=10 \
npm run test:massive


# ==============================================================================
# 16. SE TUDO FALHAR (Reset Completo)
# ==============================================================================

# Parar tudo
docker-compose down -v

# Limpar node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# Subir DB
docker-compose up -d

# Aguardar 5 segundos
sleep 5

# Testar
./scripts/preflight.sh
