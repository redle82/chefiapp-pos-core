# Contrato KDS (Cozinha) — Core

## Lei do sistema

**O KDS é o terminal de consciência da cozinha. O Core manda (estado, prioridade, SLA); o KDS mostra e confirma. Não inventa fila nem prioridade.**

Este documento é contrato formal no Core. Complementa [CORE_OPERATIONAL_AWARENESS_CONTRACT.md](./CORE_OPERATIONAL_AWARENESS_CONTRACT.md) e a topologia de execução.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Quem manda

| Papel        | Responsabilidade                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Core**     | Fonte de verdade: pedidos, estados (OPEN, IN_PREP, READY), prioridade, ordem. Define regras de SLA e atraso.         |
| **KDS (UI)** | Mostra pedidos/itens; confirma acções (ex.: item pronto) via Core; não altera prioridade nem fila por conta própria. |

---

## 2. Prioridade e fila

- **Prioridade** e ordem de apresentação vêm do Core (ou regras expostas pelo Core). O KDS não reordena nem calcula prioridade localmente.
- **Fila** é a projecção que o Core expõe (ex.: readActiveOrders, readOrderItems). O KDS consome; não mantém fila própria.

---

## 3. SLA e atraso

- **SLA** (ex.: atraso > N minutos) é definido pelo Core ou por contrato (ex.: métricas de consciência). O KDS pode mostrar indicadores (atrasado, em tempo) desde que a **fonte** seja o Core.
- Se o Core não expuser SLA explícito, o KDS pode mostrar tempo decorrido; não inventa “está atrasado” sem regra do Core.

---

## 4. Se falhar (rede, Core indisponível)

- Comportamento em falha (mostrar último estado, modo degradado, mensagem) segue [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md) quando aplicável.
- O KDS não inventa “pedidos fantasmas”; em dúvida, mostra estado conhecido ou indica indisponibilidade.

---

## 5. Status

**FECHADO** para comportamento do terminal KDS: quem manda, quem obedece, prioridade/fila/SLA e falha. Implementação (ecrã dedicado, mini KDS no AppStaff) já existe; este contrato formaliza a lei.
