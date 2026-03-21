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

| ID    | Tema                                               | Evidência                                                 | Severidade | Resolution Strategy     | Decisão                                                                                                                                                                                                                | Owner              | Target Date | Status      | Matrix Rows  |
| ----- | -------------------------------------------------- | --------------------------------------------------------- | ---------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------- | ----------- | ------------ |
| L-001 | Porta canônica divergente em docs antigos          | referências históricas a 5157/5173                        | High       | Freeze + Deprecate      | 5175 é único valor oficial; docs conflitantes vão para `LEGACY`                                                                                                                                                        | Platform           | 2026-03-07  | OPEN        | E-001        |
| L-002 | Cadeias de boot antigas descritas como ativas      | menções a `TenantProvider/AppDomainWrapper/OperationGate` | High       | Refactor + Delete       | Cadeia única oficial é `FlowGate → useBootPipeline → BootRuntimeEngine → resolveBootDestination`                                                                                                                       | Platform           | 2026-03-07  | OPEN        | E-002        |
| L-003 | Narrativa de entrada “Login → Dashboard”           | contratos antigos de auth/entry                           | Medium     | Refactor                | Substituir por `Identity → Runtime → Context → Surface` com reason codes                                                                                                                                               | Product+Platform   | 2026-03-10  | OPEN        | E-007        |
| L-004 | Bypass de kernel em surfaces (tenant/billing/auth) | guards/páginas com cálculo local                          | High       | Refactor + Automate     | Migrar para consumo de contexto e gates centrais. **PR `refactor/boot-pipeline`**: 22 consumer files canonicalizados via `readTenantIdWithLegacyFallback()`, baseline 44→37, RequireOperational gates em TPV+AppStaff. | Runtime Team       | 2026-03-14  | IN_PROGRESS | E-003, E-006 |
| L-005 | Legado sem política de remoção                     | docs/rotas/fluxos meio-vivos                              | Medium     | Deprecate + Remove Date | Classificar `ACTIVE/LEGACY/DEPRECATED/REMOVE_DATE`                                                                                                                                                                     | Architecture Guild | 2026-03-14  | OPEN        | E-008        |

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
