# Cenários de Carga — ChefIApp

**Propósito:** Documento canónico de **cenários de carga** (load / stress): simulações, volumes, critérios de sucesso e referências aos testes existentes.  
**Público:** QA, engenharia, DevOps.  
**Referência:** [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md) · [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) · [SLO_SLI.md](../architecture/SLO_SLI.md)

---

## 1. Objetivo

Definir cenários de carga formais para validar o sistema sob stress: concorrência de pedidos, múltiplos restaurantes, latência e integridade. Instrumentação e execução automatizada podem evoluir (Onda 2/3); este doc fixa os cenários e critérios.

---

## 2. Regras constitucionais (constraints)

Antes de definir cenários, as **regras de negócio** que os testes devem respeitar:

| Regra | Descrição | Constraint / Fonte |
|-------|-----------|---------------------|
| **Uma mesa = um pedido aberto** | Uma mesa pode ter apenas um pedido com status `OPEN` por vez. | `idx_one_open_order_per_table`; [SIMULATION_RULES.md](./SIMULATION_RULES.md) |
| **Integridade referencial** | restaurant_id, table_id, product_id válidos; sem órfãos. | Schema + RLS |
| **Atomicidade** | create_order_atomic e RPCs críticos são transacionais. | Core / PostgREST |

Scripts de carga devem respeitar estas regras (ex.: não criar dois pedidos OPEN na mesma mesa sem fechar o anterior).

---

## 3. Cenários de carga (especificação)

### 3.1 Cenário A — Validação (quick smoke)

| Parâmetro | Valor | Objetivo |
|-----------|--------|----------|
| **Restaurantes** | 10 | Validar harness e regras. |
| **Pedidos simultâneos** | 20–50 | Concorrência baixa. |
| **Concorrência** | 5–10 workers | |
| **Critério de sucesso** | Zero perda de dados; zero violação de constraint; latência média < 200 ms. | |

**Referência:** [MASSIVE_CONCURRENT_TEST_README.md](./MASSIVE_CONCURRENT_TEST_README.md), seeds 10 restaurantes.

### 3.2 Cenário B — Produção (100 restaurantes)

| Parâmetro | Valor | Objetivo |
|-----------|--------|----------|
| **Restaurantes** | 100 | Simular escala produção inicial. |
| **Pedidos** | 200–500 | Carga sustentada. |
| **Concorrência** | 10–20 workers | |
| **Critério de sucesso** | Zero órfãos; latência p95 ≤ 500 ms (alinhado a SLO); zero violação de constraint. | |

**Referência:** [STRESS_TEST_FINAL_REPORT.md](./STRESS_TEST_FINAL_REPORT.md) — escala Produção.

### 3.3 Cenário C — Escala (1.000+ restaurantes)

| Parâmetro | Valor | Objetivo |
|-----------|--------|----------|
| **Restaurantes** | 1.000–10.000 | Validar multi-tenant em escala. |
| **Pedidos** | 1.000–2.500 | |
| **Concorrência** | 20–50 workers | |
| **Critério de sucesso** | Zero perda de dados; latência média < 50 ms (ou conforme SLO); integridade preservada. | |

**Referência:** [STRESS_TEST_FINAL_REPORT.md](./STRESS_TEST_FINAL_REPORT.md) — Enterprise e Large-Scale.

### 3.4 Cenário D — Pico (burst)

| Parâmetro | Valor | Objetivo |
|-----------|--------|----------|
| **Restaurantes** | 50–100 | |
| **Pedidos** | 100–200 em janela curta (ex.: 30 s) | Simular pico de hora de almoço. |
| **Concorrência** | 30–50 workers | |
| **Critério de sucesso** | Sem timeouts; erros esperados (ex.: constraint violada) tratados; sem crash. | |

---

## 4. Métricas a recolher

| Métrica | Descrição | Alvo (exemplo) |
|---------|-----------|-----------------|
| **Latência média** | Tempo de resposta do RPC create_order_atomic (ou equivalente). | < 200 ms (validação); p95 ≤ 500 ms (produção). |
| **Taxa de sucesso** | % de pedidos criados com sucesso (sem erro inesperado). | 100% exceto conflitos esperados (mesa ocupada). |
| **Órfãos** | Pedidos ou itens sem restaurant_id/order_id válido. | 0. |
| **Violações de constraint** | Esperadas apenas quando o cenário as provoca (ex.: dois OPEN na mesma mesa); não esperadas em cenário correto. | 0 em cenário bem formado. |
| **Throughput** | Pedidos por segundo (ops/s). | Documentar por cenário. |

---

## 5. Ferramentas e scripts (referência)

| Recurso | Descrição |
|---------|-----------|
| **SIMULATION_RULES.md** | Regras constitucionais; constraints. |
| **MASSIVE_CONCURRENT_TEST_README.md** | Teste massivo simultâneo; quick start. |
| **run-massive-concurrent-test.sh** | Script: `--orders`, `--concurrency`. |
| **STRESS_TEST_FINAL_REPORT.md** | Resultados 10 a 10.000 restaurantes; chaos suite. |
| **simulators/** | simulate-orders.js, simulate-tasks.js (Docker test harness). |

---

## 6. Critérios de aprovação (resumo)

- [ ] Cenário A (validação) executado sem perda de dados e sem violação de constraint.
- [ ] Cenário B (produção) com latência p95 dentro do SLO (ex.: ≤ 500 ms).
- [ ] Cenário C (escala) com zero órfãos e integridade preservada.
- [ ] Cenário D (burst) sem crash; erros esperados tratados.
- [ ] Regras de SIMULATION_RULES respeitadas em todos os cenários.

---

## 7. Referências

- [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) — Estratégia geral de testes.
- [SLO_SLI.md](../architecture/SLO_SLI.md) — SLO de latência e disponibilidade.
- [SIMULATION_RULES.md](./SIMULATION_RULES.md) — Regras constitucionais.
- [STRESS_TEST_FINAL_REPORT.md](./STRESS_TEST_FINAL_REPORT.md) — Resultados históricos.
- [MASSIVE_CONCURRENT_TEST_README.md](./MASSIVE_CONCURRENT_TEST_README.md) — Guia do teste massivo.

---

*Documento vivo. Novos cenários ou alteração de volumes/alvos devem ser reflectidos aqui e nos SLOs.*
