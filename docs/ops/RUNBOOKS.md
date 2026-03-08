# Runbooks — Índice

**Propósito:** Índice canónico de **runbooks** e procedimentos operacionais: alertas, health-checks, incidentes, rollback, go-live, backup/restore.
**Público:** DevOps, SRE, engenharia.
**Referência:** [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md) · [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)

---

## 1. Visão geral

Este documento não substitui os runbooks detalhados; agrupa-os por categoria e fornece links. Use-o como ponto de entrada para operação e resposta a incidentes.

---

## 2. Alertas

| Documento                    | Conteúdo                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **[alerts.md](./alerts.md)** | Sistema de alertas: erros críticos, performance degradada, disponibilidade; condição e acção; Sentry/Slack/PagerDuty (exemplos). |

**Uso:** Configurar e interpretar alertas; saber quando abrir incidente.

---

## 3. Health checks

| Documento                                  | Conteúdo                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **[health-checks.md](./health-checks.md)** | Endpoints de health (backend/frontend), formato de resposta (200/503), checks (database, auth); monitorização externa. |

**Uso:** Validar que o sistema está saudável; integração com uptime/APM.

---

## 4. Incidentes

| Documento                                                                      | Conteúdo                                                                                        |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **[INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)**                             | Processo geral de resposta a incidentes: deteção, triagem, mitigação, comunicação, post-mortem. |
| **[INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](./INCIDENT_PLAYBOOK_STOLEN_DEVICE.md)** | Playbook específico: dispositivo roubado/perdido (revogação, notificação).                      |

**Uso:** Seguir em caso de incidente; escalar e comunicar conforme processo.

---

## 5. Deploy e rollback

| Documento                                            | Conteúdo                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)**                 | Deploy canónico: local, Vercel, migrações, provisioning; variáveis de ambiente; go-live resumido. |
| **[rollback-procedure.md](./rollback-procedure.md)** | Procedimento de rollback (deploy e/ou migração).                                                  |
| **[rollback-checklist.md](./rollback-checklist.md)** | Checklist de rollback.                                                                            |

**Uso:** Fazer deploy seguro; reverter em caso de falha de release.

---

## 6. Go-live e provisioning

| Documento                                          | Conteúdo                                                        |
| -------------------------------------------------- | --------------------------------------------------------------- |
| **[GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)** | Checklist completo de go-live (infra, env, fiscal, dados, PWA). |
| **[provisioning.md](./provisioning.md)**           | Provisioning manual de restaurantes (script e validação).       |

**Uso:** Preparar e validar go-live; criar novos restaurantes.

---

## 6.1. Billing e webhooks

| Documento                                                                 | Conteúdo                                                                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **[BILLING_VALIDATION_RUNBOOK.md](./BILLING_VALIDATION_RUNBOOK.md)**                   | Roteiro operacional ultra-detalhado: pré-requisitos, fluxos manuais (3 moedas), freeze checklist, simulação de falha (currency/price/stale/no_tenant). |
| **[E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md](./E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md)** | E2E checkout nas 3 moedas (EUR/USD/BRL), webhook + estado, cross-currency guard.                  |
| **[BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md](./BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md)** | Cancelar assinatura e re-subscribe; verificação no DB.                                            |
| **[BILLING_FLOWS_MANUAL_CHECKLIST.md](./BILLING_FLOWS_MANUAL_CHECKLIST.md)**             | Fluxos reais: criar restaurantes BR/US/EU, upgrade, downgrade, falha, trial → pago.                |
| **[BILLING_WEBHOOK_EDGE_CASES.md](./BILLING_WEBHOOK_EDGE_CASES.md)**                     | Edge cases: idempotência, evento fora de ordem, assinatura inválida.                             |
| **[BILLING_FREEZE_PHASE_CHECKLIST.md](./BILLING_FREEZE_PHASE_CHECKLIST.md)**             | Checklist final para fechar a fase "Internacionalização & Billing Freeze".                        |

**Uso:** Validar checkout e webhooks; testar fluxos de billing; em incidentes de billing, consultar `billing_incidents` (quando a migração 20260327 estiver aplicada) e os runbooks acima.

---

## 7. Backup, restauro e disaster recovery

| Documento                                          | Conteúdo                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **[BACKUP_RESTORE.md](./BACKUP_RESTORE.md)**       | Backup e restauro: comandos, frequência, restauro completo/schema/dados; checklist.       |
| **[disaster-recovery.md](./disaster-recovery.md)** | Estratégia DR: RTO/RPO, cenários (corrupção, perda de infra, migration quebrada), testes. |

**Uso:** Executar backup manual; restaurar após falha; planejar DR.

---

## 8. Observabilidade e monitorização

| Documento                                              | Conteúdo                                                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **[OBSERVABILITY_SETUP.md](./OBSERVABILITY_SETUP.md)** | Configuração de observabilidade (Sentry, logs, métricas).                                                  |
| **[EVENT_PIPELINE.md](./EVENT_PIPELINE.md)**           | Pipeline de eventos (gm_audit_logs via Realtime + get_audit_logs); consumo por Grafana/Sentry (G1 Onda 3). |
| **[DASHBOARD_METRICS.md](./DASHBOARD_METRICS.md)**     | Métricas operacionais (get_operational_metrics) e painéis sugeridos.                                       |
| **[monitoring.md](./monitoring.md)**                   | Monitorização geral (se existir).                                                                          |
| **[dashboards.md](./dashboards.md)**                   | Dashboards (se existir).                                                                                   |
| **[apm-setup.md](./apm-setup.md)**                     | APM (se existir).                                                                                          |

