# SLO e SLI — ChefIApp

**Propósito:** Definições de **SLO (Service Level Objective)** e **SLI (Service Level Indicator)** para o ChefIApp. Mesmo simples, formais e referenciáveis. Instrumentação completa = Onda 3.  
**Público:** DevOps, produto, engenharia.  
**Referência:** [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md) · [disaster-recovery.md](../ops/disaster-recovery.md) · [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md) · [ONDA_3_TAREFAS_90_DIAS.md](../ONDA_3_TAREFAS_90_DIAS.md)

**G2 Onda 3:** SLO concretos publicados com números e janelas; ver §2.1 e §3.

---

## 1. Definições

| Termo | Significado |
|-------|-------------|
| **SLI** | Service Level Indicator — métrica que mede um aspecto do serviço (ex.: disponibilidade, latência, taxa de erro). |
| **SLO** | Service Level Objective — alvo que definimos para um SLI (ex.: disponibilidade ≥ 99,9%). |
| **SLA** | Service Level Agreement — acordo com o cliente; pode ser igual ou mais relaxado que o SLO interno. |

---

## 2. SLOs globais (v1)

| SLO | Definição | Alvo (exemplo) | Notas |
|-----|-----------|----------------|-------|
| **Disponibilidade** | % de tempo em que o sistema responde (health check OK). | ≥ 99,5% (mensal) | Health check: portal e/ou API; instrumentação = Onda 3. |
| **Latência API** | Percentil 95 da latência de resposta (ms). | p95 ≤ 500 ms | Requisições ao Core/API; ver METRICS_DICTIONARY. |
| **Taxa de erro** | % de requisições que falham (5xx ou erro equivalente). | ≤ 1% | Por período (ex.: janela 5 min). |
| **RTO** | Recovery Time Objective — tempo máximo para restaurar serviço após incidente. | < 1 h | Ver disaster-recovery.md. |
| **RPO** | Recovery Point Objective — perda máxima de dados aceitável (tempo). | < 15 min | Backups; ver BACKUP_RESTORE.md. |

### 2.1 SLO concretos — números e janelas (G2 Onda 3)

| SLO | Número | Janela | Métrica exposta / como medir |
|-----|--------|--------|------------------------------|
| **Disponibilidade API** | ≥ 99,5% | Rolante 30 dias | Probes ao `/health` ou `/api/health`; (OK / total) no período. |
| **Disponibilidade API (curta)** | ≥ 99% | Rolante 5 min | Mesmo; alerta se cair abaixo em 5 min. |
| **Latência P95 (API)** | ≤ 500 ms | Rolante 5 min | APM, proxy ou logs; P95 da latência de resposta. |
| **Latência P99 (API)** | ≤ 2000 ms | Rolante 5 min | Mesmo; P99. |
| **Taxa de erro (5xx)** | ≤ 1% | Rolante 5 min | (Respostas 5xx / total de requisições) no período. |
| **RTO** | < 1 h | Por incidente | Tempo entre deteção e restauração; processo manual. |
| **RPO** | < 15 min | Por incidente | Intervalo do último backup; ver BACKUP_RESTORE. |

**Métricas expostas:** Health em [health-checks.md](../ops/health-checks.md); métricas operacionais por tenant em `get_operational_metrics` ([DASHBOARD_METRICS.md](../ops/DASHBOARD_METRICS.md)); eventos em [EVENT_PIPELINE.md](../ops/EVENT_PIPELINE.md). Latência e taxa de erro requerem APM, Sentry ou proxy (configurar conforme stack).

---

## 3. SLIs associados (como medir)

| SLI | Como medir | Janela (exemplo) | Fonte |
|-----|------------|------------------|-------|
| **Disponibilidade** | (Nº de health checks OK / Nº total de health checks) no período | 30 dias (SLO); 5 min (alerta) | Endpoint `/health` ou `/api/health`; probe externo ([health-checks.md](../ops/health-checks.md)). |
| **Latência API** | Percentil 95 (e P99) da latência de resposta por requisição | 5 min rolante | Logs da API, APM (Sentry, Datadog) ou proxy. |
| **Taxa de erro** | (Requisições 5xx ou falha) / Total de requisições | 5 min rolante | Logs, Sentry, métricas do Supabase/Docker. |
| **RTO** | Tempo entre deteção do incidente e restauração do serviço | Por incidente | Processo manual; [disaster-recovery.md](../ops/disaster-recovery.md), [RUNBOOKS.md](../ops/RUNBOOKS.md). |
| **RPO** | Intervalo do último backup válido antes do incidente | Por incidente | [BACKUP_RESTORE.md](../ops/BACKUP_RESTORE.md). |

---

## 4. Objetivos por camada (opcional v1)

| Camada | SLO exemplo | SLI |
|--------|-------------|-----|
| **Portal (frontend)** | Disponibilidade ≥ 99,5% | Health check ou uptime do host (Vercel). |
| **Core / API** | p95 ≤ 500 ms, erro ≤ 1% | Latência e status code das requisições. |
| **Base de dados** | Disponibilidade alinhada ao Supabase/Docker | Status do serviço DB. |
| **Auth** | Disponibilidade alinhada ao Supabase Auth | Login/signup disponíveis. |

---

## 5. Alertas e orçamento de erro

- **Alertas:** Quando um SLI se aproxima ou viola o SLO (ex.: disponibilidade < 99,5% em janela 5 min). Ver [alerts.md](../ops/alerts.md).
- **Error budget:** (1 − SLO) = orçamento de erro aceitável (ex.: 0,5% downtime mensal). Pode ser usado para priorizar fiabilidade vs novas features.

---

## 6. Referências

- [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md) — Métricas formais e exemplos de SLI/SLO por métrica.
- [DASHBOARD_METRICS.md](../ops/DASHBOARD_METRICS.md) — get_operational_metrics e painéis sugeridos.
- [EVENT_PIPELINE.md](../ops/EVENT_PIPELINE.md) — Pipeline de eventos (G1); consumo para dashboards.
- [disaster-recovery.md](../ops/disaster-recovery.md) — RTO, RPO, cenários de DR.
- [health-checks.md](../ops/health-checks.md) — Endpoints e critérios de health.
- [alerts.md](../ops/alerts.md) — Configuração de alertas.
- [ANOMALY_DEFINITION.md](./ANOMALY_DEFINITION.md) — Limiares para alertas (G3).

---

*Documento vivo. Ajustes a SLO/SLI (ex.: 99,9%) ou novos SLIs devem ser reflectidos aqui e no METRICS_DICTIONARY.*
