# Contrato: Simulação de 7 dias de restaurante (só Core)

**Propósito:** Definir o teste de resistência "7 dias de restaurante" executado exclusivamente contra o Core (Docker PostgREST), sem UI, sem TPV/KDS visuais. Valida pedidos, caixa/turnos, pagamentos e tarefas em ciclo contínuo.

**Referências:** [FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md](../plans/FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md), [FLUXO_DE_PEDIDO_OPERACIONAL.md](FLUXO_DE_PEDIDO_OPERACIONAL.md), [CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](CASH_REGISTER_AND_PAYMENTS_CONTRACT.md), [TASKS_CONTRACT_v1.md](TASKS_CONTRACT_v1.md).

---

## 1. Âmbito

- **Pedidos:** create_order_atomic, estados OPEN → IN_PREP → READY → CLOSED, pagamento via process_order_payment (cash/card).
- **Caixa / turno:** abertura por dia (open_cash_register_atomic), fecho (PATCH gm_cash_registers).
- **Tarefas:** criação e transição em gm_tasks (ex.: MODO_INTERNO, OPEN → ACKNOWLEDGED → RESOLVED).
- **Sem UI:** nenhum TPV visual, KDS visual ou browser; apenas Core como motor soberano.

---

## 2. Estrutura da simulação (por dia D1..D7)

Para cada dia:

1. **Abrir turno:** `open_cash_register_atomic(p_restaurant_id, p_name, p_opened_by, p_opening_balance_cents)`. Ex.: p_opened_by = "Simulação Core D{n}". Tratar CASH_REGISTER_ALREADY_OPEN (usar caixa já aberta ou falhar conforme política). Guardar `cash_register_id`.
2. **Pedidos:** Obter produto válido (gm_products). Para cada um de N pedidos (ex.: 30–80/dia):
   - `create_order_atomic(p_restaurant_id, p_items, p_payment_method)` (cash/card alternado ou aleatório).
   - Associar pedido à caixa (atualizar gm_orders.cash_register_id se o Core não o fizer na criação).
   - `update_order_status` IN_PREP → READY.
   - `process_order_payment(p_order_id, p_restaurant_id, p_cash_register_id, p_method, p_amount_cents, ...)` com total do pedido; o Core marca PAID e pode transitar para CLOSED conforme implementação.
   - Se necessário, `update_order_status` CLOSED (ou deixar ao process_order_payment).
3. **Tarefas:** Inserir 2–4 tarefas em gm_tasks (restaurant_id, task_type MODO_INTERNO, message, status OPEN). PATCH para ACKNOWLEDGED e depois RESOLVED (ou DISMISSED conforme schema).
4. **Fechar caixa:** Calcular total esperado (soma de gm_payments para a caixa ou total_sales_cents do turno). PATCH `gm_cash_registers` com id e restaurant_id: status=closed, closing_balance_cents=X, closed_at=NOW(), closed_by="simulate-restaurant-week".
5. **Tempo:** Timestamps (created_at/closed_at) podem ser NOW() ou simulados por dia; o relógio do sistema não é alterado.

---

## 3. Inputs do script de simulação

| Parâmetro        | Descrição                          | Default |
|------------------|------------------------------------|---------|
| --days           | Número de dias (ex.: 7)            | 7       |
| --orders-per-day| Pedidos por dia                    | 50      |
| --restaurant-id | UUID do restaurante                | 00000000-0000-0000-0000-000000000100 |
| --core-url       | URL do Core (PostgREST)            | http://localhost:3001 |

---

## 4. Critério de sucesso

- **Estrutural:** Nenhum erro de DB/RPC durante a simulação (script exit 0).
- **Pedidos:** Total de pedidos = dias × orders_per_day; todos com status CLOSED (ou CANCELLED explícito); todos com payment_status PAID (ou PARTIALLY_PAID conforme contrato).
- **Caixa:** Um turno aberto e fechado por dia; cada turno fechado com closed_at, closing_balance_cents e closed_by preenchidos.
- **Tarefas:** Nenhuma tarefa "pendurada" em estado inválido; histórico consistente (restaurant_id, task_type presentes).
- **Auditabilidade:** Totais por dia e por método (cash/card) coerentes com gm_payments e get_shift_history.

---

## 5. Validação pós-simulação

Após executar o script de simulação ([scripts/simulate-restaurant-week.sh](../../scripts/simulate-restaurant-week.sh)), executar o relatório automático:

- **Script de validação:** [scripts/validate-week-simulation.sh](../../scripts/validate-week-simulation.sh)  
- **Queries SQL (referência):** [scripts/validate-week-simulation.sql](../../scripts/validate-week-simulation.sql)

O script de validação recebe CORE_URL e, opcionalmente, intervalo de datas (ou "últimos 7 dias"), corre as queries de verificação e termina com exit 0 só se todos os critérios passam; caso contrário exit 1 e output legível (OK/FALHA por critério).

---

## 6. Relatório pós-simulação (critérios automáticos)

O ficheiro [scripts/validate-week-simulation.sql](../../scripts/validate-week-simulation.sql) e o script [scripts/validate-week-simulation.sh](../../scripts/validate-week-simulation.sh) implementam:

- **Pedidos:** Total = soma esperada; nenhum pedido com status != CLOSED (exceto CANCELLED); nenhum com payment_status != PAID (ou PARTIALLY_PAID conforme contrato).
- **Caixa / turnos:** Número de turnos fechados no período = número de dias; cada turno com closed_at, closing_balance_cents, closed_by preenchidos; totais por método coerentes com gm_payments.
- **Tarefas:** Contagem de tarefas por estado; nenhuma "pendurada" (ex.: OPEN sem transição num limite definido); restaurant_id e task_type presentes.

**Kernel / EventMonitor:** Validação manual ou futura integração com EventMonitor; sem alertas críticos reais esperados.

---

## 7. Critério final ("funciona como Deus manda")

Quando o contrato estiver implementado, o script de 7 dias executar sem erro estrutural e o relatório de validação passar, pode-se afirmar:

> O Core operou um restaurante simulado por 7 dias consecutivos, com pedidos, tarefas, turnos e caixa, sem erro estrutural, com auditabilidade completa.

Isso implica: Core aprovado para base de produção, mobile e clientes.

---

## 8. Registo de aprovação

Quando o script completo (7 dias × N pedidos/dia) e a validação forem executados com sucesso:

**Teste de resistência de 7 dias executado com sucesso — Core aprovado para operação contínua.**

- **Data da execução:** 2026-02-03
- **Artefacto:** output dos scripts (simulate-restaurant-week.sh + validate-week-simulation.sh) guardado como log oficial do projeto.
