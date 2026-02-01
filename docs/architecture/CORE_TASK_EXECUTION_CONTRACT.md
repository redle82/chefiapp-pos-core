# Contrato de Tarefas e Dever — AppStaff

## Lei do sistema

**Tarefa não é “todo list”. É acto operacional com peso.**

Este documento é subcontrato do [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md). No ChefIApp, tarefa é ordem com responsável, prazo e impacto. O AppStaff mostra, confirma, executa e reporta. Não inventa tarefas nem regras.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. O que o contrato define

| Aspecto               | Quem define                             | AppStaff                          |
| --------------------- | --------------------------------------- | --------------------------------- |
| Quem cria             | Gerente / dono / sistema (ex.: IA)      | —                                 |
| Quem recebe           | Staff (individual ou equipa)            | Mostra “a mim” / “à equipa”       |
| Prazo                 | Core / criador                          | Mostra; alerta se Core indicar    |
| Impacto               | XP, alerta, penalidade (regras do Core) | Mostra consequência se Core expor |
| Quando vira incidente | Regras do Core (ex.: atraso crítico)    | Mostra estado; não decide         |

---

## 2. O que o AppStaff faz

- **Mostra** tarefas atribuídas (pendentes, em execução, concluídas conforme estado do Core).
- **Confirma** recepção ou início (quando o Core permitir).
- **Executa** acções permitidas (ex.: marcar em progresso, concluir, adicionar nota curta).
- **Reporta** conclusão ou bloqueio ao Core; não calcula impacto (XP, penalidade).

---

## 3. O que o AppStaff não faz

- Criar tarefas (criação é backoffice / gerente / sistema).
- Atribuir tarefas a outros (gerente / dono).
- Calcular prazos ou “quando vira incidente” (Core decide e pode expor estado).
- Definir impacto (XP, alerta, penalidade); apenas mostra se o Core enviar.

---

## 4. Estados de tarefa (consumidos do Core)

Estados típicos (nomes podem variar; fonte = Core):

- **Pendente** — Atribuída, não iniciada.
- **Em execução** — Iniciada pelo staff.
- **Concluída** — Finalizada; Core regista e pode aplicar impacto (XP, etc.).
- **Bloqueada / Incidente** — Core marca; AppStaff mostra e pode permitir acções limitadas (ex.: comentário, pedir ajuda).

O AppStaff não inventa estados; consome o que o Core expor.

---

## 5. UI mínima

- Lista clara de tarefas (prioridade, prazo, título).
- Uma tarefa pode ser destacada “agora” (ex.: próxima ou em execução) sem esconder o resto.
- Acções: iniciar, concluir, adicionar nota/comment (se o Core permitir).
- Sem “todo list” genérica: cada item é tarefa operacional com origem no Core.

---

## 6. Comunicação ligada a tarefas

Comentários ou threads ligados a uma tarefa (ex.: “pedir ajuda”, “bloqueio”) são parte do [CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md](./CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md): contextual, escasso, orientado a eventos. Não é chat livre.

---

## 7. Resumo

- Tarefa = acto operacional com peso; Core define quem cria, quem recebe, prazo, impacto.
- AppStaff mostra, confirma, executa, reporta; não cria, não atribui, não calcula impacto.
- Estados e acções vêm do Core; UI mínima com lista clara e acções permitidas.
