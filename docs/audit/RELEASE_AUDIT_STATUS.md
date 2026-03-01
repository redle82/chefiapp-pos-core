# Estado da auditoria de release (2026-02-15)

## Como usar

- **Quero um gate verde antes de release:** execute `npm run audit:release:portal` (recomendado) ou `npm run audit:release` (completo).
- **Auditoria completa (inclui Jest raiz):** execute `npm run audit:release`; o Jest na raiz foi corrigido (2026-02) — ver `docs/audit/PLANO_CORRECAO_TESTES_JEST.md`.

## Resumo

| Fase                         | Comando         | Estado                                                   |
| ---------------------------- | --------------- | -------------------------------------------------------- |
| Web E2E + 12 contratos       | `audit:web-e2e` | ✅ Passa                                                 |
| Core (typecheck + Jest raiz) | `audit:core`    | ✅ Passa (61 suites, 651 testes; excluídos documentados) |
| Leis do sistema              | `audit:laws`    | ✅ Passa                                                 |
| **Release completo**         | `audit:release` | ✅ Passa (desde 2026-02)                                 |

## Política vigente de bloqueio (2026-02-27)

- **GO/NO-GO de release bloqueia** se houver qualquer linha `High` em estado diferente de `RESOLVED`/`WAIVED` no [AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md](./AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md).
- Comando de verificação obrigatório: `npm run audit:ledger:high`.
- `audit:release` e `audit:release:portal` devem incluir este gate.

## Gate alternativo (portal apenas)

Para obter um gate verde **sem** depender do Jest na raiz (testes de integração/archive que exigem DB ou têm imports quebrados), use:

```bash
npm run audit:release:portal
```

Este script executa:

1. `audit:web-e2e` — 12 contratos + audit-web-e2e
2. `typecheck` — TypeScript (raiz)
3. Testes do **merchant-portal** (Vitest) — `npm -w merchant-portal run test -- --run`
4. `audit:laws` — validate-system-laws.sh

O merchant-portal está estável: **51 ficheiros, 307 testes a passar** (Vitest).

## Histórico: por que `audit:release` falhava (até 2026-02)

- **audit:core** = `typecheck` + `npm test` (Jest na raiz).
- Falhas antigas: module not found, testes de integração com DB, archive, kernel-compile, config/import.meta, FlowGate/WebOrderingService.
- **Correção (2026-02):** Plano em `PLANO_CORRECAO_TESTES_JEST.md` — Fases 1–5. Testes que exigem Vitest/DB ou Core/Postgres foram excluídos do `npm test` e documentados em AGENTS.md; UI (React único), config mock, FlowGate e WebOrderingService corrigidos. Estado atual: **61 suites passam, 1 ignorada; 651 testes passam, 6 ignorados**.

## Implicit contracts (avisos)

O `audit:web-e2e` (validate-twelve-contracts) reporta ~47 “implicit contracts” (acesso direto a `localStorage` ou health checks fora do core). São avisos, não bloqueiam o script.

## Próximos passos possíveis

1. **Gate de release:** Usar `audit:release` (completo) ou `audit:release:portal` (sem Jest raiz); ambos estão verdes.
2. **Testes excluídos:** Para executar testes que dependem de Vitest/DB ou Core/Postgres, ver AGENTS.md (Testing instructions) e `PLANO_CORRECAO_TESTES_JEST.md`.
3. **CI:** O pipeline pode usar `audit:release` para o gate completo.
