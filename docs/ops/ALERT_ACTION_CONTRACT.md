# Contrato — Ação Imediata para Alertas Críticos

**Versão:** 1.0  
**Data:** 2026-02-01  
**Referências:** [PRD_ALERTS.md](../product/PRD_ALERTS.md) · [alerts.md](./alerts.md) · Onda 5 O5.10

---

## 1. Objetivo

Definir a **ação imediata** quando um alerta é **crítico**: notificação in-app e ligação a runbooks. Alerta crítico = prioridade máxima para o utilizador (dono/gerente).

---

## 2. Regras

| Ação | Descrição | Prioridade |
|------|-----------|------------|
| **Notificação in-app** | Quando existem alertas críticos ativos, o hub (dashboard) deve informar o utilizador (ex.: toast ou banner) com ligação para o painel de alertas. | P0 |
| **Ligação a runbooks** | No painel de alertas, cada alerta crítico deve ter um link "Ver runbook" que aponta para o runbook adequado ao tipo de alerta (índice: [RUNBOOKS.md](./RUNBOOKS.md)). | P1 |

---

## 3. Mapeamento alertType → runbook

Por defeito, todos os alertas críticos apontam para o índice de runbooks. Opcionalmente, por tipo:

| alertType | Runbook sugerido |
|-----------|------------------|
| `order_delayed`, `table_unattended`, `kitchen_overloaded`, `dining_overloaded` | [RUNBOOKS.md](./RUNBOOKS.md) § Alertas / operacional |
| `employee_absent` | [RUNBOOKS.md](./RUNBOOKS.md) § Incidentes |
| `stock_low` | Operacional / inventário (mesmo índice) |
| (outros) | [RUNBOOKS.md](./RUNBOOKS.md) |

A base URL dos docs (ex.: `VITE_DOCS_BASE_URL`) é configurável; em desenvolvimento pode ser o repositório GitHub.

---

## 4. Comportamento in-app (implementação)

- **Hub (DashboardPortal):** Se `alertEngine.getCritical(restaurantId)` devolver > 0, mostrar uma vez por visita um toast (ou banner) do tipo "erro"/"warning" com mensagem "Tens N alerta(s) crítico(s)." e ação "Ver alertas" → navegação para `/app/alerts`.
- **Painel Alertas (AlertsDashboardPage):** Cada card de alerta com `severity === 'critical'` inclui link "Ver runbook" com URL conforme §3.

---

## 5. Referências

- [ALERT_THRESHOLDS_CONTRACT.md](./ALERT_THRESHOLDS_CONTRACT.md) — Limiares
- [RUNBOOKS.md](./RUNBOOKS.md) — Índice de runbooks
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) — Resposta a incidentes
