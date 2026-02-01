# Regras de Arquitetura Viva — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md)  
**Propósito:** Como usar o baseline e o roadmap como regra viva; a arquitectura comanda o produto.

---

## Princípio

Nada entra no sistema sem referenciar o roadmap. Toda a nova feature indica qual GAP fecha (ou qual novo GAP cria). A arquitectura passa a mandar no produto.

---

## Regras (curtas e práticas)

### 1. Antes de iniciar uma nova feature ou doc

- Consultar [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) e [CHECKLIST_FECHO_GAPS.md](./CHECKLIST_FECHO_GAPS.md).
- Perguntar: **Esta entrega fecha algum GAP existente?** Se sim, anotar o GAP (ex.: T50-1, GDPR_MAPPING). Se não, perguntar: **Criamos um novo GAP?** Se sim, registar no roadmap/checklist e na secção adequada do Livro.

### 2. Em PRs, issues e tarefas

- Incluir, quando aplicável, a referência ao GAP (ex.: “Fecha GAP T50-1 — GDPR_MAPPING” ou “Especificação para AUDIT_LOG_SPEC (T40-4)”).
- Evita trabalho solto e permite rastrear progresso no [CHECKLIST_FECHO_GAPS.md](./CHECKLIST_FECHO_GAPS.md).

### 3. Prioridade de execução

- Seguir a ordem do roadmap: **50 Compliance → 40 Security → 30 Data → 20 Domains → 00 Vision → 10–11 Arch → 60 Ops → 70 Product → 80 Testing.**
- Dentro da Onda 1, usar [ONDA_1_TAREFAS_30_DIAS.md](./ONDA_1_TAREFAS_30_DIAS.md) como backlog.

### 4. Alterações ao Livro (baseline v2026.1)

- Qualquer alteração ao conteúdo do Livro (novos docs canónicos, mudança de decisão) deve ser referenciada no [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md).
- Mudanças estruturais = nova versão do baseline ou changelog (ex.: v2026.2).

### 5. Distinção “documentação” vs “sistema”

- **Documentação:** GAP fechado quando o doc existe, está no índice e foi revisto.
- **Sistema:** GAP que exige implementação (export, DSR, audit log, SLO) só está fechado quando o doc existe **e** a capacidade está implementada e utilizável. Não fingir que “está escrito” = “está implementado”.

---

## Resumo em uma frase

**Cada entrega (doc ou código) liga-se a um GAP do roadmap; o checklist e o índice do Livro são a prova.**

---

**Referências:** [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) · [CHECKLIST_FECHO_GAPS.md](./CHECKLIST_FECHO_GAPS.md) · [ONDA_1_TAREFAS_30_DIAS.md](./ONDA_1_TAREFAS_30_DIAS.md).
