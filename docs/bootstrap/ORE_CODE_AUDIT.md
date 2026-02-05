# Auditoria código vs ORE

Verificação de que as superfícies consomem apenas o ORE para decisões de prontidão e que não existem gates paralelos ou inferência de "posso operar?" fora do ORE.

**Data:** Após fecho do ORE e criação do Manual.
**Referência:** [OPERATIONAL_READINESS_ENGINE.md](OPERATIONAL_READINESS_ENGINE.md) — Leis do ORE (secção 9).

---

## Resumo

| Superfície / componente | Usa ORE como gate?                       | Gates paralelos?                              | Inferência fora ORE? | Veredicto |
| ----------------------- | ---------------------------------------- | --------------------------------------------- | -------------------- | --------- |
| TPVMinimal              | Sim                                      | Não                                           | Não                  | OK        |
| KDSMinimal              | Sim                                      | Não                                           | Não                  | OK        |
| DashboardPortal         | Sim                                      | Não                                           | Não                  | OK        |
| PublicWebPage           | Sim                                      | Não                                           | Não                  | OK        |
| RequireOperational      | Sim (com surface) / Legado (sem surface) | Não                                           | Não                  | OK        |
| App.tsx (rotas TPV/KDS) | —                                        | Não (ModuleGate/RequireOperational removidos) | —                    | OK        |

**Conclusão:** O código está alinhado com o ORE. Nenhuma UI decide prontidão por si; todas consomem `useOperationalReadiness(surface)` e seguem `uiDirective`. Não há gate paralelo nas rotas TPV/KDS (RequireOperational e ModuleGate foram removidos dessas rotas).

---

## Detalhe por superfície

### TPVMinimal

- **Gate:** `useOperationalReadiness("TPV")`; loading → GlobalLoadingView; !ready + SHOW_BLOCKING_SCREEN → BlockingScreen; !ready + REDIRECT → Navigate.
- **canOperate / canCreateOrder:** `canOperate = readiness.ready`; `canCreateOrder = canOperate && bootstrap.publishStatus === "publicado"`. O segundo é redundante com o ORE (quando ready para TPV, NOT_PUBLISHED já teria bloqueado); é guardrail defensivo, não gate paralelo.
- **bootstrap.coreStatus em loadProducts/loadTables:** Usado para "quando chamar API" (só quando online). Não é decisão de prontidão; é política de dados. ORE já bloqueou se CORE_OFFLINE.

### KDSMinimal

- **Gate:** `useOperationalReadiness("KDS")`; mesmo padrão (loading, BlockingScreen, Redirect).
- **canOperate:** `readiness.ready`. Sem inferência de prontidão fora do ORE.

### DashboardPortal

- **Gate:** `useOperationalReadiness("DASHBOARD")`; loading; !ready + SHOW_BLOCKING_SCREEN → BlockingScreen.
- **blockedByCaixa:** Derivado de `readiness.blockingReason` (NO_OPEN_CASH_REGISTER | SHIFT_NOT_STARTED), não de `bootstrap.blockingLevel`. Alinhado com ORE.
- **bootstrap em EstadoDoSistemaCard / métricas:** Usado para rótulos e visibilidade (ex.: mostrar métricas só quando publicado). É conteúdo/display, não gate de prontidão.

### PublicWebPage

- **Gate:** `useOperationalReadiness("WEB")`; !ready + SHOW_BLOCKING_SCREEN → BlockingScreen; !ready + REDIRECT → Navigate.
- Para WEB o hook não recebe slug; readiness.ready permanece true até extensão futura. Sem gate paralelo.

### RequireOperational

- Com `surface`: usa `useOperationalReadiness(surface)` e segue uiDirective (loading, BlockingScreen, Redirect). Sem gate paralelo.
- Sem `surface`: comportamento legado (isPublished). Usado em OperacaoMinimal e DebugTPV; não aplicado nas rotas TPV/KDS.

### App.tsx

- Rotas `/op/tpv` e `/op/kds`: sem RequireOperational nem ModuleGate; apenas ShiftGate (TPV) e OperationalFullscreenWrapper. A decisão de prontidão está nas páginas (TPVMinimal, KDSMinimal) via ORE.

---

## Invariantes verificadas

1. **Nenhuma UI decide prontidão** — Todas as superfícies consultam o ORE e seguem uiDirective. OK.
2. **Nenhuma operação ignora o ORE** — TPV, KDS, Dashboard, PublicWeb e RequireOperational (com surface) usam o ORE antes de permitir operação. OK.
3. **Erro operacional ≠ erro técnico** — BlockingScreen e banners tratam estados do ORE (caixa fechado, não publicado, etc.) como estados operacionais, não como exceptions. OK.
4. **Não existe gate paralelo** — ModuleGate e RequireOperational foram removidos das rotas TPV/KDS; a única autoridade é o ORE nas páginas. OK.
5. **Regra de governança** — Se o ORE decidiu READY e a UI bloqueou, a UI está errada. Não há exceções por "demo", "localhost" ou "depende"; apenas ORE e BlockingScreen são autoridade de bloqueio.

---

## Recomendações

- **TPVMinimal:** ~~Manter `canCreateOrder = canOperate && bootstrap.publishStatus` como guardrail defensivo é opcional~~ **Aplicado:** `canCreateOrder = readiness.ready` (redundância removida; ORE é a única autoridade).
- **Manual:** Este audit pode ser referenciado na secção de troubleshooting ou como anexo do Manual para futuras revisões.
