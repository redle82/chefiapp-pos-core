# AUDITORIA SUPREMA — PR Gate (Architecture)

**Status:** ACTIVE GATE
**Data:** 2026-02-27

Este gate é obrigatório para PRs que toquem runtime, boot, rotas, auth, tenant, billing ou surfaces.

---

## 1) Checklist obrigatório

### Verdade canônica

- [ ] Mantém porta oficial 5175.
- [ ] Mantém cadeia de boot oficial (`FlowGate → useBootPipeline → BootRuntimeEngine → resolveBootDestination`).
- [ ] Não cria autoridade paralela de decisão fora do kernel.

### Boundary rules

- [ ] Marketing não importa runtime/boot.
- [ ] Boot não importa UI/surfaces.
- [ ] Surfaces não importam boot internals.
- [ ] Não há bypass de tenant/billing/auth em página/feature.

### Fluxo e contexto

- [ ] `LaunchContext` permanece contrato de handoff para superfícies.
- [ ] Reason codes foram preservados/atualizados com rastreabilidade.
- [ ] Redirects manuais fora do gate foram evitados ou justificados.

### Legado

- [ ] Alterações em docs conflitantes foram registradas no ledger.
- [ ] Se introduziu depreciação, incluiu `REMOVE_DATE`.

---

## 2) Evidências mínimas no PR

1. Lista de arquivos alterados com classificação: `Kernel`, `Orchestrator`, `Surface`, `External`.
2. Resultado de lint (`merchant-portal`) e testes focados da área tocada.
3. Artefato do `bypass-hunt` (output em markdown/json) quando PR toca runtime/surfaces.
4. Link para atualização na matriz de evidência (linha(s) impactada(s)).
5. Link para atualização no contradictions ledger (quando aplicável).

Comando padrão de evidência automática:

- `npm run audit:bypass`

---

## 3) Regras de bloqueio

PR deve ser bloqueado quando:

- mover decisão de auth/tenant/billing/lifecycle para superfície;
- introduzir cadeia alternativa de boot;
- quebrar boundary de import de camada;
- alterar verdade canônica sem update explícito dos contratos.
- não anexar evidência `bypass-hunt` quando aplicável.
- existir linha `High` em estado diferente de `RESOLVED`/`WAIVED` no [AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md](./AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md).

---

## 3.1) Política de lifecycle documental

Todos os artefatos de auditoria/arquitetura devem declarar um estado explícito:

- `ACTIVE` — contrato vigente
- `LEGACY` — histórico mantido para contexto, sem autoridade canônica
- `DEPRECATED` — em remoção, deve conter `REMOVE_DATE`

Regras:

1. `LEGACY`/`DEPRECATED` não podem redefinir contratos canônicos.
2. `DEPRECATED` sem `REMOVE_DATE` viola gate.
3. Conflitos entre `LEGACY` e canon devem abrir/atualizar linha no ledger.

---

## 4) Referências

- [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md)
- [../architecture/ARCHITECTURE_GUARD.md](../architecture/ARCHITECTURE_GUARD.md)
- [./AUDITORIA_SUPREMA_EVIDENCE_MATRIX.md](./AUDITORIA_SUPREMA_EVIDENCE_MATRIX.md)
- [./AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md](./AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md)
