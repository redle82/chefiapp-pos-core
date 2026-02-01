# Protocolo de Criação de Contratos

**Propósito:** Regras obrigatórias para manter a integridade dos contratos. Nenhum documento referenciado pode ficar em falta; nenhum documento criado pode ficar por indexar.

**Uso:** Antes de referenciar, criar ou alterar qualquer .md em docs/architecture ou docs/contracts.

---

## 1. Regras obrigatórias

| Regra | Descrição |
|-------|------------|
| **Se referenciar, criar e escrever** | Se um documento é referenciado (link ou menção) em CORE_CONTRACT_INDEX, CONTRACT_ENFORCEMENT, CORE_SYSTEM_OVERVIEW ou CORE_CONTROL_PLANE_CONTRACT, esse documento deve existir em disco e ter conteúdo real. |
| **Se criar, indexar** | Se um novo .md é criado em docs/architecture ou docs/contracts, deve ser adicionado a [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) na secção apropriada. |
| **Se for contrato, enforcement** | Se o documento é um contrato (governa comportamento ou autoridade), deve existir uma secção ou entrada correspondente em [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md). |
| **Se for só referência, rotular** | Documentos que são apenas material de referência (não contratos) devem estar na secção explícita "referência" ou "referência técnica" no índice. |
| **Sem placeholders** | Nenhum ficheiro .md pode conter apenas placeholders ou TODOs. Conteúdo real ou o ficheiro não deve existir. |
| **Exceções no Decision Log** | Qualquer exceção (ex.: documento criado mas indexação adiada) deve ser registada em [CORE_DECISION_LOG.md](./CORE_DECISION_LOG.md) com data e motivo. |
| **Criar = criar + escrever** | Ao pedir a criação de um contrato, dar instrução explícita: "Escreve o conteúdo completo em docs/architecture/NOME.md e confirma quando estiver preenchido." Evita ficheiro criado vazio (efeito colateral do assistente: criar ficheiro sem escrever conteúdo na mesma operação). |

---

## 2. Prompt recomendado (evitar ficheiro vazio)

Ao pedir a um assistente (Cursor/LLM) que **crie** um contrato:

- **Forma segura:**  
  *"Escreve o conteúdo completo do contrato diretamente em docs/architecture/NOME_DO_CONTRATO.md e confirma quando estiver preenchido."*
- **Forma a evitar:**  
  *"Cria o ficheiro…" / "Criando o ficheiro, indexando-o…"* — isso pode criar o ficheiro sem conteúdo.

O gate (`contract-gate`) falha em .md vazios; a regra acima evita o artefacto pendente.

---

## 3. Gate de integridade

O repositório aplica um gate (CI e local):

- **scripts/audit-contracts-referenced.sh** — Auditoria de documentos canónicos e vazios.
- **scripts/contract-gate.sh** — Falha se existir .md vazio em docs/architecture ou docs/contracts; falha se algum link referenciado não existir ou estiver vazio; falha se algum .md existente não estiver indexado em CORE_CONTRACT_INDEX.

Comando local: `make contract-gate` ou `npm run contract:gate`.

---

## 4. Referências

- [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) — Índice único; todo o .md em docs/architecture e docs/contracts deve estar listado.
- [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md) — Onde a lei está no código.
- [CORE_DECISION_LOG.md](./CORE_DECISION_LOG.md) — Registo de decisões e exceções.