**Uso:** Configurar e consultar logs, erros e métricas; consumir eventos de auditoria.

---

## 9. Retenção, purge e DSR

| Documento                                                      | Conteúdo                                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **[AUDIT_LOG_PURGE_RUNBOOK.md](./AUDIT_LOG_PURGE_RUNBOOK.md)** | Purge autorizado de gm_audit_logs (retenção; RPC purge_audit_logs_older_than; F3 Onda 3). |
| **[DSR_RUNBOOK.md](./DSR_RUNBOOK.md)**                         | Pedidos de titular (acesso, portabilidade, retificação, apagamento).                      |
| **[WORK_LOG_EXPORT_RUNBOOK.md](./WORK_LOG_EXPORT_RUNBOOK.md)** | Export de work log (turnos, check-in/out) para DPO/auditoria.                             |

**Uso:** Executar purge de audit conforme política; tratar DSR; export de dados sensíveis.

---

## 10. Demo e piloto

| Documento                                                            | Conteúdo                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[DEMO_5_SIMULADORES_RUNBOOK.md](./DEMO_5_SIMULADORES_RUNBOOK.md)** | Demo completa com 5 simuladores: ordem de execução, checklist (nova empresa via web, TPV/KDS central, 5 dispositivos, pedidos mini TPV → KDS, relatório dono). Guia detalhado: [DEMO_5_SIMULADORES_GUIA.md](./DEMO_5_SIMULADORES_GUIA.md). |

**Uso:** Executar a demo com 5 dispositivos (3 iOS + 2 Android); instalar app no Medium_Phone; criar empresa, ativar TPV/KDS, simular empregados, validar pedidos e relatório do dono.

---

## 11. Outros

| Documento                                                                              | Conteúdo                                                                                                                        |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **[WORKFLOW_OPERATIONAL_ORDER.md](./WORKFLOW_OPERATIONAL_ORDER.md)**                   | Ordem operacional de fluxo (uma frente por vez, fechamento obrigatorio, politica de worktree/workspace e ritual semanal).       |
| **[FOUNDATION_SPRINT_7_DAYS_2026-03-08.md](./FOUNDATION_SPRINT_7_DAYS_2026-03-08.md)** | Ordem operacional de 7 dias para isolamento multi-tenant, persistencia duravel, observabilidade e destravamento de fundamentos. |
| **[bug-reproduction.md](./bug-reproduction.md)**                                       | Reprodução de bugs (passos, ambiente).                                                                                          |
| **[GROWTH_MARKETING_SETUP.md](./GROWTH_MARKETING_SETUP.md)**                           | SEO, analytics, pixel (customer acquisition).                                                                                   |

---

## 12. Validação de docs e lineage

Scripts na raiz do repositório para validar documentação e lineage (DATA_LINEAGE §3). Executar a partir da raiz: `./scripts/<script>`.

| Script                            | Propósito                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **lineage-check.sh**              | Lista ficheiros em `supabase/migrations` que escrevem em tabelas críticas (gm_orders, gm_payments, gm_audit_logs, turn_sessions, gm_cash_registers). Comparar com [DATA_LINEAGE.md](../architecture/DATA_LINEAGE.md) §3. |
| **audit-md-references.sh**        | Lista referências a ficheiros `.md` em docs/ cujo ficheiro não existe em nenhuma subpasta de docs/. Regra: não referenciar ficheiros que não existem.                                                                    |
| **audit-contracts-referenced.sh** | Verifica documentos canónicos (CORE*\*, BOOTSTRAP*\*, etc.) e ficheiros .md vazios em docs/ e raiz; CORE_CONTRACT_INDEX vs disco.                                                                                        |

**Uso:** Após alterações em migrações ou em docs, correr lineage-check e audit-contracts-referenced; opcionalmente audit-md-references. Ver [PROMPT_BEFORE_PASTE_CHECKLIST.md](../PROMPT_BEFORE_PASTE_CHECKLIST.md) se existir.

---

## 13. Fluxo rápido (referência)

1. **Alerta dispara** → Ver [alerts.md](./alerts.md); abrir incidente conforme [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md).
2. **Health check falha** → Ver [health-checks.md](./health-checks.md); triar e mitigar.
3. **Deploy quebrou** → [rollback-procedure.md](./rollback-procedure.md) + [rollback-checklist.md](./rollback-checklist.md).
4. **Perda de dados / DR** → [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) + [disaster-recovery.md](./disaster-recovery.md).
5. **Go-live** → [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) + [DEPLOYMENT.md](./DEPLOYMENT.md).
6. **Validar docs/lineage** → §11 (lineage-check.sh, audit-md-references.sh, audit-contracts-referenced.sh).

---

_Documento vivo. Novos runbooks em docs/ops devem ser indexados aqui._
