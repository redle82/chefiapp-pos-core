# Auditoria de Contratos Referenciados

**Propósito:** Tabela de auditoria de todos os contratos referenciados directa ou indirectamente por CORE_SYSTEM_OVERVIEW, CORE_CONTROL_PLANE_CONTRACT, CORE_STATE, CORE_CONTRACT_INDEX e CORE_DECISION_LOG. Regra: nenhum documento pode referenciar um .md que não exista em disco.

**Data:** 2026-01-28.

---

## 1. Tabela de auditoria

| Contract name | Referenced from | Exists on disk | Required for coherence | Action |
|---------------|-----------------|----------------|------------------------|--------|
| BOOTSTRAP_CONTRACT.md | CORE_SYSTEM_OVERVIEW, CORE_CONTROL_PLANE_CONTRACT, CORE_CONTRACT_INDEX | yes | yes | ignore |
| BOOTSTRAP_KERNEL.md | CORE_SYSTEM_OVERVIEW, CORE_CONTROL_PLANE_CONTRACT | yes | yes | ignore |
| CORE_CONTRACT_INDEX.md | CORE_SYSTEM_OVERVIEW, CORE_STATE, CORE_DECISION_LOG | yes | yes | ignore |
| KERNEL_EXECUTION_MODEL.md | CORE_SYSTEM_OVERVIEW, CORE_CONTRACT_INDEX | yes | yes | ignore |
| CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md | CORE_SYSTEM_OVERVIEW, CORE_CONTRACT_INDEX | yes | yes | ignore |
| CORE_TRUTH_HIERARCHY.md | CORE_SYSTEM_OVERVIEW, CORE_CONTRACT_INDEX | yes | yes | ignore |
| CORE_TIME_GOVERNANCE_CONTRACT.md | CORE_SYSTEM_OVERVIEW, CORE_CONTRACT_INDEX | yes | yes | ignore |
| CORE_FAILURE_MODEL.md | CORE_SYSTEM_OVERVIEW, CORE_CONTRACT_INDEX | yes | yes | ignore |
| CORE_APPSTAFF_IDENTITY_CONTRACT.md | CORE_CONTRACT_INDEX | yes | yes | ignore |
| CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md | (new) | yes | yes | created |
| CORE_IDENTITY_AND_TRUST_CONTRACT.md | (new) | yes | yes | created |
| CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md | (new) | yes | yes | created |
| CORE_RECONCILIATION_CONTRACT.md | (new) | yes | yes | created |
| CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md | (new) | yes | yes | created |
| TERMINAL_REGISTRATION_CONTRACT.md | (evaluated) | no | no | explicitly forbid |
| CORE_PAYMENT_RECONCILIATION_CONTRACT.md | (evaluated) | no | no | explicitly forbid |
| INSTALLATION_AND_PROVISIONING_CONTRACT (without CORE_) | (evaluated) | no | no | created as CORE_* in docs/architecture |
| SCOPE_FREEZE.md | CORE_STATE | yes (docs/strategy) | no | ignore |
| NEXT_ACTIONS.md | CORE_STATE | yes (docs/strategy) | no | ignore |
| CORE_OS_LAYERS.md | CORE_STATE, CORE_CONTRACT_INDEX | yes | yes | ignore |
| CORE_CONTRACT_COVERAGE.md | CORE_STATE, CORE_CONTRACT_INDEX | yes | yes | ignore |
| CONTRACT_ENFORCEMENT.md | CORE_STATE, CORE_CONTRACT_INDEX | yes | yes | ignore |
| CORE_DECISION_LOG.md | CORE_STATE, CORE_CONTRACT_INDEX | yes | yes | ignore |
| All other .md listed in CORE_CONTRACT_INDEX | CORE_CONTRACT_INDEX | yes | yes | ignore |
| BOOTSTRAP_KERNEL.md | CORE_SYSTEM_OVERVIEW, CORE_CONTROL_PLANE_CONTRACT | yes | yes | indexed in §3 |
| DOMAIN_WRITE_AUTHORITY_CONTRACT.md | docs/contracts; DOC_INDEX | yes | reference | indexed in §7 |
| EVENTS_AND_STREAMS.md | docs/contracts; DOC_INDEX | yes | reference | indexed in §7 |
| EXECUTION_CONTEXT_CONTRACT.md | TENANCY_KERNEL_CONTRACT; DOC_INDEX | yes | reference | indexed in §7 |
| EXECUTION_FENCE_CONTRACT.md | docs/contracts; DOC_INDEX | yes | reference | indexed in §7 |
| STATUS_CONTRACT.md | docs/contracts; DOC_INDEX | yes | reference | indexed in §7 |

(Contratos restantes referenciados no CORE_CONTRACT_INDEX foram verificados: existem em docs/architecture ou docs/contracts. Nenhum documento existente em disco ficou por indexar.)

---

## 2. Contratos intencionalmente NÃO criados (e porquê)

### TERMINAL_REGISTRATION_CONTRACT

**Não deve existir como contrato separado.**

- **Motivo:** O acto de "registro no Core" é governado integralmente por [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md). Criar TERMINAL_REGISTRATION_CONTRACT duplicaria essa dimensão e criaria ambiguidade de autoridade (dois contratos a governar o mesmo acto).
- **Regra:** Registro de terminais é uma secção do contrato de Instalação e Provisionamento. Nenhum documento deve referenciar TERMINAL_REGISTRATION_CONTRACT.

### CORE_PAYMENT_RECONCILIATION_CONTRACT

**Não deve existir como contrato separado.**

- **Motivo:** A reconciliação de pagamentos (gateway vs Core, pedido–pagamento) está incluída no [CORE_RECONCILIATION_CONTRACT.md](./CORE_RECONCILIATION_CONTRACT.md). Criar um contrato distinto para "payment reconciliation" separaria artificialmente uma parte do domínio de reconciliação e poderia criar autoridade circular ou sobreposição (reconciliação geral vs pagamentos).
- **Regra:** Reconciliação financeira e de pagamentos é governada por um único contrato (CORE_RECONCILIATION_CONTRACT). Nenhum documento deve referenciar CORE_PAYMENT_RECONCILIATION_CONTRACT.

---

## 3. Resumo

- **Criados:** CORE_INSTALLATION_AND_PROVISIONING_CONTRACT, CORE_IDENTITY_AND_TRUST_CONTRACT, CORE_HEARTBEAT_AND_LIVENESS_CONTRACT, CORE_RECONCILIATION_CONTRACT, CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.
- **Não criados (proibidos):** TERMINAL_REGISTRATION_CONTRACT (duplica Instalação e Provisionamento), CORE_PAYMENT_RECONCILIATION_CONTRACT (merge em CORE_RECONCILIATION_CONTRACT).
- **Sistema:** Todos os contratos referenciados pelos cinco documentos fonte existem em disco. Nenhuma referência quebrada. Kernel permanece execução; Core permanece autoridade de negócio/financeira; Docker permanece substrato de deploy.

---

*Documento de auditoria. Manter actualizado quando forem adicionadas novas referências a contratos nos documentos canónicos.*
