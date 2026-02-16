# Estado da auditoria de release (2026-02-13)

## Como usar

- **Quero um gate verde antes de release:** execute `npm run audit:release:portal` (recomendado).
- **Quero a auditoria completa (inclui Jest raiz):** execute `npm run audit:release`; pode falhar sem DB/local correto — ver secção abaixo.

## Resumo

| Fase | Comando | Estado |
|------|---------|--------|
| Web E2E + 12 contratos | `audit:web-e2e` | ✅ Passa |
| Core (typecheck + Jest raiz) | `audit:core` | ❌ Falha no Jest |
| Leis do sistema | `audit:laws` | ✅ (não executado se core falhar) |
| **Release completo** | `audit:release` | ❌ Falha em `audit:core` |

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

## Por que `audit:release` falha

- **audit:core** = `typecheck` + `npm test` (Jest na raiz).
- O Jest na raiz corre suites em `tests/`, `node/`, etc. (integração, archive, unit antigos).
- Falhas observadas:
  - **Module not found** em vários testes (Jest resolve diferente).
  - **database "goldmonkey" does not exist** em testes de integração.
  - **invalid input value for enum payment_status** em fiscal-payment-validation.
  - **Test suite failed to run** em CashRegisterAlert, FiscalConfigAlert, kernel-compile, tenant_isolation, plpgsql-core-rpcs, etc.

Última execução: **15 test suites falhados, 10 testes falhados, 585 passados** (64 suites totais).

## Implicit contracts (avisos)

O `audit:web-e2e` (validate-twelve-contracts) reporta ~47 “implicit contracts” (acesso direto a `localStorage` ou health checks fora do core). São avisos, não bloqueiam o script.

## Próximos passos possíveis

1. **Usar `audit:release:portal`** como gate de release até o Jest na raiz estar corrigido.
2. **Corrigir o Jest na raiz**: resolver imports, marcar como skip testes que exigem DB `goldmonkey`, alinhar enum `payment_status` com o schema, etc.
3. **CI**: se o pipeline usar `audit:release`, considerar trocar para `audit:release:portal` ou manter ambos (release completo opcional).
