# RUNBOOK — Reconciliação ChefIApp vs POS divergente

> O que fazer quando `gm_reconciliations.status = 'DIVERGENT'` ou quando o
> dono reporta que ChefIApp e POS fiscal não batem.

---

## 1. Confirmar contexto

- Identificar:
  - `restaurant_id`;
  - `shift_id` ou intervalo de tempo;
  - POS fiscal usado (`pos_system`);
  - quem reportou o problema (dono, financeiro, staff).

---

## 2. Verificar dados em ChefIApp

1. No portal:
   - Aceder à página de fecho diário / reconciliação.
   - Confirmar `total_operational_cents` e nº de pedidos.
2. No Core:
   - Confirmar que `gm_orders` e `gm_order_items` daquele turno estão:
     - com `status` final correto (`paid`/`cancelled`);
     - com `restaurant_id` esperado.
3. No log de eventos (`core_event_log`):
   - Filtrar por `ORDER_*` e `FISCAL_SYNC_*` com o mesmo `correlation_id` (se já
     estiver implementado).

---

## 3. Verificar dados no POS fiscal

- Obter do cliente:
  - relatório de turno / Z;
  - export (API, ficheiro ou foto) com o total fiscal.
- Confirmar:
  - se o intervalo de tempo corresponde ao turno em ChefIApp;
  - se existiram vendas diretamente no POS sem passar pelo ChefIApp.

---

## 4. Classificar a causa provável

Algumas causas típicas:

- Pedidos registados diretamente no POS (fora do OS);
- Cancelamentos/descontos lançados apenas num dos lados;
- Erros de configuração de impostos ou mapeamento de artigos.

Registar um `reason_code` adequado na linha de `gm_reconciliations`.

---

## 5. Decidir ação

- Se a diferença for pequena e explicada (arredondamento, gorjetas fora
  do fluxo, etc.):
  - documentar na `notes` da reconciliação;
  - marcar `status = 'OK'` quando aceitável.
- Se a diferença for grande ou recorrente:
  - abrir issue interna para revisão de integrações / mapeamentos;
  - recomendar revisão conjunta com o parceiro POS.

---

## 6. Lições aprendidas

- Depois de incidentes relevantes:
  - acrescentar exemplos concretos a `FISCAL_RECONCILIATION_CONTRACT.md`;
  - ajustar tooling para tornar essa classe de erro mais fácil de detetar
    (dashboards, alertas, validações).

