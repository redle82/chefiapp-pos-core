# Contrato de Impressão — Core

## Lei do sistema

**Quem manda na impressão é o Core. O terminal (UI/TPV/KDS) pede e mostra estado; não decide formato nem fila.**

Este documento é contrato formal no Core. Impressão (recibos, relatórios, comandas) é governada por regras explícitas.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Quem manda

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define: quando imprimir, formato (template), fila, retry, timeout. Fonte de verdade do que foi enviado para impressora. |
| **UI / TPV / KDS** | Solicita impressão ao Core; mostra estado (enviado, falha, em fila). Não inventa templates nem filas locais. |

---

## 2. Quando imprime

- Impressão é **disparada** por evento ou acção (ex.: fechar mesa, imprimir comanda, relatório Z).
- O **Core** valida o pedido (quem pode, em que estado do turno/pedido) e enfileira ou rejeita.
- A UI não imprime “por conta própria”; chama API/Core.

---

## 3. Se falhar

- **Core** regista falha (dispositivo indisponível, timeout, papel).
- **UI** mostra estado de falha e, se o contrato permitir, opção “reimprimir” (novo pedido ao Core).
- Comportamento em degradação (guardar para depois, bloquear operação) é definido pelo Core, não pela UI.

---

## 4. O que a UI não faz

- Não define templates de impressão (Core ou configuração governada pelo Core).
- Não mantém fila de impressão local independente do Core.
- Não decide “não imprimir” sem passar pelo Core (ex.: silenciar falha só na UI).

---

## 5. Status

**FECHADO** para definição de autoridade. Implementação (driver, dispositivos, templates) pode evoluir; quem manda e quem obedece está definido.
