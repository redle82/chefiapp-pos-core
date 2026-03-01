# AUDITORIA SUPREMA — Execution Package (ChefIApp OS v1)

**Status:** ACTIVE EXECUTION PACKAGE
**Data:** 2026-02-27
**Owner:** Platform Architecture
**Baseline:** [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md)

---

## Objetivo

Executar a convergência arquitetural para modelo único de plataforma:

**Kernel → Context → Surface**

Com isso, eliminamos ambiguidades de runtime, reforçamos boundaries e criamos trilha auditável para escala, investimento e operação.

---

## Escopo do pacote

Este pacote cobre 4 artefatos executáveis:

1. **Plano de execução** (este documento)
2. **Matriz de evidências** ([AUDITORIA_SUPREMA_EVIDENCE_MATRIX.md](./AUDITORIA_SUPREMA_EVIDENCE_MATRIX.md))
3. **Ledger de contradições** ([AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md](./AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md))
4. **Gate de PR arquitetural** ([AUDITORIA_SUPREMA_PR_GATE.md](./AUDITORIA_SUPREMA_PR_GATE.md))

---

## Ordem de execução (waves)

### Wave 1 — Freeze de Verdade (Semana 1)

- Congelar contrato canônico de boot, runtime e entry flow
- Resolver conflito de porta canônica (5175)
- Consolidar cadeia oficial: `FlowGate → useBootPipeline → BootRuntimeEngine → resolveBootDestination`
- Marcar narrativas antigas como legado no ledger

### Wave 2 — Enforcement de Boundary (Semana 2)

- Bloquear regressão via lint (`error`) para fronteiras de camada
- Proibir bypass de boot nas surfaces
- Proibir import de runtime em marketing

### Wave 3 — Convergência de Fluxo (Semana 3)

- Consolidar Entry Flow Contract com reason codes
- Padronizar rotas canônicas por estado de entrada
- Executar smoke por superfície (admin/staff/pos/kds)

### Wave 4 — Legado e Corte (Semana 4)

- Classificar itens em `ACTIVE | LEGACY | DEPRECATED | REMOVE_DATE`
- Definir datas de remoção para cadeias e docs superseded
- Encerrar ledger com decisões finais de corte

---

## Critérios de sucesso

1. Existe uma única autoridade de runtime no código e na documentação.
2. Nenhuma superfície recalcula auth/tenant/billing fora do kernel.
3. Mudanças de arquitetura passam obrigatoriamente pelo PR gate.
4. Contradições abertas no ledger têm owner, prazo e decisão.

---

## Entradas canônicas obrigatórias

- [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md)
- [../architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md](../architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md)
- [../architecture/BOOT_CHAIN.md](../architecture/BOOT_CHAIN.md)
- [../canon/ROUTE_MANIFEST.md](../canon/ROUTE_MANIFEST.md)
- [../architecture/ARCHITECTURE_GUARD.md](../architecture/ARCHITECTURE_GUARD.md)
