# AUDITORIA SUPREMA — Contradictions Ledger

**Status:** ACTIVE
**Data:** 2026-02-27
**Objetivo:** controlar contradições entre contratos/documentação/código até eliminação total

---

## Regras de uso

- Toda contradição recebe `Owner`, `Decision`, `Target Date`.
- Nenhuma contradição crítica permanece sem decisão.
- Quando resolvida, marcar `RESOLVED` com referência do patch/doc.

---

## Ledger

| ID    | Tema                                               | Evidência                                                 | Severidade | Resolution Strategy     | Decisão                                                                                                                                                | Owner              | Target Date | Status   | Matrix Rows  |
| ----- | -------------------------------------------------- | --------------------------------------------------------- | ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ----------- | -------- | ------------ |
| L-001 | Porta canônica divergente em docs antigos          | referências históricas a 5157/5173                        | High       | Freeze + Deprecate      | **RESOLVED** `e98ee7d7` (PR-F): 128 files sed-replaced 5173→5175; vite.config canonical port; zero refs remain.                                        | Platform           | 2026-03-07  | RESOLVED | E-001        |
| L-002 | Cadeias de boot antigas descritas como ativas      | menções a `TenantProvider/AppDomainWrapper/OperationGate` | High       | Refactor + Delete       | **RESOLVED** `595e091f` (PR-G): 19 files — deleted AppDomainProvider, AppDomainWrapper, OperationGate, removed stale refs from 6 docs.                 | Platform           | 2026-03-07  | RESOLVED | E-002        |
| L-003 | Narrativa de entrada “Login → Dashboard”           | contratos antigos de auth/entry                           | Medium     | Refactor                | Substituir por `Identity → Runtime → Context → Surface` com reason codes                                                                               | Product+Platform   | 2026-03-10  | OPEN     | E-007        |
| L-004 | Bypass de kernel em surfaces (tenant/billing/auth) | guards/páginas com cálculo local                          | High       | Refactor + Automate     | **RESOLVED** `e609282b` (PR-H): 24 files → useTenant(); baseline 37→6 (billing-only, Phase 2). Allowlist: BootstrapPage+AuthProvider (kernel writers). | Runtime Team       | 2026-03-14  | RESOLVED | E-003, E-006 |
| L-005 | Legado sem política de remoção                     | docs/rotas/fluxos meio-vivos                              | Medium     | Deprecate + Remove Date | Classificar `ACTIVE/LEGACY/DEPRECATED/REMOVE_DATE`                                                                                                     | Architecture Guild | 2026-03-14  | OPEN     | E-008        |

---

## Estados permitidos

- `OPEN`
- `IN_PROGRESS`
- `BLOCKED`
- `RESOLVED`
- `WAIVED` (com justificativa explícita)

---

## Definition of Done (ledger)

1. Todas as linhas High em `RESOLVED` ou `WAIVED` documentado.
2. Nenhum doc canônico conflita com [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md).
3. Nenhuma referência a cadeia de boot antiga sem marcador de legado.
