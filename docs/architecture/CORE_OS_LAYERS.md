# Mapa do Território — 9 Camadas do ChefIApp OS

**Propósito:** Arquitetura real de sistemas deste nível (Toast, Lightspeed, ServiceNow, Palantir). Não por features — por camadas universais. Referência única para "onde estamos" em cada camada.

**Uso:** Em decisões de produto ou arquitectura, referenciar esta camada; comparar com outros sistemas pela mesma grelha.

---

## 1. Kernel / Core Soberano

**O que é:** Modelo de domínio, regras invariantes, estados válidos, autoridade final. Não depende de UI.

| Sistema   | Estado |
|-----------|--------|
| Toast     | ✅     |
| Lightspeed| ✅     |
| ServiceNow| ✅     |
| Palantir  | ✅     |
| **ChefIApp** | ✅ Core soberano, contratos de domínio, Kernel multi-tenant. [KERNEL_EXECUTION_MODEL](./KERNEL_EXECUTION_MODEL.md), [TENANCY_KERNEL_CONTRACT](./TENANCY_KERNEL_CONTRACT.md). |

---

## 2. Contratos (Leis do Sistema)

**O que é:** Quem manda, quem obedece; o que cada terminal pode ou não fazer.

| Sistema   | Estado |
|-----------|--------|
| Toast     | ⚠️     |
| Lightspeed| ⚠️     |
| ServiceNow| ✅     |
| Palantir  | ✅     |
| **ChefIApp** | ✅ UI Contract, AppStaff Contract, KDS/TPV Contracts, Leis invisíveis (7). [CORE_CONTRACT_INDEX](./CORE_CONTRACT_INDEX.md). |

---

## 3. Runtime / Execution Model

**O que é:** Onde e como o sistema roda (SaaS, edge, offline, multi-node).

| Sistema   | Estado |
|-----------|--------|
| Toast     | ✅ edge + cloud |
| Lightspeed| ⚠️ cloud + offline |
| ServiceNow| ✅ SaaS centralizado |
| Palantir  | ✅ on-prem / gov / air-gapped |
| **ChefIApp** | ✅ Kernel + Edge Installer, modos de runtime definidos. [CORE_OFFLINE_CONTRACT](./CORE_OFFLINE_CONTRACT.md). |

---

## 4. Terminais (Interfaces de Execução)

**O que é:** Interfaces especializadas; cada uma com poder limitado.

| Sistema   | Estado |
|-----------|--------|
| Toast     | ✅ TPV, KDS, handheld |
| Lightspeed| ✅ POS, backoffice |
| ServiceNow| ⚠️ agent, requester |
| Palantir  | ⚠️ analyst workspace |
| **ChefIApp** | ✅ AppStaff, TPV, KDS. [CORE_APPSTAFF_CONTRACT](./CORE_APPSTAFF_CONTRACT.md), [CORE_TPV_BEHAVIOUR_CONTRACT](./CORE_TPV_BEHAVIOUR_CONTRACT.md), [CORE_KDS_CONTRACT](./CORE_KDS_CONTRACT.md). |

---

## 5. Governança Operacional

**O que é:** SLAs, prioridades, escalação, incidentes. Quem vê o quê quando algo dá errado; quando vira incidente; quando o sistema se cala.

| Sistema   | Estado |
|-----------|--------|
| Toast     | ⚠️     |
| Lightspeed| ⚠️     |
| ServiceNow| ✅ ITSM, ITIL |
| Palantir  | ✅ governance + audit |
| **ChefIApp** | ✅ Contrato fechado. [CORE_OPERATIONAL_GOVERNANCE_CONTRACT](./CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md) define quem vê alertas, quando vira incidente, quando se cala; referência a Failure, Silêncio, Tempo, Comunicação. SLAs locais (KDS, atrasos); Failure em código; enforcement de visibilidade por papel a evoluir. [CORE_FAILURE_MODEL](./CORE_FAILURE_MODEL.md), [CORE_TIME_GOVERNANCE_CONTRACT](./CORE_TIME_GOVERNANCE_CONTRACT.md), [CORE_SILENCE_AND_NOISE_POLICY](./CORE_SILENCE_AND_NOISE_POLICY.md). |

