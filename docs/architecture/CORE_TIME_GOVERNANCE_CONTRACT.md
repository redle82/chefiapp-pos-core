# Contrato de Governação do Tempo — Core

## Lei do sistema

**O tempo é recurso governado, como memória ou CPU. O Core define tempos máximos de decisão, de espera, o que pode ser ignorado e o que vira incidente. A UI não inventa “urgente” nem “pode esperar” sem regra.**

Este documento é contrato formal no Core. Evita que tudo vire “urgente”, nada seja prioritário de verdade e humanos queimem.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Quem manda

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define: tempo máximo de decisão (ex.: resposta a pedido), tempo máximo de espera (ex.: SLA de pedido), tempo que pode ser ignorado (ex.: 1 atraso), tempo que vira incidente (ex.: N atrasos). |
| **UI / Terminais** | Mostra tempo decorrido, prazos e alertas conforme o Core expõe; não inventa “está urgente” ou “pode esperar” sem regra. |

---

## 2. Tempos governados

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Tempo máximo de decisão** | Janela em que uma acção deve ser tomada ou considerada expirada. | Confirmar pedido em X segundos. |
| **Tempo máximo de espera** | SLA; após o qual o estado muda (ex.: atrasado) ou dispara acção. | Pedido em preparo > N minutos = atrasado. |
| **Tempo ignorável** | Abaixo do qual não se alerta nem se reage. | 1 pedido atrasado ≠ alerta (conforme [CORE_SILENCE_AND_NOISE_POLICY.md](./CORE_SILENCE_AND_NOISE_POLICY.md)). |
| **Tempo que vira incidente** | Limiar a partir do qual se regista, alerta ou bloqueia. | N pedidos atrasados ou M minutos sem resposta do Core. |

O **Core** (ou contrato) define os valores e quem pode alterá-los (ex.: só config). A **UI** não altera SLA nem tempos por conta própria.

---

## 3. O que a UI não faz

- Não define “este pedido está atrasado” sem regra de tempo do Core (ou contrato explícito, ex.: métricas de consciência com 15 min).
- Não inventa prioridade por tempo (“o mais antigo primeiro”) sem regra do Core.
- Não mostra “urgente” ou “pode esperar” sem fonte (Core ou contrato).

---

## 4. Relação com outros contratos

- **Métricas de consciência (atrasos):** [CORE_OPERATIONAL_AWARENESS_CONTRACT.md](./CORE_OPERATIONAL_AWARENESS_CONTRACT.md); tempo de atraso definido por contrato ou Core.
- **Silêncio e ruído:** [CORE_SILENCE_AND_NOISE_POLICY.md](./CORE_SILENCE_AND_NOISE_POLICY.md) — quando tempo dispara alerta.
- **KDS/TPV:** [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md), [CORE_TPV_BEHAVIOUR_CONTRACT.md](./CORE_TPV_BEHAVIOUR_CONTRACT.md); SLA e tempos governados por Core.

---

## 5. Status

**FECHADO** para definição de quem manda e tipos de tempo governado. Valores concretos (N minutos, etc.) podem evoluir; a lei está definida.
