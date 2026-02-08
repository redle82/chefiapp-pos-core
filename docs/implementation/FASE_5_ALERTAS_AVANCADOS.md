# FASE 5 — Alertas avançados: catálogo e pontos de extensão

Documento do Passo 3 da [FASE_5_CONSOLIDACAO_CHECKLIST.md](FASE_5_CONSOLIDACAO_CHECKLIST.md). Referência: `docs/ROADMAP_POS_FUNDACAO.md`.

**Objetivo:** Dono/Gerente vê alertas avançados (lista + Ecrã Zero) e pode actuar a partir deles.

---

## Catálogo de tipos de alerta

| alertType               | Severidade | Categoria   | Descrição                                                         |
| ----------------------- | ---------- | ----------- | ----------------------------------------------------------------- |
| order_delayed           | high       | operational | Pedido ativo há mais de X minutos (limiar: order_delayed_minutes) |
| order_sla_breach        | critical   | operational | SLA de pedido violado (ex.: tempo máximo de espera excedido)      |
| stock_low               | medium     | operational | Produto/ingrediente com estoque ≤ min_qty (FASE 2)                |
| stock_rupture_predicted | high       | operational | Ruptura prevista (projeção de consumo vs. stock)                  |
| margin_deviation        | medium     | financial   | Desvio de margem (custo vs. preço fora do esperado)               |
| fiscal_delayed          | high       | compliance  | Fiscal em atraso (fecho fiscal pendente)                          |
| employee_absent         | critical   | human       | Funcionário não compareceu ao turno                               |
| kitchen_overloaded      | high       | operational | Cozinha sobrecarregada; tempo de preparo aumentou                 |
| dining_overloaded       | medium     | operational | Salão sobrecarregado; mesas aguardando                            |
| table_unattended        | medium     | operational | Mesa aguardando atendimento há X min (EventMonitor)               |

**Onde está definido:** `merchant-portal/src/core/alerts/AlertEngine.ts` — método `createFromEvent(restaurantId, eventType, eventData)`. Novos tipos acrescentam-se ao mapa interno `alertMap`.

**Limiares:** `merchant-portal/src/core/alerts/alertThresholds.ts` (order_delayed_minutes, table_unattended_minutes). Contrato: `docs/ops/ALERT_THRESHOLDS_CONTRACT.md` (se existir).

---

## Pontos de extensão no código

1. **Criar alerta a partir de evento**

   - `alertEngine.createFromEvent(restaurantId, eventType, eventData)` — adicionar novo `eventType` ao mapa em `AlertEngine.createFromEvent`.
   - Quem emite eventos: `EventMonitor` / `EventTaskGenerator` (se existirem), ou chamadas diretas a `alertEngine.create()` / `createFromEvent()` quando regras forem avaliadas (ex.: job de SLA, job de ruptura prevista).

2. **Ecrã Zero**

   - `useEcraZeroState(restaurantId)` usa `alertEngine.getCritical()` e `alertEngine.getActive()`; depois verifica estoque baixo via `readStockLevels`. Qualquer alerta criado pelo engine já aparece no Ecrã Zero (vermelho = crítico; amarelo = ativo ou estoque baixo).

3. **Dashboard de alertas**

   - `AlertsDashboardPage` lista alertas ativos/críticos e permite filtrar por status (todos / críticos) e, se implementado, por categoria/severidade via `alertEngine.list(restaurantId, { status, severity, category })`.

4. **Histórico**

   - Hoje: in-memory em `AlertEngine` (`alertsHistoryStore`). Futuro: persistir em `gm_audit_logs` ou tabela `gm_alerts` + `gm_alert_history` quando Supabase ON / FASE 5 Passo 2.

5. **Notificações (opcional)**
   - Para críticos: email/push podem ser acionados ao criar alerta com `severity: 'critical'` (Edge Function ou job que consulte alertas não reconhecidos).

---

## Persistência e histórico

- **Estado atual:** Store in-memory por sessão (`alertsStore`, `alertsHistoryStore`). Adequado para demo/UX; alertas não sobrevivem a refresh quando não há backend persistente.
- **Futuro (FASE 5 Passo 2 / Supabase ON):** Inserir em tabela `gm_alerts` (ou equivalente) e histórico em `gm_alert_history` ou `gm_audit_logs` com `entity_type = 'alert'`. AlertEngine pode ganhar um adapter (mock vs. Supabase) como outros módulos.

---

## UI: listagem e filtros

- **Já existente:** AlertsDashboardPage com filtro "Todos" / "Críticos"; AlertCard com reconhecer/resolver.
- **Extensão:** Filtro por categoria (operational, financial, compliance, human, system) e/ou por severidade (low, medium, high, critical) usando `alertEngine.list(restaurantId, { status, severity, category })`.

---

## Triggers reais (implementados)

| alertType             | Trigger                                                                                                                    | Onde                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **order_delayed**     | EventMonitor detecta pedido ativo há mais de `order_delayed_minutes` (readActiveOrders)                                    | EventMonitor.checkEvents → alertEngine.createFromEvent         |
| **order_sla_breach**  | Mesmo evento quando `delayMinutes >= order_sla_breach_minutes` (default 30)                                                | EventMonitor.checkEvents                                       |
| **table_unattended**  | EventMonitor detecta mesa ocupada sem atendimento há mais de `table_unattended_minutes`                                    | EventMonitor.checkEvents → createFromEvent('table_unattended') |
| **stock_low**         | useEcraZeroState detecta estoque baixo (readStockLevels, qty <= min_qty); idempotente (só cria se não há active stock_low) | useEcraZeroState                                               |
| **dining_overloaded** | EventMonitor: quando 2+ mesas table_unattended no mesmo check                                                              | EventMonitor.checkEvents                                       |

**Limiares:** `alertThresholds.ts` — `order_delayed_minutes` (15), `order_sla_breach_minutes` (30), `table_unattended_minutes` (10).

**Ainda sem trigger ligado a dados reais:** stock_rupture_predicted, margin_deviation, fiscal_delayed, employee_absent, kitchen_overloaded (catálogo e UI existem; ligar quando houver fonte de dados).

---

## Ordem recomendada

1. Manter catálogo neste doc e em `AlertEngine.createFromEvent` em sync.
2. Implementar regras/jobs que chamem `createFromEvent` para os tipos avançados (order_sla_breach, stock_rupture_predicted, margin_deviation, fiscal_delayed) quando os dados e a lógica estiverem disponíveis. **Parcialmente feito:** order_delayed, order_sla_breach, table_unattended, stock_low.
3. Persistência e notificações quando FASE 5 Passo 2 (dados reais) e decisão de negócio (pós-€79) forem assumidos.
