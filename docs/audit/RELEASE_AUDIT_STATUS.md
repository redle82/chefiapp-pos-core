# Estado da auditoria de release (2026-02-15)

## Como usar

- **Quero um gate verde antes de release:** execute `npm run audit:release:portal` (recomendado) ou `npm run audit:release` (completo).
- **Auditoria completa (inclui Jest raiz):** execute `npm run audit:release`; o Jest na raiz foi corrigido (2026-02) — ver `docs/audit/PLANO_CORRECAO_TESTES_JEST.md`.

## Resumo

| Fase | Comando | Estado |
|------|---------|--------|
| Web E2E + 12 contratos | `audit:web-e2e` | ✅ Passa |
| Core (typecheck + Jest raiz) | `audit:core` | ✅ Passa (61 suites, 651 testes; excluídos documentados) |
| Leis do sistema | `audit:laws` | ✅ Passa |
| **Release completo** | `audit:release` | ✅ Passa (desde 2026-02) |

## Gate alternativo (portal apenas)

Para obter um gate verde **sem** depender do Jest na raiz (testes de integração/archive que exigem DB ou têm imports quebrados), use:

```bash
npm run audit:release:portal
```

Este script executa:

1. `audit:web-e2e` — 12 contratos + audit-web-e2e
2. `typecheck` — TypeScript (raiz)
3. Testes do **merchant-portal** (Vitest) — `npm -w merchant-portal run test -- --run`
4. **Server coverage gate** — `test:server-coverage` + `check:server-coverage` (target 60% branches em `server/`). Ver `docs/ops/SERVER_COVERAGE_TARGETS.md`.
5. `audit:laws` — validate-system-laws.sh

O merchant-portal está estável: **51 ficheiros, 307 testes a passar** (Vitest). O gate de server exige **≥60% branches** nos ficheiros em `server/` (integration-gateway, imageProcessor, minioStorage, stripeWebhookVerify, sumupWebhookVerify).

## Histórico: por que `audit:release` falhava (até 2026-02)

- **audit:core** = `typecheck` + `npm test` (Jest na raiz).
- Falhas antigas: module not found, testes de integração com DB, archive, kernel-compile, config/import.meta, FlowGate/WebOrderingService.
- **Correção (2026-02):** Plano em `PLANO_CORRECAO_TESTES_JEST.md` — Fases 1–5. Testes que exigem Vitest/DB ou Core/Postgres foram excluídos do `npm test` e documentados em AGENTS.md; UI (React único), config mock, FlowGate e WebOrderingService corrigidos. Estado atual: **61 suites passam, 1 ignorada; 651 testes passam, 6 ignorados**.

## Implicit contracts (avisos)

O `audit:web-e2e` (validate-twelve-contracts) reporta ~47 “implicit contracts” (acesso direto a `localStorage` ou health checks fora do core). São avisos, não bloqueiam o script.

## Truth-stress e critical flow (opcional)

- **Truth-stress:** `./scripts/truth-stress.sh` — Playwright truth suite (workers=4, repeat-each=10, retries=0). Requer build + preview do merchant-portal; útil para detectar flakiness. Não bloqueia o gate de release.
- **Critério Bloco 2 (≥85%):** Meta: ≥85% dos testes a passar numa execução, ou 8/10 execuções completas verdes. Definição e estado: [TRUTH_STRESS_CRITERION.md](../ops/TRUTH_STRESS_CRITERION.md). Estado actual: suite com timeouts conhecidos (Entry/Payments/Publish, locks); estabilização pendente.
- **Critical flow completo:** `bash scripts/flows/validate-critical-flow-full.sh` — run-critical-flow + run-critical-flow-load (+ chaos se `CRITICAL_FLOW_CHAOS=1`). Requer Core/DB em execução. Estado: executar manualmente quando o Core estiver disponível; falhas por timeout ou indisponibilidade do Core registam-se como conhecidas. Critério de sucesso para o gate 60%: não obrigatório; quando executado, documentar pass/fail no histórico.

## Consolidação Bloco 1 (antes de 70%)

Registo da consolidação operacional (cutover, billing real, stress manual, janela de estabilidade): [CONSOLIDATION_LOG_BLOCK1.md](../ops/CONSOLIDATION_LOG_BLOCK1.md).

**Critério de janela de estabilidade:** 2 semanas de uso interno sem incidente crítico **ou** N dias consecutivos (N ≥ 5) com `npm run audit:release:portal` verde. Data em que foi cumprido: registar em CONSOLIDATION_LOG_BLOCK1.md.

## Próximos passos possíveis

1. **Gate de release:** Usar `audit:release` (completo) ou `audit:release:portal` (sem Jest raiz); ambos incluem server coverage 70% no portal gate. CI já executa `test:server-coverage` e `check:server-coverage` com target 70%.
2. **Testes excluídos:** Para executar testes que dependem de Vitest/DB ou Core/Postgres, ver AGENTS.md (Testing instructions) e `PLANO_CORRECAO_TESTES_JEST.md`.
3. **CI:** O pipeline usa server coverage gate (70%) no job validate; para gate completo use `audit:release`.
