# Hierarquia de Verdade — Core

## Lei do sistema

**O sistema tem várias camadas de verdade. O Core define qual camada vale em cada contexto. A UI mostra a verdade apropriada; não inventa “o estado real” nem resolve conflitos por conta própria.**

Este documento é contrato formal no Core. Evita conflitos de estado, UI “parece errada” e discussões infinitas sobre “qual estado vale”.

---

## 1. Quem manda

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define: verdade instantânea (memória/stream), eventual (persistida), histórica (eventos), percebida (o que o humano vê). Fonte de verdade para resolução de conflitos. |
| **UI / Terminais** | Mostra a camada de verdade que o Core expõe para o contexto (ex.: operacional vs histórico). Não decide “qual estado vale” em conflito. |

---

## 2. Camadas de verdade

| Camada | Descrição | Exemplo |
|--------|-----------|---------|
| **Instantânea** | Estado em memória/stream no momento da leitura. Pode não estar persistido. | Pedido “em preparo” no Repo do Kernel. |
| **Eventual** | Estado persistido; pode ter delay em relação ao instantâneo. | Pedido gravado no EventStore. |
| **Histórica** | Sequência de eventos; “o que aconteceu”. Imutável. | Pedido criado às 14:00; estado alterado às 14:05. |
| **Percebida** | O que o humano vê e interpreta (ex.: “atrasado”, “pronto”). Pode depender de regras (SLA, tempo). | “Este pedido está atrasado” (verdade percebida a partir de tempo + regra). |

O **Core** (ou contrato) define quando usar cada camada (ex.: UI operacional usa instantânea/eventual; relatórios usam histórica). A **UI** não inventa “último estado conhecido” como verdade absoluta sem regra.

---

## 3. Conflitos de estado

- Quando **instantâneo** e **eventual** divergem (ex.: rede caiu antes de persistir), a resolução segue [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md) e [CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md).
- A **UI** não decide “mostrar A ou B” por preferência; mostra o que o Core expõe e, se aplicável, indica “sincronizando” ou “último estado conhecido” conforme contrato.

---

## 4. O que a UI não faz

- Não trata “o que eu tenho em cache” como verdade absoluta sem regra do Core.
- Não resolve conflitos (ex.: merge local) sem política do Core.
- Não mostra “estado real” quando o Core não expõe (ex.: em degradação); mostra estado conhecido e, se aplicável, indica limitação.

---

## 5. Status

**FECHADO** para definição da hierarquia e quem manda. Implementação (quando cada camada é usada, APIs) pode evoluir; a lei está definida.
