# Contrato — Limiares de Alerta Operacionais

**Versão:** 1.0  
**Data:** 2026-02-01  
**Status:** Ativo  
**Referências:** [PRD_ALERTS.md](../product/PRD_ALERTS.md) · [alerts.md](./alerts.md) · Onda 5 O5.9

---

## 1. Objetivo

Definir **onde** e **como** os limiares de alertas operacionais (ex.: atraso de pedido, mesa sem atendimento) são configurados. Nenhum valor arbitrário hardcoded; todos vêm de configuração ou contrato.

---

## 2. Escopo

- **Alertas operacionais** no merchant-portal: pedido atrasado, mesa sem atendimento, cozinha sobrecarregada, etc.
- **Não cobre** (ficam em [alerts.md](./alerts.md)): erros Sentry, health check UptimeRobot, SLO de latência.

---

## 3. Schema de limiares (contrato)

Cada regra de deteção tem um identificador e um ou mais parâmetros numéricos com unidade.

| Chave | Descrição | Unidade | Valor padrão | Quem usa |
|-------|-----------|---------|--------------|----------|
| `order_delayed_minutes` | Pedido em estado ativo há mais de X minutos → evento `order_delayed` | minutos | 15 | EventMonitor, EventTaskGenerator |
| `table_unattended_minutes` | Mesa ocupada sem “atendimento” há mais de X minutos → evento `table_unattended` | minutos | 10 | EventMonitor |
| `event_check_interval_ms` | Intervalo de polling para verificação de eventos | ms | 60000 | EventMonitor |

Valores padrão são definidos neste contrato e expostos pelo módulo `alertThresholds` no portal. Em produção, a fonte pode ser:

1. **Fase atual:** ficheiro de configuração / módulo TypeScript (defaults do contrato).
2. **Futuro:** RPC Core (ex.: `get_alert_thresholds(restaurant_id)`) ou tabela `tenant_settings` por restaurante.

---

## 4. Fonte de verdade (implementação)

- **Código:** `merchant-portal/src/core/alerts/alertThresholds.ts`
  - Exporta `DEFAULT_ALERT_THRESHOLDS` e `getAlertThresholds(restaurantId?: string)`.
  - Hoje devolve sempre os defaults; depois pode sobrescrever com resposta do Core ou env.
- **EventMonitor** e **EventTaskGenerator** importam `getAlertThresholds()` e usam as chaves acima em vez de constantes locais.

---

## 5. Regras

1. **Nunca hardcodar** valores de limiar em EventMonitor, AlertEngine ou geradores de tarefas; usar sempre `getAlertThresholds()` (ou equivalente contratado).
2. **Alterar valores padrão:** atualizar este doc e `alertThresholds.ts` em conjunto; opcionalmente migração Core se existir tabela de settings.
3. **Novos limiares:** adicionar linha na tabela do §3, valor padrão no código e, se aplicável, no Core.

---

## 6. Referências

- [PRD_ALERTS.md](../product/PRD_ALERTS.md) — Condição configurável (P0).
- [alerts.md](./alerts.md) — Alertas de infra (Sentry, UptimeRobot).
- [ONDA_5_TAREFAS.md](../pilots/ONDA_5_TAREFAS.md) — O5.9.
