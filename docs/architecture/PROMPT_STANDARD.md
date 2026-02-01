# Template de Prompt Padrão — Nunca Perder Decisão

**Uso:** Copiar o bloco **Context** (e, se aplicável, a linha **Task**) para o início de todo o prompt que altere Core, AppStaff, UI operacional, tarefas, turno, finanças ou comunicação. Assim o Cursor usa **arquivos** como memória, não conversa.

---

## Bloco mínimo (copiar para o prompt)

```
Context:
- @docs/architecture/CORE_CONTRACT_INDEX.md (índice de contratos)
- @docs/architecture/CORE_EXECUTION_TOPOLOGY.md (quem executa o quê)
- @docs/architecture/CORE_DECISION_LOG.md (decisões registadas)

Task:
[descrever a tarefa aqui]
```

---

## Se a tarefa tocar em AppStaff (/garcom, check-in, tarefas, métricas, finanças)

```
Context:
- @docs/architecture/CORE_CONTRACT_INDEX.md
- @docs/architecture/CORE_APPSTAFF_CONTRACT.md
- @docs/architecture/APPSTAFF_AUDIT_VS_CONTRACTS.md (estado actual vs contratos)
- @docs/architecture/CORE_DECISION_LOG.md

Task:
[descrever a tarefa aqui]
```

---

## Se a tarefa tocar em UI operacional (Dashboard, Shell, painéis)

```
Context:
- @docs/architecture/CORE_OPERATIONAL_UI_CONTRACT.md
- @docs/architecture/CORE_CONTRACT_INDEX.md
- @docs/architecture/CORE_DECISION_LOG.md

Task:
[descrever a tarefa aqui]
```

---

## Se a tarefa tocar em UI + design / auditoria de bugs visuais

(OUC + política de design + cobertura — evita regressão conceitual e “implementar fora da lei”.)

```
Context:
- @docs/architecture/CORE_OPERATIONAL_UI_CONTRACT.md
- @docs/architecture/CORE_DESIGN_IMPLEMENTATION_POLICY.md
- @docs/architecture/CORE_CONTRACT_COVERAGE.md (check before assuming behavior)

Task:
[descrever a tarefa aqui]
```

---

## Se a tarefa for unificação total do Design System

(Auditoria de todas as superfícies de UI; Coverage Map; refactor para core-design-system.)

**Usar o prompt completo:** [PROMPT_DESIGN_SYSTEM_UNIFICATION.md](./PROMPT_DESIGN_SYSTEM_UNIFICATION.md) — copiar e colar no Cursor.

Context mínimo: CORE_DESIGN_SYSTEM_CONTRACT.md, DESIGN_SYSTEM_COVERAGE.md, DESIGN_SYSTEM_ENFORCEMENT_LOOP.md, core-design-system/README.md.

---

## Se a tarefa tocar em quem cria/executa (Kernel, readers, writers, tarefas)

```
Context:
- @docs/architecture/CORE_EXECUTION_TOPOLOGY.md
- @docs/architecture/CORE_TASK_EXECUTION_CONTRACT.md (se for tarefas)
- @docs/architecture/CORE_CONTRACT_INDEX.md
- @docs/architecture/CORE_DECISION_LOG.md

Task:
[descrever a tarefa aqui]
```

---

## Regra

**Nada importante fica só em conversa.**
Se decidir algo que afecta contrato ou topologia → actualizar CORE_DECISION_LOG.md (e, se for novo contrato, CORE_CONTRACT_INDEX.md).
