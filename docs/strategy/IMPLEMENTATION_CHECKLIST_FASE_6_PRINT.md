# Checklist de Implementação — FASE 6 (Impressão)

**Propósito:** Lista acionável para implementar impressão funcional quando houver cliente real ou ambiente com impressora. Autoridade: [CORE_PRINT_CONTRACT.md](../architecture/CORE_PRINT_CONTRACT.md). Referência: [SCOPE_FREEZE.md](./SCOPE_FREEZE.md) FASE 6.

---

## Princípio (contrato)

**Core manda:** fila, formato (template), retry, timeout, fonte de verdade do que foi enviado.  
**UI/TPV/KDS:** solicita impressão ao Core; mostra estado (enviado, falha, em fila). Não inventa templates nem filas locais.

---

## O que implementar (quando houver cliente/impressora)

| # | Área | O que fazer |
|---|------|-------------|
| 6.1 | **Core — Fila** | Fila de impressão no Core (ex.: tabela ou fila em memória com persistência); pedidos com tipo (comanda, recibo, relatório Z), tenant_id, estado (pending/sent/failed). |
| 6.2 | **Core — API** | Endpoint ou serviço que a UI chama para “pedir impressão” (ex.: `requestPrint({ type, orderId?, payload })`); Core valida (turno, permissões) e enfileira ou rejeita. |
| 6.3 | **Core — Templates** | Templates de impressão definidos no Core ou em configuração governada pelo Core (comanda, recibo, Z); UI não define formato. |
| 6.4 | **Core — Retry / falha** | Regras de retry e timeout (ex.: CORE_FAILURE_MODEL); registar falha (dispositivo indisponível, timeout, papel); decisão degradação (guardar para depois vs bloquear) no Core. |
| 6.5 | **Driver** | Ligar fila ao driver real: hoje existe `FiscalPrinter` (browser/thermal/fiscal); quando houver impressora térmica/fiscal, integrar driver com a fila do Core. |
| 6.6 | **UI** | TPV/KDS: botão “Imprimir comanda” (etc.) chama API do Core; mostrar estado (enviado, em fila, falha); opção “Reimprimir” apenas como novo pedido ao Core. |

---

## Estado actual

| Item | Estado |
|------|--------|
| CORE_PRINT_CONTRACT | ✅ Definido (quem manda / quem obedece). |
| FiscalPrinter (browser) | ✅ Existe; impressão via `window.print` para kitchen ticket. |
| Fila no Core | ❌ A implementar quando houver cliente. |
| API de pedido de impressão | ❌ A implementar quando houver cliente. |
| UI pede ao Core e mostra estado | ❌ A implementar quando houver cliente. |

---

## Como usar

1. Quando existir cliente real ou ambiente com impressora, executar 6.1–6.6 por ordem.
2. Garantir que a UI nunca define templates nem fila local; tudo via Core.
3. Atualizar [CONTRACT_ENFORCEMENT.md](../architecture/CONTRACT_ENFORCEMENT.md) secção 8 quando driver/fila/API estiverem no código.
