# Módulos da Plataforma — Contrato

**Propósito:** Define os módulos do ChefIApp OS, boundaries, eventos e dependências. Ref: [PLATFORM_MODULAR_DECISION](../strategy/PLATFORM_MODULAR_DECISION.md).

---

## 1. Core (obrigatório)

Motor comum a todos os módulos. Não é módulo vendável — é a base.

| Componente | Descrição |
|------------|-----------|
| Autenticação | Supabase Auth |
| RBAC | gm_has_role, permissões por papel |
| Multi-tenant | restaurant_id em todas as tabelas |
| Engine transacional | RPCs atómicos, idempotência |
| Engine de eventos | EventMonitor, Operational Orchestrator |
| Error semantics | normalizeOrderError, códigos estáveis |

---

## 2. Módulo POS

**Vendável sozinho.** Inclui:

- Pedidos (gm_orders, gm_order_items)
- Mesas (gm_tables)
- KDS (leitura activa, markItemReady)
- Pagamentos (Stripe/SumUp/Pix)
- Fechamento de caixa (close_cash_register_atomic, gm_z_reports)
- Relatórios básicos (ShiftCloseReport, FinanceEngine)

**Eventos emitidos:** order_created, order_delayed, order_ready, order_closed, table_unattended.

**Dependências:** Core.

---

## 3. Módulo Workforce (Gestão de Equipe)

**Vendável sozinho.** Inclui:

- Tarefas (gm_tasks, EventTaskGenerator)
- Check-in (quando integrado)
- Ranking e gamificação (quando integrado)
- Auditoria de execução
- KPIs por funcionário

**Eventos consumidos:** order_created, order_delayed, table_unattended, restaurant_idle.

**Eventos emitidos:** task_created, task_acknowledged, task_resolved.

**Dependências:** Core. Opcionalmente POS (para tarefas baseadas em pedidos).

---

## 4. Módulo Intelligence

**Vendável como premium.** Inclui:

- Métricas cruzadas (vendas × performance humana)
- Heatmap de mesa
- Tempo médio por funcionário
- Conflitos operacionais
- Alertas automáticos

**Dependências:** Core, POS, Workforce.

---

## 5. Boundaries (regras de isolamento)

- **Não misturar:** lógica de POS dentro de Workforce (ou vice-versa) sem interface explícita.
- **Eventos como contrato:** comunicação entre módulos via eventos (order_created, restaurant_idle, etc.).
- **Feature flags:** módulos activáveis por tenant (installed_modules, module_permissions).

---

## 6. Rotas e superfícies

| Módulo | Rotas principais |
|--------|------------------|
| POS | /op/tpv, /op/kds, /app/staff/home (tiles operacionais) |
| Workforce | TaskPanel (dentro de KDS), /tasks (futuro) |
| Intelligence | Dashboard, relatórios avançados |

---

## 7. Estado actual

- Core: implementado.
- POS: implementado.
- Workforce: parcial (EventMonitor, Operational Orchestrator, TaskPanel).
- Intelligence: conceitual; métricas básicas no dashboard.
