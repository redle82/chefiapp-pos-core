# Índice de todos os MDs — ChefIApp POS Core

**Propósito:** Ponto único para saber onde está cada tipo de documentação. Regra: não referenciar ficheiros que não existem; ver [PROMPT_BEFORE_PASTE_CHECKLIST.md](./PROMPT_BEFORE_PASTE_CHECKLIST.md).

---

## Entradas canónicas

| O quê | Onde |
|-------|------|
| **Documentação geral** | [docs/README.md](./README.md) |
| **Arquitetura e contratos** | [docs/architecture/README.md](./architecture/README.md) |
| **Arquitetura geral AS-IS (mapa de orientação)** | [docs/architecture/ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./architecture/ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) |
| **Diagramas soberanos (Mermaid)** | [docs/architecture/DIAGRAMAS_SOBERANIA_CHEFIAPP.md](./architecture/DIAGRAMAS_SOBERANIA_CHEFIAPP.md) |
| **Caminho do cliente (visão produto)** | [docs/architecture/CAMINHO_DO_CLIENTE.md](./architecture/CAMINHO_DO_CLIENTE.md) |
| **Rotas e contratos (rota → contrato MD)** | [docs/architecture/ROTAS_E_CONTRATOS.md](./architecture/ROTAS_E_CONTRATOS.md) |
| **Índice de contratos** | [docs/architecture/CORE_CONTRACT_INDEX.md](./architecture/CORE_CONTRACT_INDEX.md) |
| **Criação do primeiro restaurante (bootstrap)** | [docs/architecture/RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md](./architecture/RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md) |
| **Seleção de tenant (multi-tenant)** | [docs/architecture/TENANT_SELECTION_CONTRACT.md](./architecture/TENANT_SELECTION_CONTRACT.md) |
| **Gates (fluxo criação e operação)** | [docs/architecture/GATES_FLUXO_CRIACAO_E_OPERACAO.md](./architecture/GATES_FLUXO_CRIACAO_E_OPERACAO.md) |
| **Auditor de mudanças (PR vs eixos soberanos)** | [docs/architecture/AUDITOR_MUDANCAS_SOBERANIA.md](./architecture/AUDITOR_MUDANCAS_SOBERANIA.md) |
| **Plano refatoração boundary (18 ficheiros)** | [docs/architecture/PLANO_REFATORACAO_BOUNDARY_18_FICHEIROS.md](./architecture/PLANO_REFATORACAO_BOUNDARY_18_FICHEIROS.md) |
| **Checklist verificação criação restaurante** | [docs/audit/CHECKLIST_VERIFICACAO_CRIACAO_RESTAURANTE.md](./audit/CHECKLIST_VERIFICACAO_CRIACAO_RESTAURANTE.md) |
| **Contratos em docs/contracts** | [docs/contracts/README.md](./contracts/README.md) |
| **Documentação histórica / portas** | [docs/HISTORICAL_NOTES.md](./HISTORICAL_NOTES.md) |
| **Checklist antes de colar prompt** | [docs/PROMPT_BEFORE_PASTE_CHECKLIST.md](./PROMPT_BEFORE_PASTE_CHECKLIST.md) |

---

## Produto (48h fluxo feliz / piloto)

| O quê | Onde |
|-------|------|
| **Contenção B1 — Cardápio** | [docs/product/B1_MENU_CONTENCAO.md](./product/B1_MENU_CONTENCAO.md) |
| **Contenção B2 — TPV** | [docs/product/B2_TPV_CONTENCAO.md](./product/B2_TPV_CONTENCAO.md) |
| **Contenção B4 — KDS** | [docs/product/B4_KDS_CONTENCAO.md](./product/B4_KDS_CONTENCAO.md) |
| **Checklist fluxo feliz (verificação técnica)** | [docs/product/FLUXO_FELIZ_CHECKLIST.md](./product/FLUXO_FELIZ_CHECKLIST.md) |
| **Validação operacional — Piloto 01** | [docs/product/VALIDACAO_OPERACAO_PILOTO_01.md](./product/VALIDACAO_OPERACAO_PILOTO_01.md) |

---

## Runtime e porta

- **Porta canónica:** 5175 ([CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md)).
- **Caminho do cliente (visão produto):** [CAMINHO_DO_CLIENTE.md](./architecture/CAMINHO_DO_CLIENTE.md) — Landing → Signup → Portal → Billing → Publicar → Operação.
- **Rotas e contratos:** [ROTAS_E_CONTRATOS.md](./architecture/ROTAS_E_CONTRATOS.md) — índice canónico: cada rota → contrato MD.
- **Instalação operacional (TPV/KDS):** [OPERATIONAL_INSTALLATION_CONTRACT.md](./architecture/OPERATIONAL_INSTALLATION_CONTRACT.md), [OPERATIONAL_APP_MODE_CONTRACT.md](./architecture/OPERATIONAL_APP_MODE_CONTRACT.md), [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./architecture/OPERATIONAL_INSTALL_FLOW_CONTRACT.md) — Web App Instalável, Browser App Mode, fluxo (NON-CORE).
- Documentos antigos podem referir 5173; ver [HISTORICAL_NOTES.md](./HISTORICAL_NOTES.md).

---

## Auditoria

- **Referências .md em falta:** `./scripts/audit-md-references.sh`
- **Contratos referenciados vs disco:** `./scripts/audit-contracts-referenced.sh`

Documentos em `audit/`, `archive/`, `pilots/` são históricos; não alterar retroativamente.
