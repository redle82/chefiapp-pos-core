# Avaliação de drivers — pós-fecho operacional da Fase 7

**Data:** 2026-03  
**Objetivo:** Avaliar se existe driver concreto suficiente para abrir nova fase do roadmap (ou F7.3); documentar decisão e critérios para reabrir.  
**Referência:** [FASE_7_READINESS_ESCALA_OPERACIONAL.md](./FASE_7_READINESS_ESCALA_OPERACIONAL.md) §10.

---

## 1. Estado actual

| Item | Estado |
|------|--------|
| **Fase 5** | Fechada (F5.1–F5.4). |
| **Fase 6** | F6.2 e F6.3 fechados; F6.1 (manutenção da disciplina) contínuo. |
| **Fase 7** | Operacionalmente fechada: F7.1 (readiness verificável) e F7.2 (observabilidade e runbooks) fechados; F7.3 em espera consciente. |
| **Baseline** | Checklist de production readiness (F7.1); mapa de observabilidade/runbooks (F7.2); gates no CI; pre-release; C44 e RUNBOOKS referenciados. |

---

## 2. Drivers concretos considerados

Foram considerados como drivers para abrir **nova fase** ou **F7.3** (escala e robustez):

- Aumento de volume (pedidos, tenants, dispositivos)
- Multi-tenant mais exigente (SLA, isolamento)
- Gargalo de performance (Core, frontend, sync)
- Aumento de incidentes ou tempo de resolução
- Necessidade explícita de robustez de Core/runtime (health, reconexão, billing)
- Nova prioridade explícita de produto (ex.: “escalar para N restaurantes até data X”)

**Fontes auditadas:** Documentos centrais do roadmap (INDEX, WORKSPACES_ALIGNMENT, FASE_6, FASE_7, C44, PRODUCTION_READINESS_CHECKLIST, OBSERVABILITY_AND_RUNBOOKS_MAP); referências a performance/escala/incidentes em docs/roadmap.

**Resultado:** **Nenhum driver concreto evidenciado no repositório.** Não foi encontrado:
- Métricas de produção ou issues que indiquem volume actual elevado, degradação de performance ou aumento de incidentes
- Decisão de produto ou compromisso explícito (ex.: “escala para 100 restaurantes em Q2”)
- Registo de gargalos ou SLA multi-tenant actuais

Os documentos que falam em “escala 500”, “multi-tenant robusto” ou “performance” são roadmap histórico/aspiracional (MULTI_TENANT_ROADMAP, IMPLEMENTATION_PROGRESS, etc.), não evidência de que esses drivers se materializaram no presente.

---

## 3. Decisão

**Decisão: A) Não abrir nova fase ainda.**

Manter apenas disciplina operacional: F6.1 (gates no CI, pre-release, correção de falhas em vez de desativar steps) e uso de F7.1 + F7.2 em toda release. F7.3 continua em espera consciente.

---

## 4. Justificação objectiva

- O próprio FASE_7 §10 define que F7.3 (e, por extensão, uma fase pós-7 focada em escala) só deve abrir com **driver concreto**.
- No repositório não existe evidência verificável de que algum desses drivers está presente (volume, performance, incidentes, SLA, prioridade explícita de escala).
- Abrir nova fase ou F7.3 sem essa evidência seria avanço por inércia, contra o critério “não abrir por impulso” e “preferir decisão conservadora se a evidência for fraca”.
- O estado actual (readiness verificável + observabilidade/runbooks consolidados) é estável e suficiente para operar e fazer releases com critérios claros.

---

## 5. Manutenção disciplinada

- **F6.1:** Manter `audit:fase3-conformance` e `audit:pre-release` verdes; corrigir falhas no CI; não desativar steps sem justificação documentada.
- **Em cada release:** Usar [PRODUCTION_READINESS_CHECKLIST.md](../ops/PRODUCTION_READINESS_CHECKLIST.md) e [OBSERVABILITY_AND_RUNBOOKS_MAP.md](../ops/OBSERVABILITY_AND_RUNBOOKS_MAP.md); seguir C44 para gates e rollback.
- **Revisão periódica:** Quando houver métricas de produção, incidentes ou prioridade de produto, reavaliar com base nos critérios abaixo.

---

## 6. Critérios concretos para reabrir o roadmap

Abrir **nova fase** ou **F7.3** quando existir **pelo menos um** dos seguintes, com evidência objectiva (métrica, issue, decisão de produto, runbook acionado):

1. **Volume:** Aumento significativo de pedidos, tenants ou dispositivos que exija testes de carga ou hardening (ex.: objectivo “N restaurantes” ou “M pedidos/dia” com data).
2. **Multi-tenant:** Exigência de SLA, isolamento ou limites de recursos por tenant documentados e aprovados.
3. **Performance:** Gargalo medido ou reportado (Core, frontend, sync) com impacto operacional ou em utilizadores.
4. **Incidentes:** Aumento sustentado de incidentes ou tempo de resolução que justifique robustez adicional (health, reconexão, circuit breakers).
5. **Robustez Core/runtime:** Necessidade explícita (ex.: billing, health checks, offline) documentada como prioridade.
6. **Prioridade de produto:** Decisão explícita (ex.: “Fase de escala” ou “F7.3 a executar em QX”) registada em roadmap ou backlog.

Quando um destes se materializar, reavaliar com este documento e com FASE_7 §10; se a evidência for suficiente, abrir F7.3 ou nova fase com escopo controlado e primeira frente definida.

---

*Avaliação pós-Fase 7. Última atualização: 2026-03.*
