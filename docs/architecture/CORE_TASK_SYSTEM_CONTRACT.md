# Contrato do Sistema de Tarefas — Core

## Lei do sistema

**Tarefas são criadas na Web ou no AppStaff (gerente/dono). Funcionários apenas executam. Tarefas podem estar ligadas a pedidos ou ser operacionais (ex.: limpeza). Aparecem no AppStaff e no KDS (se relacionadas à cozinha). SLA e prioridade são definidos pelo Core.**

Este documento é contrato formal do Core. Define o **sistema** de tarefas; o subcontrato [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md) detalha o que o AppStaff faz (mostrar, confirmar, executar, reportar).

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Quem cria tarefas

| Origem | Quem | Onde |
|--------|------|------|
| Web Operacional (Command Center) | Gerente / Dono | Painel Tarefas: criar, delegar por cargo. |
| AppStaff | Gerente / Dono | Terminal mobile: criar, delegar. |
| Core / sistema | Jobs, regras, integrações | Backend (ex.: tarefa automática por evento). |

**Funcionário (staff)** não cria tarefas. Apenas recebe, executa e reporta.

---

## 2. Tipos de tarefa

| Tipo | Exemplo | Onde aparece |
|------|---------|---------------|
| **Ligada a pedido** | "Entregar pedido #12 à mesa 5" | AppStaff, KDS (fila cozinha). |
| **Operacional** | "Limpar fritadeira", "Repor gelo" | AppStaff; KDS se for tarefa de cozinha. |

O Core classifica e encaminha. Terminais mostram o que o Core expõe para o seu contexto (restaurante, cargo, equipa).

---

## 3. Onde as tarefas aparecem

| Terminal | Papel |
|----------|--------|
| **AppStaff** | Lista de tarefas atribuídas; executar, confirmar, reportar. Mini KDS (leitura) pode mostrar fila relacionada. |
| **KDS** | Tarefas de cozinha (ligadas a pedidos ou operacionais de cozinha); SLA; confirmação de preparo / conclusão. |
| **Web (Command Center)** | Criar, delegar, ver execução (estado por tarefa/equipa). |

Nenhum terminal inventa tarefas nem regras de prioridade/SLA. Core manda.

---

## 4. SLA e prioridade

- **Definidos pelo Core.** UI (Web, AppStaff, KDS) mostram prazos e prioridade; não calculam nem alteram.
- **Atraso / incidente:** Regras do Core (ex.: CORE_OPERATIONAL_GOVERNANCE_CONTRACT, CORE_TIME_GOVERNANCE_CONTRACT) definem quando uma tarefa atrasada vira alerta ou incidente.

---

## 5. Relação KDS ⇄ Tarefas

- **KDS não cria pedidos.** KDS mostra pedidos e tarefas de cozinha; confirma estados (em preparo, pronto, etc.).
- **Tarefa criada na Web (ex.: "Limpar fritadeira")** pode aparecer no KDS como tarefa operacional; SLA controlado pelo Core; confirmação no KDS ou no AppStaff.
- Contrato cruzado: [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md), [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md).

---

## 6. Relação AppStaff ⇄ Tarefas

- AppStaff mostra tarefas atribuídas; executa e reporta. Não cria (exceto gerente/dono).
- Mini KDS / Mini TPV no AppStaff = leitura (e confirmação simples se o Core permitir). Contrato: [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md).

---

## 7. Garantia

- Tarefas têm origem única: Core (ou criação via Web/AppStaff por gerente/dono, validada pelo Core).
- Nenhum terminal fala directo com outro para tarefas; todos passam pelo Core.
- SLA e prioridade = verdade do Core; terminais obedecem.
