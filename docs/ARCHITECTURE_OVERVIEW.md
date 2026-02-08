# Visão da Arquitetura — ChefIApp

**Propósito:** Documento canónico único que consolida **AS-IS** (estado atual) e **to-be** (modelo alvo). Entrada para o Livro de Arquitetura (secção 10).  
**Público:** Dev, produto, investidor.  
**Referência:** [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md) · [CHECKLIST_FECHO_GAPS.md](./CHECKLIST_FECHO_GAPS.md)

---

## 1. Resumo em uma frase

**O Core decide (negócio). O Kernel garante (execução). Os contratos autorizam. Os terminais executam.**

O ChefIApp é um **sistema operacional distribuído para restaurantes**: Kernel soberano, Core operacional e terminais especializados (Web Pública, AppStaff, KDS, TPV). Nenhum terminal fala diretamente com outro; todos obedecem ao Core.

---

## 2. AS-IS (estado atual)

O estado real do sistema hoje — rotas, gates, Core, contratos aplicados e riscos — está documentado em:

| Documento | Conteúdo |
|-----------|----------|
| **[ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./architecture/ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md)** | Mapa completo AS-IS: governança, percurso do cliente, gates, Core vs Non-Core, contratos ativos (🟢🟡🔴), riscos, rotas, testes. |
| **[CORE_SYSTEM_OVERVIEW.md](./architecture/CORE_SYSTEM_OVERVIEW.md)** | Modelo mental em 2 páginas: hierarquia (Kernel → Core → Contratos → Terminais), Bootstrap, instalação, tempo/verdade. |

**Frase-guia AS-IS:** *"Landing vende, Portal configura, Operação executa, Core governa."*

- **Camadas:** PUBLIC → AUTH → MANAGEMENT → OPERATIONAL; Core (Docker/PostgREST) como fonte de verdade; boundary (RuntimeReader, RuntimeWriter, DbWriteGate).
- **Gates:** RoleGate, RequireOperational (isPublished); FlowGate desenhado mas não montado; billing no gate pendente.
- **Terminais:** Web (landing, portal, TPV/KDS em browser), AppStaff (mobile conceitual; web /op/staff parcial).

---

## 3. To-be (modelo alvo)

O modelo alvo — Kernel intocável, Core estável mas evolutivo, 4 terminais bem definidos — está formalizado em:

| Documento | Conteúdo |
|-----------|----------|
| **[CORE_SYSTEM_OVERVIEW.md](./architecture/CORE_SYSTEM_OVERVIEW.md)** | Hierarquia real, Kernel vs Core, Bootstrap, instalação como soberania, tempo e verdade (CORE_TRUTH_HIERARCHY, CORE_FAILURE_MODEL). |
| **[CORE_CONTRACT_INDEX.md](./architecture/CORE_CONTRACT_INDEX.md)** | Índice de todos os contratos; lei dos 4 terminais; enforcement. |
| **[ARCHITECTURE_OVERVIEW.md](./architecture/ARCHITECTURE_OVERVIEW.md)** | Blocos soberanos (Public, Identity, Kernel, Tools, Domain, Infra, Observability, Growth); topologia e regras de dependência. |

**Pilha to-be:** Hardware → Docker → **Kernel** → **Core** → Contratos → Terminais.  
**4 terminais:** Web Pública (vende) · AppStaff (trabalha) · KDS (executa cozinha) · TPV (executa caixa).

---

## 4. Consolidação AS-IS vs to-be

| Dimensão | AS-IS | To-be |
|----------|--------|--------|
| **Core** | Docker/PostgREST; boundary no merchant-portal | Idem; Kernel explícito como camada abaixo do Core |
| **Terminais** | Portal único (TPV/KDS em browser); AppStaff web parcial | 4 terminais claros; AppStaff mobile-only |
| **Gates** | RequireOperational (isPublished); billing não aplicado | + Billing gate (past_due/suspended); FlowGate opcional |
| **Offline / falha** | MENU_FALLBACK, OPERATIONAL_UI_RESILIENCE, ErrorBoundary em /op/ | Consolidado em OFFLINE_STRATEGY e EDGE_CASES |
| **Documentação** | ARQUITETURA_GERAL + CORE_SYSTEM_OVERVIEW | Este doc + C4 (Context, Container, Component) + ADRs |

---

## 5. Documentos relacionados

- **Boundary e contextos:** [BOUNDARY_CONTEXTS.md](./architecture/BOUNDARY_CONTEXTS.md)  
- **Offline e fallback:** [OFFLINE_STRATEGY.md](./architecture/OFFLINE_STRATEGY.md)  
- **Edge cases e falha:** [EDGE_CASES.md](./architecture/EDGE_CASES.md)  
- **Diagramas C4:** [C4_CONTEXT.md](./architecture/C4_CONTEXT.md), [C4_CONTAINER.md](./architecture/C4_CONTAINER.md), [C4_COMPONENT.md](./architecture/C4_COMPONENT.md)  
- **Decisões:** [ARCHITECTURE_DECISION_RECORDS.md](./architecture/ARCHITECTURE_DECISION_RECORDS.md) · [CORE_DECISION_LOG.md](./architecture/CORE_DECISION_LOG.md)

---

*Documento vivo. Alterações que mudem Kernel, Core ou terminais devem actualizar ARQUITETURA_GERAL_CHEFIAPP_AS_IS e/ou CORE_SYSTEM_OVERVIEW e este overview.*
