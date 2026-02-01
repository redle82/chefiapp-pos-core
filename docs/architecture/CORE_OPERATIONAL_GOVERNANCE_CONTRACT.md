# Contrato de Governança Operacional Viva — Core

## Lei do sistema

**Quem vê o quê quando algo dá errado, quando vira incidente e quando o sistema se cala é definido por contrato. Não é UI nem feature — é governança operacional viva.**

Este documento é contrato formal no Core. Referência: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md). Sistemas OS-level (Toast, ServiceNow, Palantir) têm esta camada explícita; o ChefIApp passa a tê-la escrita.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Quem vê o quê

| Papel / Terminal | O que vê por defeito | Quando algo dá errado |
|------------------|----------------------|------------------------|
| **Staff (garçom, cozinha)** | Estado do seu contexto (fila, tarefas, mini KDS/TPV). Métricas de atraso/fila conforme [CORE_OPERATIONAL_AWARENESS_CONTRACT](./CORE_OPERATIONAL_AWARENESS_CONTRACT.md). | Alertas e notificações que o Core envia ao terminal (tarefa nova, aviso do gerente). **Não** vê por defeito “incidente” nem log de escalação; vê apenas o que o Core expõe para o seu papel. |
| **Gerente** | Resumo operacional, desvios, métricas de turno. | Alertas que atingem limiar de “atenção gerente” (definido abaixo). Pode ver lista de incidentes abertos e thread de resposta. Primeiro notificado quando o Core decide escalar (conforme §2). |
| **Dono / Owner** | Visão agregada, saúde do sistema, decisões que requerem autoridade. | Incidentes escalados ou que afectem verdade/dinheiro/segurança. Não notificado por ruído isolado; apenas quando a governança define “decisão de dono”. |

**Regra:** O Core é a fonte de verdade de “quem vê o quê”. A UI (AppStaff, Dashboard, etc.) mostra apenas o que o Core expõe para aquele papel. Ninguém altera visibilidade (ex.: “mostrar tudo ao staff”) sem alterar este contrato.

---

## 2. Quando vira incidente

| Condição | Vira incidente? | Quem é notificado primeiro (por defeito) |
|----------|------------------|------------------------------------------|
| **Ruído isolado** (1 atraso, 1 timeout) | Não. Conforme [CORE_SILENCE_AND_NOISE_POLICY](./CORE_SILENCE_AND_NOISE_POLICY.md). | Ninguém. Pode aparecer como métrica sem alarme. |
| **Limiar atingido** (N atrasos, M falhas em K min) | Sim. O Core regista como incidente e dispara alerta conforme política de silêncio/ruído. | Gerente (primeiro). Staff pode ver estado “crítico” ou mensagem contextual se o Core expor. |
| **Falha crítica** (classe critical do [CORE_FAILURE_MODEL](./CORE_FAILURE_MODEL.md)) | Sim. Bloqueio ou alerta imediato; não silenciado. | Conforme severidade: terminal afectado primeiro; gerente se afectar operação; dono se afectar verdade/dinheiro/segurança de forma que o contrato defina escalação. |
| **Tempo que vira incidente** (ex.: SLA de pedido violado) | Sim. Conforme [CORE_TIME_GOVERNANCE_CONTRACT](./CORE_TIME_GOVERNANCE_CONTRACT.md). | Gerente por defeito; dono se o contrato ou configuração definir. |

**Regra:** “Incidente” é um estado governado pelo Core (registado, com possível thread e escalação). A UI não inventa “isto é incidente” nem “isto não é” — o Core classifica e expõe.

---

## 3. Quando o sistema se cala

| Situação | Comportamento | Referência |
|----------|---------------|------------|
| **Ruído isolado** | Não alertar; não registar como incidente; não notificar. Pode mostrar métrica (ex.: “X atrasados”) sem som nem toast. | [CORE_SILENCE_AND_NOISE_POLICY](./CORE_SILENCE_AND_NOISE_POLICY.md) §2. |
| **Limiar não atingido** | Não alertar; mostrar estado sem alarme. | Idem. |
| **Erro recuperável** (retry com sucesso) | Não alertar; registar se o Core definir (ex.: saúde). | Idem. |
| **“Nada a fazer agora”** | O sistema pode expor estado explícito de “silêncio consciente” (ex.: operação normal, sem pontos de atenção). Dashboards não inventam “tudo crítico” nem “tudo verde” sem sinal do Core. | A definir em [CORE_HUMAN_OBSERVABILITY_CONTRACT](./CORE_HUMAN_OBSERVABILITY_CONTRACT.md) quando existir. |

**Regra:** O Core define quando **não** notificar e quando **não** virar incidente. A UI não dispara alerta abaixo do limiar; não esconde acima do limiar.

---

## 4. Resumo (mapeamento explícito)

- **Quem vê alertas:** Staff vê o que o Core envia ao seu terminal (tarefas, avisos contextuais). Gerente vê alertas que atingem limiar e lista de incidentes. Dono vê o que for escalado ou definido por contrato/configuração.
- **Quando vira incidente:** Limiar atingido (N/M/K), falha crítica, ou tempo que vira incidente (SLA). Core regista e expõe; UI não inventa.
- **Quando o sistema se cala:** Ruído isolado, limiar não atingido, erro recuperável. Política de silêncio é do Core; UI obedece.

---

## 5. Relação com outros contratos

| Contrato | Uso |
|----------|-----|
| [CORE_FAILURE_MODEL](./CORE_FAILURE_MODEL.md) | Classes de falha; falha crítica dispara reacção e pode virar incidente. |
| [CORE_SILENCE_AND_NOISE_POLICY](./CORE_SILENCE_AND_NOISE_POLICY.md) | Quando não alertar / quando alertar; limiares. |
| [CORE_TIME_GOVERNANCE_CONTRACT](./CORE_TIME_GOVERNANCE_CONTRACT.md) | Tempo que vira incidente; SLA. |
| [CORE_OPERATIONAL_COMMUNICATION_CONTRACT](./CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md) | Como alertas e incidentes são mostrados e respondidos no AppStaff (contextual, sem chat livre). |
| [CORE_OPERATIONAL_AWARENESS_CONTRACT](./CORE_OPERATIONAL_AWARENESS_CONTRACT.md) | O que o staff vê no seu contexto (mini KDS, métricas). |

---

## 6. Contratos estruturais futuros (não prioridade agora)

- **CORE_HUMAN_OBSERVABILITY_CONTRACT.md** — O que o humano precisa ver para decidir bem (estado resumido, tensão operacional, “nada a fazer agora”). Referência quando existir.
- **CORE_DECISION_INTELLIGENCE_CONTRACT.md** — Regras que sugerem, automações condicionadas, decisão assistida. Para não virar caos depois; não para agora.

---

## 7. Status

**FECHADO** para definição: quem vê o quê, quando vira incidente, quando o sistema se cala. Valores concretos (N, M, K, “quem é notificado primeiro” por tipo de evento) podem evoluir em configuração ou decisão de produto; a lei está definida. Implementação em código (quem recebe o quê) deve seguir este contrato.
