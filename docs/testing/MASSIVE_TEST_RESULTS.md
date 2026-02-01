# Relatório de Teste Massivo - ChefIApp

**Data:** {{DATE}}  
**Ambiente:** Docker Core (Postgres + PostgREST)  
**Versão:** 1.0.0

---

## 📊 Configuração

- **Restaurantes:** {{RESTAURANT_COUNT}}
- **Staff Total:** {{TOTAL_STAFF}}
- **Mesas Total:** {{TOTAL_TABLES}}
- **Produtos Total:** {{TOTAL_PRODUCTS}}
- **Pedidos Criados:** {{TOTAL_ORDERS}}

---

## ✅ Resultados

### Seed (Dados de Teste)

- **Restaurantes Criados:** {{SEED_RESTAURANTS}}/{{RESTAURANT_COUNT}}
- **Staff Criado:** {{SEED_STAFF}}
- **Mesas Criadas:** {{SEED_TABLES}}
- **Produtos Criados:** {{SEED_PRODUCTS}}
- **Duração:** {{SEED_DURATION}}s
- **Erros:** {{SEED_ERRORS}}

### Stress Test (Pedidos Simultâneos)

- **Pedidos com Sucesso:** {{STRESS_SUCCESS}}/{{STRESS_TOTAL}} ({{STRESS_SUCCESS_RATE}}%)
- **Pedidos Perdidos:** {{STRESS_LOST}} (esperado: 0)
- **Latência Média:** {{STRESS_AVG_LATENCY}}ms
- **Pico de Latência:** {{STRESS_MAX_LATENCY}}ms
- **P95 Latência:** {{STRESS_P95_LATENCY}}ms
- **Throughput:** {{STRESS_OPS_SEC}} pedidos/segundo
- **Duração:** {{STRESS_DURATION}}s

### Chaos Test (Resiliência)

- **Cenários Executados:** {{CHAOS_TOTAL}}
- **Cenários Passaram:** {{CHAOS_PASSED}}
- **Cenários Falharam:** {{CHAOS_FAILED}}
- **Duração:** {{CHAOS_DURATION}}s

#### Detalhes por Cenário

{{CHAOS_SCENARIOS_DETAILS}}

---

## 🔍 Gargalos Identificados

{{BOTTLENECKS}}

---

## ⚠️ Erros Encontrados

{{ERRORS_LIST}}

---

## 📈 Recomendações

{{RECOMMENDATIONS}}

---

## ✅ Critérios de Sucesso

- [ ] 5+ restaurantes operando simultaneamente: {{CRITERIA_RESTAURANTS}}
- [ ] 50+ pedidos criados sem perda: {{CRITERIA_ORDERS}}
- [ ] Latência média menor que 500ms: {{CRITERIA_LATENCY}}
- [ ] 0 erros de concorrência: {{CRITERIA_CONCURRENCY}}
- [ ] KDS recebendo todos os pedidos: {{CRITERIA_KDS}}

**Status Geral:** {{OVERALL_STATUS}}

---

## 📄 Arquivos de Resultado

- Seed: `test-results/massive-seed-*.json`
- Stress: `test-results/massive-concurrent-*.json`
- Lifecycle: `test-results/order-lifecycle-*.json`
- Chaos: `test-results/chaos-test-*.json`

---

_Relatório gerado automaticamente por `scripts/generate-test-report.ts`_
