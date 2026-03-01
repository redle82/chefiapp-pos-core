# AUDITORIA SUPREMA — Evidence Matrix

**Status:** ACTIVE
**Data:** 2026-02-27
**Versão:** 2.0
**Objetivo:** mapear claim arquitetural ↔ evidência rastreável ↔ decisão de execução

---

## Escala de status

- `ALIGNED` — contrato e implementação convergem
- `PARTIAL` — convergência incompleta
- `CONFLICT` — documentação/implementação se contradizem

## Convenções v2.0

- Toda linha deve apontar para `Ledger IDs` quando `PARTIAL` ou `CONFLICT`.
- Toda linha deve ter `Owner`, `ETA`, `Drift Risk` e `Last Verified`.
- Evidência deve ser granular: `FILE`, `FUNCTION`, `RULE`, `TEST` ou `CI_GUARD`.
- `PARTIAL` sem métrica (`Coverage %` + `Open Findings`) é inválido.

---

## Matriz v2.0

| Row ID | Domínio            | Claim                                                     | Contrato canônico                                                                                                                                                                                            | Evidência granular                                                                        | Evidence Type | Status   | Ledger IDs | Owner              | ETA        | Drift Risk | Coverage % | Open Findings | Confidence % | Last Verified | Verification Command                         | Ação                                         |
| ------ | ------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------- | -------- | ---------- | ------------------ | ---------- | ---------- | ---------- | ------------- | ------------ | ------------- | -------------------------------------------- | -------------------------------------------- |
| E-001  | Runtime Authority  | Porta oficial é 5175                                      | [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md), [../architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md](../architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md) | `merchant-portal/vite.config.ts` (`server.port`) + 128 files canonicalizados (`e98ee7d7`) | FILE,RULE     | ALIGNED  | L-001      | Platform           | 2026-03-07 | LOW        | 100        | 0             | 100          | 2026-02-27    | `npm run audit:bypass -- --check marketing`  | ✅ DONE — guardrail de porta ativo em CI     |
| E-002  | Boot Chain         | Cadeia oficial de boot é única                            | [../architecture/BOOT_CHAIN.md](../architecture/BOOT_CHAIN.md), [../canon/ROUTE_MANIFEST.md](../canon/ROUTE_MANIFEST.md)                                                                                     | Dead chains deleted (`595e091f`): AppDomainProvider, AppDomainWrapper, OperationGate      | FILE,FUNCTION | ALIGNED  | L-002      | Platform           | 2026-03-07 | LOW        | 100        | 0             | 100          | 2026-02-27    | `npm run audit:bypass -- --check boot-chain` | ✅ DONE — cadeia única verificada            |
| E-003  | Kernel Authority   | Só kernel decide auth/tenant/billing/lifecycle            | [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md)                                                                                                             | 24 consumers → `useTenant()` (`e609282b`); allowlist: BootstrapPage+AuthProvider (kernel) | FILE,COMMAND  | ALIGNED  | L-004      | Runtime Team       | 2026-03-14 | LOW        | 100        | 0             | 98           | 2026-02-27    | `npm run audit:bypass`                       | ✅ DONE — tenant bypasses eliminados         |
| E-004  | Boundary Marketing | Marketing não importa runtime/boot                        | [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md)                                                                                                             | `merchant-portal/eslint.config.js` (`no-restricted-imports` para marketing)               | RULE          | ALIGNED  | -          | Platform           | 2026-03-07 | LOW        | 100        | 0             | 95           | 2026-02-27    | `npm run audit:bypass -- --check marketing`  | Manter regra como `error`                    |
| E-005  | Boundary Boot      | Boot não importa UI/surfaces                              | [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md)                                                                                                             | `merchant-portal/eslint.config.js` (`no-restricted-imports` para boot)                    | RULE          | ALIGNED  | -          | Platform           | 2026-03-07 | LOW        | 100        | 0             | 95           | 2026-02-27    | `npm run audit:bypass -- --check boot`       | Monitorar exceções com allowlist mínima      |
| E-006  | Boundary Surfaces  | Surfaces não importam boot internals e não bypassam gates | [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md)                                                                                                             | Tenant bypasses removed; 6 billing findings remain (Phase 2, deferred)                    | RULE,COMMAND  | PARTIAL  | L-004      | Runtime Team       | 2026-03-14 | LOW        | 94         | 6             | 92           | 2026-02-27    | `npm run audit:bypass -- --check surfaces`   | Phase 2: centralizar billing gates restantes |
| E-007  | Entry Flow         | Entrada oficial não conflita com docs antigos             | [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md)                                                                                                             | Contratos v1 alinhados; docs antigos ainda citam fluxo legado                             | FILE          | CONFLICT | L-003      | Product+Platform   | 2026-03-10 | CRITICAL   | 55         | 6             | 60           | 2026-02-27    | `npm run audit:bypass -- --check boot-chain` | Fechar conflito com supersede explícito      |
| E-008  | Legacy Governance  | Artefato legado precisa estado e data de corte            | [./AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md](./AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md)                                                                                                                 | Ledger aberto com owners e target date; classificação incompleta                          | FILE          | PARTIAL  | L-005      | Architecture Guild | 2026-03-14 | MEDIUM     | 50         | 20            | 65           | 2026-02-27    | `npm run audit:bypass:baseline`              | Classificar todos os artefatos legados       |

---

## Próximas evidências obrigatórias

1. `Entry Flow Contract` consolidado por estado e destino.
2. Matriz AuthZ (`Role × Capability × Surface × Route`) congelada.
3. Lista de bypasses de tenant/billing/auth por superfície com owner e ETA.
4. Relatório periódico `bypass-hunt` anexado aos PRs que toquem runtime/surfaces.
