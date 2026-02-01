# Reconciliação Final — Contratos

**Propósito:** Declaração final de estado após auditoria e reconciliação. Regra: **Referenced == Exists == Written == Indexed == Enforced**.

**Data:** 2026-01-28.

---

## 1. Resumo executivo

| Métrica | Valor |
|---------|--------|
| **Total de contratos/documentos existentes (indexados)** | 68 |
| **Total de contratos proibidos (não devem existir)** | 2 |
| **Total deferidos (futuro; registados no Decision Log)** | 0 |
| **Missing (referenciados mas inexistentes)** | 0 |
| **Empty (existentes mas vazios)** | 0 |
| **Implicit assumptions (referências não resolvidas)** | 0 |

---

## 2. Contratos existentes

Todos os documentos listados em [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) existem em disco e têm conteúdo (tamanho > 0). Incluem:

- **docs/architecture/:** 61 documentos (Supreme, Terminals, AppStaff, UI, Topology, Bootstrap, Instalação/Identidade/Heartbeat/Dados, Coverage, Decision Log, Billing, Outros domínio, Leis invisíveis, Enforcement, Prompt).
- **docs/contracts/:** 7 documentos (CORE_PUBLIC_WEB_CONTRACT, CORE_FOUR_TERMINALS_INDEX, DOMAIN_WRITE_AUTHORITY_CONTRACT, EVENTS_AND_STREAMS, EXECUTION_CONTEXT_CONTRACT, EXECUTION_FENCE_CONTRACT, STATUS_CONTRACT).

Nenhum documento existente em docs/architecture ou docs/contracts ficou por indexar.

---

## 3. Contratos proibidos

Os seguintes **não** devem existir como ficheiros. Nenhum documento no repositório deve referenciá-los como contratos a criar ou a usar.

| Nome | Motivo |
|------|--------|
| **TERMINAL_REGISTRATION_CONTRACT** | Duplica a dimensão "registro" do CORE_INSTALLATION_AND_PROVISIONING_CONTRACT. Criaria ambiguidade de autoridade. |
| **CORE_PAYMENT_RECONCILIATION_CONTRACT** | Reconciliação de pagamentos está incluída no CORE_RECONCILIATION_CONTRACT. Contrato separado criaria sobreposição e autoridade circular. |

Proibição formal: [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) §11. Detalhe: [CONTRACT_AUDIT_REFERENCED.md](./CONTRACT_AUDIT_REFERENCED.md).

---

## 4. Deferidos

Nenhum documento foi classificado como DEFERRED nesta reconciliação. Documentos em docs/strategy (SCOPE_FREEZE, NEXT_ACTIONS) existem e são referenciados por CORE_STATE; não são contratos Core.

---

## 5. Invariantes verificadas

- **Kernel ≠ Core.** Kernel = execução; Core = negócio/financeiro. Nenhum contrato criado ou alterado viola esta separação.
- **Docker Financial Core = autoridade.** Nenhum Supabase, Firebase ou SaaS foi introduzido como autoridade.
- **Nenhum ficheiro vazio.** Nenhum .md com tamanho 0 em docs/architecture ou docs/contracts.
- **Nenhuma referência quebrada.** Todos os links .md nos documentos canónicos (CORE_SYSTEM_OVERVIEW, CORE_CONTROL_PLANE_CONTRACT, CORE_STATE, CORE_CONTRACT_INDEX, CORE_DECISION_LOG, CORE_OS_LAYERS, CONTRACT_ENFORCEMENT) apontam para ficheiros existentes e não vazios.
- **Enforcement mapeado.** CONTRACT_ENFORCEMENT inclui secção 21 para os contratos de soberania operacional (Instalação, Identidade, Heartbeat, Reconciliação, Retenção, BOOTSTRAP_KERNEL) e referência aos 5 docs/contracts.

---

## 6. Critério de conclusão

**"Referenced == Exists == Written == Indexed == Enforced"**

| Condição | Estado |
|----------|--------|
| Todo o referenciado existe em disco | ✅ |
| Todo o existente (docs/architecture, docs/contracts) está indexado | ✅ |
| Todo o indexado tem conteúdo (não vazio) | ✅ |
| Contratos proibidos documentados na lei (Overview) | ✅ |
| Enforcement actualizado para novos contratos | ✅ |
| ZERO missing | ✅ |
| ZERO empty | ✅ |
| ZERO implicit assumptions | ✅ |

---

*Documento de reconciliação final. Gerado após auditoria em 5 fases. Manter como evidência de estado contract-complete.*
