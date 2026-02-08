# Modelo de Falha — Core

## Lei do sistema

**A falha é cidadã de primeira classe. O Core define o que é falha aceitável, o que é crítica, e o que acontece automaticamente quando algo falha. A UI não inventa tratamento nem esconde falha sem regra.**

Este documento é contrato formal no Core. Sistemas grandes partem do fracasso; este modelo evita que toda falha vire “bug” e que cada erro vire exceção ad-hoc.

---

## 1. Quem manda

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define: classes de falha (aceitável, degradação, crítica); o que acontece em cada caso (retry, fila, bloquear, alertar); fonte de verdade do estado de falha. |
| **UI / Terminais** | Mostra estado de falha conforme o Core expõe; não inventa “ignorar” ou “repetir para sempre” sem regra. Não esconde falha crítica. |

---

## 2. Classes de falha

| Classe | Descrição | Exemplo | Comportamento típico (definido pelo Core) |
|--------|-----------|---------|-------------------------------------------|
| **Aceitável** | Falha esperada, recuperável, sem impacto em verdade ou dinheiro. | Timeout de um reader; impressora ocupada. | Retry com backoff; mostrar “em fila” ou “a repetir”; não bloquear operação principal. |
| **Degradação** | Serviço parcial; sistema continua operável com limitações. | Sem rede; fila local activa. | Seguir [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md); mostrar estado claro ao humano; não fingir normalidade. |
| **Crítica** | Impacto em verdade, dinheiro ou segurança. Requer decisão ou intervenção. | Falha de persistência; inconsistência de dados; falha de autenticação em operação sensível. | Bloquear acção ou fluxo afectado; registar; alertar conforme [CORE_SILENCE_AND_NOISE_POLICY.md](./CORE_SILENCE_AND_NOISE_POLICY.md) (quando existir); não continuar “como se nada fosse”. |

A **UI** não reclassifica falha por conta própria (ex.: tratar crítica como aceitável para “não assustar”). O Core (ou contrato) classifica; a UI obedece.

---

## 3. O que acontece automaticamente

- **Retry / backoff:** Quando, quantas vezes, com que intervalo — definido pelo Core ou por contrato (ex.: readers com TTL e retry limitado).
- **Fila:** O que vai para fila em caso de falha (ex.: impressão, escrita offline) segue [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md) e [CORE_PRINT_CONTRACT.md](./CORE_PRINT_CONTRACT.md).
- **Bloquear:** Em falha crítica, o Core (ou camada que o implementa) bloqueia a acção ou o fluxo; a UI mostra estado e, se aplicável, mensagem definida pelo Core.
- **Alertar:** O que dispara alerta (ex.: N falhas em M minutos, falha crítica) será governado por contrato de silêncio/ruído quando existir; até lá, falha crítica deve ser visível (log, estado, ou mensagem) e não silenciada.

---

## 4. O que a UI não faz

- Não trata falha crítica como “só um erro” e continua o fluxo como se nada tivesse acontecido.
- Não inventa retry infinito sem regra do Core.
- Não esconde falha (ex.: “Tudo bem!” quando não está) para “melhorar UX” sem política explícita.
- Não decide sozinha que “esta falha não importa”; a classificação é do Core.

---

## 5. Relação com outros contratos

- **Offline / degradação:** [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md).
- **Impressão falhada:** [CORE_PRINT_CONTRACT.md](./CORE_PRINT_CONTRACT.md).
- **Silêncio e ruído (quando existir):** [CORE_SILENCE_AND_NOISE_POLICY.md](./CORE_SILENCE_AND_NOISE_POLICY.md) — quando alertar, quando não alertar.

---

## 6. Status

**FECHADO** para definição do modelo: classes de falha, quem manda, o que acontece automaticamente, e o que a UI não faz. Implementação (código que classifica e reage) pode evoluir; a lei está definida.
