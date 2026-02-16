# Contrato: KDS — Layout e UX (scroll, rodapé, tabs)

**Propósito:** Definir regras de layout e UX do KDS para que a lista de pedidos ocupe todo o espaço útil, sem barra preta no rodapé, e com scroll apenas na área de pedidos. Fonte de verdade para implementação e anti-regressão.

**Referências:** [CORE_KDS_CONTRACT.md](../architecture/CORE_KDS_CONTRACT.md), [OPERATIONAL_SURFACES_CONTRACT.md](./OPERATIONAL_SURFACES_CONTRACT.md).

---

## 1. Lei do layout

- O KDS vive dentro de **OperationalFullscreenWrapper** (height 100vh, flex column, overflow hidden). O conteúdo do KDS **não** deve criar altura extra que provoque faixa preta em baixo.
- **Um único scroll:** apenas a área da lista de pedidos faz scroll vertical. Cabeçalho, tabs (Todas / Cozinha / Bar) e painel de tarefas (quando visível) são fixos.
- **Sem barra preta:** a área scrollável deve usar `flex: 1` e `minHeight: 0` para ocupar todo o espaço restante abaixo do cabeçalho e tabs; não usar `maxHeight: calc(100vh - Npx)` fixo.

---

## 2. Estrutura obrigatória

| Camada | Regra | Onde está |
|--------|--------|------------|
| Wrapper (página) | OperationalFullscreenWrapper: height 100vh, display flex, flexDirection column, overflow hidden | `OperationalFullscreenWrapper.tsx` |
| Root do KDS | display flex, flexDirection column, height 100%, minHeight 0, flex 1; padding e boxSizing border-box | `KDSMinimal.tsx` — div principal |
| Cabeçalho + tabs | flexShrink 0 | Bloco superior em KDSMinimal |
| TaskPanel (Cozinha) | flexShrink 0, quando activeTab === "KITCHEN" | TaskPanel em KDSMinimal |
| Área da lista | flex 1, minHeight 0, overflowY auto, scrollbarGutter stable | div que contém activeOnly.map (lista de pedidos) |

---

## 3. Tabs (Todas / Cozinha / Bar)

- Três tabs: **Todas**, **Cozinha**, **Bar**. Filtro de pedidos por estação (ALL / KITCHEN / BAR) conforme [KDS_BAR_COZINHA_STATION_CONTRACT.md](./KDS_BAR_COZINHA_STATION_CONTRACT.md).
- Ao trocar de tab, atualizar `stationFilter` e `activeTab` em conjunto; a lista mostra apenas pedidos que tenham pelo menos um item da estação selecionada.

---

## 4. Lista de pedidos

- Pedidos ativos: excluir READY/CLOSED da lista principal (filtro `activeOnly`) para não poluir com pedidos já concluídos. Mensagem explícita quando há pedidos mas nenhum em preparação: "Nenhum pedido em preparação (todos prontos ou fechados)".
- Cada card de pedido mostra secções **COZINHA** e **BAR** (sempre as duas; 0 items quando não houver), conforme station dos itens.

---

## 5. Anti-regressão

- **Não** voltar a usar no root do KDS: `minHeight: "100vh"` sem flex column e sem flex 1 na área de lista.
- **Não** voltar a usar na área de lista: `maxHeight: "calc(100vh - 320px)"` ou valor fixo em px; usar sempre `flex: 1`, `minHeight: 0`, `overflowY: "auto"`.
- Qualquer alteração ao layout do KDS deve manter: um único scroll na lista; zero faixa preta no rodapé.

---

## 6. Ficheiros de enforcement

| Contrato | Ficheiro |
|----------|----------|
| Layout root + scroll | `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx` |
| Wrapper fullscreen | `merchant-portal/src/components/operational/OperationalFullscreenWrapper.tsx` |
| Rota KDS | `merchant-portal/src/routes/OperationalRoutes.tsx` (path `/op/kds`) |

---

## 7. OriginBadge e log (anti-regressão)

- **OriginBadge:** Em cada card de pedido deve mostrar origem e quem fez. Props obrigatórias: `createdByRole` (waiter, manager, owner, kitchen) e `tableNumber` (mesa). Mapeamento: GERENTE/MANAGER, DONO/OWNER, COZINHA/KITCHEN com ícone e cor distintos. Não remover estas props nem o mapeamento; ver `OriginBadge.tsx`.
- **Log em DEV:** Só logar quando o **número de pedidos** mudar (ordersRef.current !== ordersWithItems.length após loadOrders). Não logar em cada polling para evitar spam na consola. Manter `if (import.meta.env.DEV)` e a condição `prevCount !== ordersWithItems.length`.

---

Última atualização: 2026-02 — Contrato de layout KDS (scroll, rodapé, tabs, OriginBadge, log). Não alterar sem atualizar este documento.
