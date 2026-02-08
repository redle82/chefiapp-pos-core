# Definição de Anomalia (para alertas) — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T30-6 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Definir o que conta como anomalia para acionar alertas operacionais e de segurança. Base para [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md), [SLO_SLI.md](./SLO_SLI.md) e instrumentação (Onda 3).

---

## 1. Âmbito

Este documento define:

- **Anomalia:** Condição ou padrão que, quando detetado, deve gerar alerta (notificação a ops ou ao cliente).
- **Categorias:** Conectividade, segurança, operação, disponibilidade.
- **Critério:** Limiar, contagem ou padrão (ex.: N falhas em M minutos); severidade (info, warning, critical).
- **Ação sugerida:** O que fazer quando o alerta dispara (runbook, playbook).

**Implementação:** Alertas podem ser configurados em monitorização (ex.: Sentry, Prometheus, Supabase); instrumentação alinhada a este doc = Onda 3.

---

## 2. Princípios

- **Ruído:** Evitar alertas que disparem com frequência sem ação útil; preferir limiares e janelas que indiquem risco real.
- **Severidade:** Critical = ação imediata (ex.: indisponibilidade, vazamento); Warning = investigar em horas; Info = registar ou dashboard.
- **Tenant:** Alertas podem ser por tenant (ex.: terminal offline do restaurante X) ou globais (ex.: API em baixo).

---

## 3. Anomalias por categoria

### 3.1 Conectividade e disponibilidade

| Anomalia | Descrição | Critério (exemplo) | Severidade | Ação sugerida |
|----------|-----------|---------------------|------------|----------------|
| Terminal offline | Heartbeat em falta para um terminal (TPV, KDS) | heartbeat_missed para o terminal em janela configurável (ex.: > 90 s sem ping) | Warning | Verificar rede e estado do terminal; [HEARTBEAT_MINIMAL_CONTRACT.md](./HEARTBEAT_MINIMAL_CONTRACT.md) |
| Múltiplos terminais offline | Vários terminais do mesmo tenant offline | > N terminais sem heartbeat no mesmo tenant em janela curta | Warning ou Critical | Verificar rede/local do restaurante; contactar cliente se persistir |
| API indisponível | Respostas 5xx ou timeout acima do limiar | api_error_rate > 0.01 ou disponibilidade < 99% em janela (ex.: 5 min) | Critical | [RUNBOOKS.md](../ops/RUNBOOKS.md); escalar engenharia |
| Latência elevada | Latência P95 ou P99 acima do SLO | api_request_latency_p95 > 500 ms (ex.) em janela | Warning | Verificar carga, dependências; [SLO_SLI.md](./SLO_SLI.md) |

### 3.2 Segurança

| Anomalia | Descrição | Critério (exemplo) | Severidade | Ação sugerida |
|----------|-----------|---------------------|------------|----------------|
| Muitas falhas de login | Possível ataque de força bruta ou credenciais comprometidas | login_failure_count > N (ex.: 10) para o mesmo identifier ou tenant em janela curta (ex.: 5 min) | Warning | Revisar [INCIDENT_RESPONSE.md](../ops/INCIDENT_RESPONSE.md); considerar bloqueio temporário ou alerta ao cliente |
| Sessão revogada / membro desativado | Kill switch ou revogação de sessão | Evento session_revoked ou user_disabled | Info (registar) ou Warning se em massa | Auditoria; [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](../ops/INCIDENT_PLAYBOOK_STOLEN_DEVICE.md) se dispositivo roubado |
| Export solicitado | Pedido de export (work log, DSR) | export_requested | Info (registar para auditoria) | Verificar [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md); sem ação automática salvo política específica |
| Acesso admin | Acesso excecional de suporte | admin_access | Info (registar para auditoria) | Revisão periódica; sem alerta automático salvo política |

### 3.3 Operação (opcional)

| Anomalia | Descrição | Critério (exemplo) | Severidade | Ação sugerida |
|----------|-----------|---------------------|------------|----------------|
| Pico de cancelamentos | Muitos pedidos cancelados em pouco tempo | orders_cancelled_total em janela curta > limiar (ex.: 2x média histórica) | Info ou Warning | Verificar operação ou possível abuso; contacto com cliente se padrão estranho |
| Queda abrupta de pedidos | Queda significativa de pedidos criados (ex.: comparação com mesmo período anterior) | orders_created_per_hour < X% do esperado (ex.: 50%) em janela | Info | Verificar disponibilidade ou problema no ponto de venda |
| Erros em massa (ex.: Sentry) | Muitos erros da mesma classe (ex.: timeout, 500) | Contagem de erros por tipo em janela > limiar | Warning ou Critical | [RUNBOOKS.md](../ops/RUNBOOKS.md); investigar causa raiz |

---

## 4. Severidade e canal

| Severidade | Canal (exemplo) | Responsável |
|------------|-----------------|-------------|
| Critical | Pager / SMS / canal de incidentes | Ops / engenharia; resposta imediata |
| Warning | Email / Slack / dashboard | Ops; investigar em horas |
| Info | Dashboard / log; sem notificação push | Registo para auditoria ou tendências |

*Nota:* Canais e responsáveis devem ser definidos em runbooks e configuração de monitorização; este doc não substitui a configuração.

---

## 5. Implementação (Onda 3)

- **Estado atual:** Definições aprovadas; regras concretas publicadas em [alerts.md](../ops/alerts.md) §G3 (G3 Onda 3).
- **G3 Onda 3:** Regras de alerta para login_failure_count, heartbeat_missed, API indisponível, latência P95, taxa de erro 5xx, user_disabled/session_revoked; configurar em Sentry/Grafana conforme [alerts.md](../ops/alerts.md).

---

**Referências:** [alerts.md](../ops/alerts.md) (regras G3) · [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md) · [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) · [SLO_SLI.md](./SLO_SLI.md) · [INCIDENT_RESPONSE.md](../ops/INCIDENT_RESPONSE.md) · [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
