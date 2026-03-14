# Relatório — Manutenção operacional (disciplina vigente)

**Data:** 2026-03  
**Objetivo:** Auditar e reforçar a disciplina operacional vigente sem abrir nova fase; corrigir pequenos gaps executáveis e preparar terreno para identificar futuros drivers.  
**Referências:** [AVALIACAO_DRIVERS_POS_FASE7.md](./AVALIACAO_DRIVERS_POS_FASE7.md), [FASE_7_READINESS_ESCALA_OPERACIONAL.md](./FASE_7_READINESS_ESCALA_OPERACIONAL.md) §10, [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md).

---

## 1. Estado operacional auditado

| Artefacto | Estado | Notas |
|-----------|--------|--------|
| **Gates de CI** | Coerente | `.github/workflows/ci.yml`: job `validate` inclui `audit:fase3-conformance`; typecheck, lint, testes, sovereignty, check-financial-supabase; opcionalmente `audit:billing-core` se secret definido. |
| **Pre-release** | Coerente | `npm run audit:pre-release` (script `scripts/pre-release-gate.sh`); health Core opcional, fase3 obrigatório, billing opcional. |
| **Checklist de readiness** | Coerente | [PRODUCTION_READINESS_CHECKLIST.md](../ops/PRODUCTION_READINESS_CHECKLIST.md) com itens obrigatórios (6), recomendados (4) e pós-deploy (3); referências a C44, pre-flight, rollout e mapa. |
| **Mapa observabilidade/runbooks** | Coerente | [OBSERVABILITY_AND_RUNBOOKS_MAP.md](../ops/OBSERVABILITY_AND_RUNBOOKS_MAP.md): sinais por superfície (§1), runbooks quando usar (§2), gaps (§3), incidente em produção (§4). Ligado a C44 e checklist. |
| **C44** | Coerente | Definição required before merge/deploy (§2); tabela de gates (§3); checklist rollout (§4) e rollback (§5); referências ao checklist F7.1, mapa F7.2, RUNBOOKS, rollout, incidente. |
| **Referências centrais** | Coerentes | INDEX, WORKSPACES_ALIGNMENT, AGENTS referenciam Fase 7 operacionalmente fechada, avaliação de drivers, checklist e mapa. Paths verificados: pre-flight-check.sh, health-check-core.sh, pre-release-gate.sh, BrowserBlockGuard.tsx existem. |

---

## 2. Gaps identificados e correcções

### 2.1 Pre-flight: verificação browser-block (secção 7)

**Problema:** O script falhava sempre na secção 7 porque procurava qualquer ocorrência de `import.meta.env.DEV` em `BrowserBlockGuard.tsx`. O componente usa `import.meta.env.DEV` apenas para telemetria (`isDev`), não para bypass (permitir acesso em DEV); portanto o check era demasiado amplo e bloqueava deploys válidos.

**Correção:** Ajuste em `scripts/deploy/pre-flight-check.sh`: falhar apenas quando existir uma **linha** que contenha **ambos** `import.meta.env.DEV` e um padrão de bypass (`return`, `<Outlet`, `Outlet />`). O uso legítimo (`isDev: import.meta.env.DEV`) não contém return/Outlet na mesma linha e passa.

**Ficheiro:** `scripts/deploy/pre-flight-check.sh` — secção 7.

### 2.2 Checklist: item 5 (browser-block)

**Problema:** O texto dizia que `grep -q "import.meta.env.DEV" ...` "não deve encontrar", o que contradiz o uso legítimo para telemetria e não refletia o comportamento correcto do pre-flight após a correção.

**Correção:** Redação do item 5 alinhada ao pre-flight: verificar que não existe **bypass** (uso de `import.meta.env.DEV` para permitir render em DEV); uso apenas para telemetria é aceite. Referência explícita à secção 7 do pre-flight.

**Ficheiro:** `docs/ops/PRODUCTION_READINESS_CHECKLIST.md` — tabela §1, item 5.

### 2.3 Continuidade de uso em release

**Reforço:** Adicionada uma linha em "Como usar" do checklist a lembrar a disciplina operacional (F6.1): usar checklist e mapa em **toda** release; manter gates no CI verdes; não desativar steps sem justificação documentada.

**Ficheiro:** `docs/ops/PRODUCTION_READINESS_CHECKLIST.md` — secção "Como usar".

---

## 3. Resumo das alterações

| Ficheiro | Alteração |
|----------|-----------|
| `scripts/deploy/pre-flight-check.sh` | Secção 7: falhar só em linhas com padrão de bypass (import.meta.env.DEV + return/Outlet), não em uso para telemetria. |
| `docs/ops/PRODUCTION_READINESS_CHECKLIST.md` | Item 5: texto alinhado ao pre-flight (bypass vs telemetria); nova linha de disciplina F6.1 em "Como usar". |

Nenhuma alteração a C44, mapa, RUNBOOKS ou AGENTS além do que já estava coerente; referências cruzadas validadas.

---

## 4. Execução sistemática (continuidade)

**F5.4 coerência documental:** INDEX, AGENTS, FASE_6 e FASE_4 ainda referiam "backlog F5.4" ou "F5.4 em backlog". F5.4 está fechado (F6.2). Corrigido para "F5.1–F5.4 fechados" / "F5.4 fechado (F6.2)" em todos.

**F7.1 P2 opcional:** Script de verificação do checklist já existia (pre-flight-check.sh). Adicionado comando único `npm run audit:readiness` no `package.json`; checklist e C44 atualizados para referenciar `audit:readiness`; FASE_7 backlog marcado como "Opcional disponível".

---

## 5. Preparação para futuros drivers

- **Critérios para reabrir:** Documentados em [AVALIACAO_DRIVERS_POS_FASE7.md](./AVALIACAO_DRIVERS_POS_FASE7.md) §6 (volume, multi-tenant, performance, incidentes, robustez, prioridade de produto).
- **Uso em cada release:** Checklist + mapa + pre-flight; CI verde; rollout/rollback conforme C44 e ROLLOUT_QUICK_REFERENCE.
- **Revisão periódica:** Quando houver métricas de produção, incidentes ou prioridade de produto, reavaliar com base na avaliação de drivers.

---

*Relatório de manutenção operacional. Não abre nova fase; reforça disciplina vigente e corrige gaps executáveis.*