---

## 6. Observabilidade

**O que é:** Métricas, logs, estados; o sistema sabe o que está a acontecer.

| Sistema   | Estado |
|-----------|--------|
| Toast     | ⚠️     |
| Lightspeed| ⚠️     |
| ServiceNow| ✅ health + impact |
| Palantir  | ✅ dashboards ontológicos |
| **ChefIApp** | 🟡 Tem métricas (atrasos, fila, pressão); falta modelo de consciência em código. [CORE_SYSTEM_AWARENESS_MODEL](./CORE_SYSTEM_AWARENESS_MODEL.md). |

---

## 7. Automação / Decisão

**O que é:** Regras, sugestões, acções automáticas.

| Sistema   | Estado |
|-----------|--------|
| Toast     | ⚠️ throttling, pacing |
| Lightspeed| ❌     |
| ServiceNow| ✅ workflows automáticos |
| Palantir  | ✅ decision intelligence |
| **ChefIApp** | 🟡 Base pronta (Kernel, eventos); IA/autonomia ainda não activadas. |

---

## 8. Evolução / Compatibilidade

**O que é:** Versionamento, backward compatibility, flags, migração.

| Sistema   | Estado |
|-----------|--------|
| Toast     | ⚠️     |
| Lightspeed| ⚠️ fiscal por país |
| ServiceNow| ✅ releases versionadas |
| Palantir  | ✅ ontology evolutiva |
| **ChefIApp** | 🟡 Contrato escrito; enforcement ainda implícito. [CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT](./CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT.md). |

---

## 9. Ecossistema / Extensão

**O que é:** APIs, integrações, parceiros, add-ons.

| Sistema   | Estado |
|-----------|--------|
| Toast     | ⚠️     |
| Lightspeed| ✅ apps fiscais |
| ServiceNow| ✅ marketplace |
| Palantir  | ✅ extensions |
| **ChefIApp** | 🟡 Ainda fechado. Correcto para este momento. [SCOPE_FREEZE](../strategy/SCOPE_FREEZE.md). |

---

## Tabela comparativa (resumo)

| Camada              | Toast | Lightspeed | ServiceNow | Palantir | ChefIApp |
|---------------------|-------|------------|------------|----------|----------|
| Kernel soberano     | ✅    | ✅         | ✅         | ✅       | ✅       |
| Contratos explícitos| ⚠️    | ⚠️         | ✅         | ✅       | ✅       |
| Runtime híbrido     | ✅    | ⚠️         | ❌         | ✅       | ✅       |
| Terminais claros    | ✅    | ✅         | ⚠️         | ⚠️       | ✅       |
| Governança          | ⚠️    | ⚠️         | ✅         | ✅       | 🟡       |
| Observabilidade     | ⚠️    | ⚠️         | ✅         | ✅       | 🟡       |
| Autonomia           | ⚠️    | ❌         | ✅         | ✅       | 🟡       |
| Evolução controlada | ⚠️    | ⚠️         | ✅         | ✅       | 🟡       |
| Ecossistema         | ⚠️    | ✅         | ✅         | ✅       | 🟡       |

✅ formalizado e em uso | ⚠️ existe mas não explícito | 🟡 base pronta, não formalizada em código | ❌ ausente

---

## Conclusão

ChefIApp está arquitecturalmente mais próximo de ServiceNow/Palantir do que de um POS comum. As camadas 1–4 estão fechadas; 5–8 têm contrato e base pronta, enforcement quando a dor aparecer; 9 deliberadamente fechado (scope).

**Referências:** [CORE_STATE](./CORE_STATE.md) (estado do núcleo), [CORE_CONTRACT_INDEX](./CORE_CONTRACT_INDEX.md) (contratos), [SCOPE_FREEZE](../strategy/SCOPE_FREEZE.md) (escopo vs. arquitectura).
