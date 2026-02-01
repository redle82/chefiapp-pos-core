# PRD — Alertas e Notificações

**Propósito:** PRD de **alertas e notificações**: requisitos de produto para deteção, exibição e ação em alertas (erros críticos, performance, disponibilidade, operacionais). Estrutura a partir de [alerts.md](../ops/alerts.md), [CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md](../architecture/CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md) e [CORE_SILENCE_AND_NOISE_POLICY.md](../architecture/CORE_SILENCE_AND_NOISE_POLICY.md).  
**Público:** Produto, engenharia.  
**Referência:** [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md)

---

## 1. Visão e objetivo

- **Objetivo:** Sistema de alertas que permita detetar incidentes críticos rapidamente (< 5 min quando aplicável), notificar quem deve agir (staff/gerente/dono) e evitar ruído (não alertar em situações aceitáveis).
- **Regra:** Quando alertar e quando não alertar é governado por política (Core/contrato); UI não inventa "sempre notificar" nem esconde acima do limiar.

---

## 2. Requisitos funcionais

### 2.1 Tipos de alerta (produto)

| Tipo | Descrição | Exemplo | Quem atua |
|------|-----------|---------|-----------|
| **Erros críticos** | Taxa de erro alta (ex.: > 10 erros/min); falha de persistência ou auth em operação sensível. | Sentry: High Error Rate | Dev/ops |
| **Performance degradada** | Latência acima do SLO (ex.: p95 > 1s, p99 > 2s). | Supabase Analytics / APM | Dev/ops |
| **Disponibilidade** | Health check falha; serviço indisponível. | Uptime / health probe | Ops |
| **Operacional** | Tarefa atrasada, caixa em risco, pedido em espera excessiva. | Dashboard / AppStaff / KDS | Gerente/dono/staff |
| **Segurança** | Muitas falhas de login; sessão revogada; dispositivo roubado. | [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](../ops/INCIDENT_PLAYBOOK_STOLEN_DEVICE.md) | Dono/ops |

### 2.2 Condições e ações

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **Condição configurável** | Limiares (ex.: N erros em M minutos) definidos por configuração ou contrato; não hardcoded arbitrário. | P0 |
| **Ação imediata** | Erro crítico → alerta imediato; notificar equipa (email, Slack, PagerDuty conforme setup). | P0 |
| **Criar incidente** | Alertas críticos podem criar incidente automático; ligação a RUNBOOKS e INCIDENT_RESPONSE. | P1 |
| **Não alertar (silêncio)** | Situações aceitáveis (ex.: retry em progresso, degradação conhecida) não disparam alerta; ver CORE_SILENCE_AND_NOISE_POLICY. | P0 |

### 2.3 Visibilidade por papel

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **Staff** | Alertas operacionais relevantes (tarefas atrasadas, pedidos em espera); não ver alertas de infraestrutura. | P1 |
| **Gerente** | Alertas operacionais e resumo de saúde do restaurante; pode ver lista de incidentes. | P1 |
| **Dono** | Visão completa: operacional + billing + disponibilidade; pode configurar notificações. | P1 |
| **Dev/ops** | Alertas técnicos (erros, performance, disponibilidade); runbooks e resposta a incidentes. | P0 |

---

## 3. Requisitos não funcionais

- **Deteção:** Alertas críticos detectados em < 5 min (objetivo; depende de instrumentação = Onda 3).
- **Ruído:** Política de silêncio explícita (CORE_SILENCE_AND_NOISE_POLICY); não alertar em situações aceitáveis.
- **Governança:** CORE_OPERATIONAL_GOVERNANCE define quem vê o quê e quando vira incidente.

---

## 4. Referências

- [alerts.md](../ops/alerts.md) — Configuração técnica de alertas (Sentry, Supabase, etc.).
- [CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md](../architecture/CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md) — Quem vê o quê; quando vira incidente.
- [CORE_SILENCE_AND_NOISE_POLICY.md](../architecture/CORE_SILENCE_AND_NOISE_POLICY.md) — Quando NÃO alertar vs quando alertar.
- [INCIDENT_RESPONSE.md](../ops/INCIDENT_RESPONSE.md) — Processo de resposta a incidentes.
- [RUNBOOKS.md](../ops/RUNBOOKS.md) — Índice de runbooks e alertas.

---

## 5. Critérios de aceite (resumo)

- [ ] Erros críticos (ex.: > 10 erros/min) disparam alerta e notificação configurada.
- [ ] Performance degradada (ex.: p95 > 1s) pode disparar alerta conforme configuração.
- [ ] Health check falha dispara alerta de disponibilidade.
- [ ] Alertas operacionais (tarefa atrasada, etc.) visíveis no dashboard/AppStaff conforme papel.
- [ ] Política de silêncio documentada e aplicada (não alertar em situações aceitáveis).

---

*Documento vivo. Novos tipos de alerta ou mudança de limiares devem ser alinhados aos contratos Core e ops/alerts.*
