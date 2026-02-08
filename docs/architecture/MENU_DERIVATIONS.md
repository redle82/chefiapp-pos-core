# Menu Derivações — Derivação operacional do Menu

> **Propósito:** Definir **o que cada núcleo pode derivar** a partir do Menu, o que é derivado vs copiado, snapshot vs live, e o que **nunca** pode ser recalculado fora do Menu. Fecha o sistema contra divergência silenciosa, cálculos paralelos, "ajustes locais" e bugs financeiros fantasmas.

**Subordinado a:** [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md). Este documento **não altera** a Interaction Matrix; apenas explicita as regras de derivação permitidas por consumidor.

---

## 1. Princípios

- **Derivado ≠ copiado:** Derivado = obtido por consulta ao Menu no momento do uso (snapshot ou join). Copiado = valor persistido noutra tabela como "cópia do menu" sem garantia de sincronia — **proibido** como fonte de verdade para preço, nome de venda ou disponibilidade.
- **Snapshot vs live:** Snapshot = valor fixo no momento do evento (ex.: linha de pedido guarda `price_snapshot`, `name_snapshot`). Live = leitura actual do Menu (ex.: TPV mostra preço actual). Pedidos e linhas financeiras usam **sempre** snapshot; terminais de venda e listagens podem usar live para exibição, mas a **decisão de cobrar** usa snapshot no momento da criação do pedido.
- **Nunca recalculado fora do Menu:** Preço de venda, nome comercial do item, disponibilidade para venda e `product_id` canónico **não** são calculados nem decididos por TPV, KDS, Stock, Relatórios nem integrações. São **consultados** ao Menu (ou a eventos/snapshots que o Menu autorizou).

---

## 2. O que cada núcleo pode derivar

| Núcleo                                            | O que deriva do Menu                                                                                                                                     | Forma                                                                                                   | Proibido                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **TPV**                                           | Preço, nome, `product_id`, disponibilidade (para exibição). No momento de criar pedido: **snapshot** de preço + `product_id` + nome na linha.            | Snapshot por evento (criação de pedido); leitura live para carrinho/listagem.                           | Alterar preço localmente; inventar `product_id`; guardar "cópia" de preço fora da linha de pedido. |
| **KDS**                                           | Nome, `product_id`, flags operacionais (estação, tempo, fluxo). **Sem preço.**                                                                           | Leitura live ou snapshot por ordem; só identificação e encaminhamento.                                  | Usar preço no KDS; decidir disponibilidade.                                                        |
| **QR / Web pública**                              | Catálogo visível: nome, preço, descrição (se existir). Só quando MenuState = LIVE.                                                                       | Leitura live, read-only.                                                                                | Cache como autoridade; mostrar menu quando não LIVE; alterar preço ou nome na exibição.            |
| **Stock / Inventory**                             | Consumo por `product_id` (receitas, ingredientes). Quantidades e regras de dedução.                                                                      | Referência canónica `product_id` + dados de consumo; preço **não** é derivado aqui para venda.          | Calcular preço de venda; inventar produto.                                                         |
| **Tasks**                                         | Referência simbólica ao item (ex.: "preparar item X"). `product_id` como chave, sem preço.                                                               | Referência para tarefas dependentes de itens/estações.                                                  | Usar Tasks para decidir preço ou disponibilidade de venda.                                         |
| **Relatórios**                                    | Receita, margem, IVA, "o que vendeu" — **sempre** via join com `product_id` (e snapshot de preço nas linhas de pedido). Nunca "preço médio recalculado". | Join `gm_order_items` / eventos com Menu por `product_id`; totais a partir de snapshots já persistidos. | Recalcular preço de venda a partir de outra fonte; agregar sem `product_id`.                       |
| **Integrações externas** (Uber Eats, Glovo, etc.) | Export do catálogo: nome, preço, `product_id`.                                                                                                           | Read-only export; sincronização sob controle do Menu/publicação.                                        | Integração alterar preço ou nome no Menu; usar integração como fonte de verdade.                   |

---

## 3. Derivado vs copiado

- **Derivado (permitido):** Valor obtido no momento da consulta ou no momento do evento e guardado como parte do evento (ex.: `price_snapshot` em `gm_order_items`). A verdade continua a ser o Menu; o snapshot é **imutável** para esse evento.
- **Copiado (proibido como verdade):** Tabela ou cache que "replica" o menu para "acelerar" ou "desacoplar" e que depois é usado para decisões de preço, nome ou disponibilidade. Qualquer lógica que diga "usa este valor em vez de consultar o Menu" para preço/nome/disponibilidade é violação.

---

## 4. Snapshot vs live

| Uso                              | Snapshot                                                            | Live                                     |
| -------------------------------- | ------------------------------------------------------------------- | ---------------------------------------- |
| **Criar linha de pedido**        | ✅ Preço, nome, `product_id` fixados no momento da criação.         | ❌                                       |
| **Exibir carrinho no TPV**       | Opcional (pode usar live para mostrar; ao submeter, gera snapshot). | ✅ Leitura actual do Menu.               |
| **KDS / Painel pedidos prontos** | ✅ Linha já tem nome/preço do momento do pedido.                    | ❌ Não recalcular.                       |
| **Relatórios financeiros**       | ✅ Totais a partir de `gm_order_items` e snapshots.                 | ❌                                       |
| **QR / Web**                     | ❌                                                                  | ✅ Mostra catálogo actual (quando LIVE). |

---

## 5. O que nunca pode ser recalculado fora do Menu

- **Preço de venda** de um item (centavos, IVA, margem de venda).
- **Nome comercial** do item usado em linhas de pedido ou em facturação.
- **Disponibilidade para venda** (se o item pode aparecer no TPV/QR).
- **Identificador canónico** do produto (`product_id`): atribuído pelo Menu; pedidos e relatórios referenciam, não inventam.

TPV, KDS, Stock, Tasks, Relatórios e integrações **consultam** ou **fixam snapshot**; não **calculam** nem **decidem** esses valores.

---

## 6. Referências

| Documento                                                | Uso                                                        |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md)         | Contrato arterial; Interaction Matrix; quem fala com quem. |
| [MENU_OPERATIONAL_STATE.md](./MENU_OPERATIONAL_STATE.md) | Estado operacional (EMPTY → LIVE); quem bloqueia o quê.    |
| [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)       | Índice.                                                    |
