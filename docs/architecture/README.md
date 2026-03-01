# Arquitetura — ChefIApp POS Core

**Entrada canónica** para documentação de arquitetura e contratos.

---

## Onde começar

| Documento                                                                    | Uso                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)                           | **Índice único** de contratos. Em todo prompt que altere UI operacional, AppStaff, tarefas, turno, finanças ou comunicação, referenciar este índice e o contrato específico. |
| [CHEFIAPP_OS_ARCHITECTURE_V1.md](./CHEFIAPP_OS_ARCHITECTURE_V1.md)           | **Contrato de plataforma (v1)**: ChefIApp como Restaurant Operating System — camadas macro, núcleo de runtime (Boot) e fluxo oficial de execução.                            |
| [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md)                         | Modelo mental (2 páginas): hierarquia Kernel → Core → Contratos → Terminais; "O Core decide. O Kernel garante. Os contratos autorizam. Os terminais executam."               |
| [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) | Runtime oficial: **localhost:5175**; rotas oficiais; sem servidor ativo o sistema não existe.                                                                                |

---

## Runtime e rotas (piloto)

- **Porta canónica:** 5175 ([CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md)).
- **Diagrama:** [ROUTES_AND_BOOT_DIAGRAM.md](./ROUTES_AND_BOOT_DIAGRAM.md) — 3 mundos, 5 boot modes.

**Instalação operacional (TPV/KDS, NON-CORE):** Web App Instalável via browser (sem Electron, sem PWA complexo). Contratos: [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md), [OPERATIONAL_APP_MODE_CONTRACT.md](./OPERATIONAL_APP_MODE_CONTRACT.md), [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./OPERATIONAL_INSTALL_FLOW_CONTRACT.md).

Documentos históricos em `docs/` podem referir a porta 5175; ver [HISTORICAL_NOTES.md](../HISTORICAL_NOTES.md).

---

## Regra

**Nada importante fica só em conversa.**
Se foi decidido → entrada no índice ou em CORE_DECISION_LOG.md ou comentário no código.

**Auditoria:** `scripts/audit-contracts-referenced.sh` — referenciados vs existentes.
