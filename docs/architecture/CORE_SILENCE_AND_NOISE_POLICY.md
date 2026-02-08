# Política de Silêncio e Ruído — Core

## Lei do sistema

**O sistema define quando NÃO alertar, NÃO registar em log de incidente e NÃO reagir. Nem tudo é alerta; nem todo erro é falha sistémica. O Core governa os limiares; a UI não inventa “alertar sempre” nem “nunca alertar”.**

Este documento é contrato formal no Core. Evita ruído constante, alert fatigue e que ninguém confie no sistema.

---

## 1. Quem manda

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define: quando não alertar (ex.: 1 pedido atrasado), quando alertar (ex.: N pedidos atrasados), quando não registar como incidente (ex.: 1 erro de rede), quando registar (ex.: M falhas em K min). Fonte de verdade dos limiares. |
| **UI / Terminais** | Mostra alertas e estados conforme o Core expõe; não dispara “alerta” ou “erro crítico” por conta própria abaixo do limiar definido. Não esconde acima do limiar. |

---

## 2. Silêncio (quando NÃO reagir)

| Situação | Exemplo | Política |
|----------|---------|----------|
| **Ruído isolado** | 1 pedido atrasado; 1 timeout de reader. | Não alertar; não virar incidente. Pode mostrar no UI (ex.: métrica) sem disparar notificação. |
| **Erro recuperável** | Impressora ocupada; retry com sucesso. | Não alertar; registar se o Core definir (ex.: métrica de saúde). |
| **Limiar não atingido** | N-1 pedidos atrasados quando o limiar é N. | Não alertar; mostrar estado (ex.: “X atrasados”) sem alarme. |

---

## 3. Ruído (quando reagir)

| Situação | Exemplo | Política |
|----------|---------|----------|
| **Limiar atingido** | N pedidos atrasados; M falhas em K min. | Alertar conforme definido (notificação, estado “crítico”, log de incidente). |
| **Falha crítica** | Conforme [CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md). | Bloquear ou alertar; não silenciar. |
| **Cegueira prolongada** | Conforme [CORE_SYSTEM_AWARENESS_MODEL.md](./CORE_SYSTEM_AWARENESS_MODEL.md); sem dados há X min. | Alertar ou degradar conforme contrato. |

---

## 4. O que a UI não faz

- Não dispara alerta (toast, notificação, som) para cada erro ou atraso sem regra do Core; respeita limiares.
- Não esconde alerta quando o limiar é atingido (ex.: “não incomodar”); o Core define; a UI obedece.
- Não inventa “sempre notificar” ou “nunca notificar”; a política é do Core.

---

## 5. Relação com outros contratos

- **Falha:** [CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md) — classe crítica dispara reacção; aceitável não dispara alerta.
- **Tempo:** [CORE_TIME_GOVERNANCE_CONTRACT.md](./CORE_TIME_GOVERNANCE_CONTRACT.md) — tempos que viram incidente.
- **Consciência:** [CORE_SYSTEM_AWARENESS_MODEL.md](./CORE_SYSTEM_AWARENESS_MODEL.md) — cegueira e limiares de “sem dados”.

---

## 6. Status

**FECHADO** para definição da política: silêncio vs ruído, quem manda, limiares. Valores concretos (N, M, K) podem evoluir; a lei está definida.
