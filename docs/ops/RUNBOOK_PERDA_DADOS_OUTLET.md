# RUNBOOK — Suspeita de perda de dados num outlet/unidade

> Procedimento quando um dono/manager reporta que “faltam pedidos”,
> “histórico sumiu” ou “o outlet não mostra dados esperados”.

---

## 1. Confirmar escopo

- Identificar:
  - `restaurant_id`;
  - `outlet` afetado (sala, bar, rooftop, etc.);
  - intervalo de datas/turnos;
  - qual UI está a ser usada (TPV, KDS, relatórios, multi‑unidade).

---

## 2. Verificar se é filtro/visão

- Confirmar:
  - filtros aplicados na UI (datas, canais, estados de pedido);
  - se está a ver restaurante/outlet corretos (multi‑tenant).
- Comparar:
  - contagem de pedidos na UI vs `gm_orders` para o `restaurant_id` e
    intervalo.

---

## 3. Verificar Core

- No Core:
  - consultar `gm_orders`/`gm_order_items` para o `restaurant_id` + intervalo;
  - verificar se há pedidos sem relação com outlet esperado ou com estados
    inesperados (`draft`, `cancelled`).
- No `core_event_log` (quando ativo):
  - procurar eventos `ORDER_CREATED`, `ORDER_CANCELLED` para o período;
  - confirmar se houve erros de escrita (`Failed to fetch`, timeouts).

---

## 4. Determinar se houve perda real

Casos típicos:

- pedidos apenas em POS fiscal, não no ChefIApp;
- pedidos criados mas nunca pagos/fechados;
- problemas de rede que impediram sync completo.

Se os dados nunca chegaram ao Core:

- não há “perda” no sentido de delete; há **falta de registo**.

---

## 5. Ação

- Se for apenas questão de filtro/visão:
  - corrigir filtros e, se necessário, abrir issue para melhorar UX.
- Se houver bug real (dados que existiam e desapareceram):
  - abrir incidente crítico;
  - recolher dumps de tabelas afetadas;
  - acionar rollback/restauro de backup se necessário.

---

## 6. Documentar

- Adicionar notas no incidente:
  - tipo de falha (filtro, rede, bug, POS externo);
  - impacto (nº pedidos/unidades, impacto financeiro aproximado).
- Usar casos relevantes para alimentar:
  - melhorias em `ENTERPRISE_COMPLIANCE_ROADMAP.md`;
  - alertas preventivos (ex.: tasks técnicas quando ocorrem erros de escrita).

