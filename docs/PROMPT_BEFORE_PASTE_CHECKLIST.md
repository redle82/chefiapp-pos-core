# Checklist — Antes de colar prompt grande

**Propósito:** Evitar o efeito "referência = Create File" no Cursor. Quando prompts falam de arquitetura formal, contratos futuros ou documentos canónicos, o Cursor pode interpretar referências a ficheiros como pedidos de criação. Este checklist desambigua **decisão** vs **contrato** vs **implementação**.

---

## Regra de ouro

**Nunca misturar no mesmo prompt:**

- ❌ "criar contrato"
- ❌ "referenciar contrato"
- ❌ "implementar contrato"

**Faz em 3 fases separadas.**

---

## Antes de colar o prompt

- [ ] **Separei decisão de ficheiro?**  
  Decisão = conceito, sem path nem `.md`. Ex.: "Vamos definir conceitualmente o Bootstrap Kernel" (sem mencionar `BOOTSTRAP_KERNEL.md`).

- [ ] **Se quero um documento novo, vou pedir criação explícita depois?**  
  Fase 1 = decisão. Fase 2 = um único prompt: "Create file: `docs/architecture/FOO.md` com conteúdo: [texto]".

- [ ] **Só referencio ficheiros que já existem no disco?**  
  Se menciono `BOOTSTRAP_KERNEL.md` ou `CORE_CONTROL_PLANE_CONTRACT.md`, confirmei com `ls` ou script de auditoria que o ficheiro existe.

- [ ] **Evito lista longa de .md num único prompt?**  
  Listas de "contratos a criar" sem paths explícitos e conteúdo geram ambiguidade. Prefiro: um contrato por prompt de criação.

---

## As 3 fases (padrão correcto)

| Fase | Objetivo | O que fazer | O que NÃO fazer |
|------|----------|--------------|-----------------|
| **1 — DECISÃO** | Definir conceito | Falar do conceito (Bootstrap, Control Plane, etc.) sem path, sem `.md`. | Mencionar `FOO.md` ou "criar contrato FOO". |
| **2 — CONTRATO** | Criar o ficheiro | Um prompt por ficheiro: "Create file: `docs/architecture/FOO.md`" + conteúdo completo ou esqueleto. | Misturar com "e agora implementa" ou "referencia isto ali". |
| **3 — ENFORCEMENT / IMPLEMENTAÇÃO** | Código ou referências | "Implementa o que está em `FOO.md`" ou "Garante que X respeita `FOO.md`". Só depois do ficheiro existir. | Referenciar documentos que ainda não existem. |

---

## Se aparecer "Create File" no Cursor

- **Não clicar por impulso.** Pode ser apenas uma referência no texto a um ficheiro que nunca existiu.
- **Auditar:** `find . -type f -size 0` (raiz do repo, excl. node_modules) para ficheiros vazios; script `scripts/audit-contracts-referenced.sh` para referenciados vs existentes.
- **Criar conscientemente:** Um documento por vez, com path explícito e conteúdo, e commit separado (ex.: `docs: add bootstrap and control plane contracts`).

---

## Resumo

- O Cursor **não** cria ficheiros sozinho; "Create File" aparece quando **abres/clicas** algo que foi **referenciado** mas **não existe**.
- O problema é **semântico**: misturar decisão + contrato + implementação no mesmo prompt.
- **Solução:** 3 fases, um contrato por prompt de criação, referenciar só o que já existe.

Documentos relacionados: [CORE_CONTRACT_INDEX.md](./architecture/CORE_CONTRACT_INDEX.md), [CORE_SYSTEM_OVERVIEW.md](./architecture/CORE_SYSTEM_OVERVIEW.md). Script de auditoria: `scripts/audit-contracts-referenced.sh`.
