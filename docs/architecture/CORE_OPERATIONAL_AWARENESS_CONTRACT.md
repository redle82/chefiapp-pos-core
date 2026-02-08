# Contrato de Consciência Operacional — AppStaff

## Lei do sistema

**O AppStaff não é cego. Deve ter consciência operacional.**

Este documento é subcontrato do [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md). O AppStaff deve mostrar: mini KDS (o que está a acontecer agora), mini TPV (contexto de pedidos) e métricas operacionais — não financeiras completas. Não é “dashboard bonito”; é consciência operacional.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. O que deve existir

| Elemento              | Descrição                                                                         | Fonte                |
| --------------------- | --------------------------------------------------------------------------------- | -------------------- |
| Mini KDS              | Pedidos em cozinha/bar: estado, tempo, prioridade                                 | Core (pedidos, fila) |
| Mini TPV              | Contexto de pedidos (mesas, itens, totais) para quem precisa (ex.: garçom, caixa) | Core (pedidos, TPV)  |
| Métricas operacionais | Pedidos atrasados, fila de cozinha, pressão actual, estado do turno               | Core                 |

Exemplos de métricas **operacionais** (não substituem relatório financeiro):

- Pedidos atrasados (quantidade ou lista resumida).
- Fila de cozinha (ex.: N itens em espera).
- Pressão actual (ex.: indicador de carga).
- Estado do turno (ex.: em turno, tempo decorrido).

---

## 2. O que o AppStaff faz

- **Mostra** mini KDS e mini TPV conforme permissões (papel, função).
- **Mostra** métricas operacionais que o Core expor (atrasos, fila, pressão).
- **Actualiza** em tempo útil (polling, realtime ou híbrido conforme Core).
- **Não** substitui o KDS/TPV completo em ecrã dedicado; é “consciência”, não controlo total.

---

## 3. O que o AppStaff não faz

- Calcular atrasos ou filas (Core calcula e expõe).
- Definir prioridades de pedidos (Core / regras de negócio).
- Mostrar relatório financeiro completo (isso é [CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md](./CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md): visibilidade limitada, não controlo).

---

## 4. Diferença: consciência vs controlo

- **Consciência:** “O que está a acontecer agora?” — pedidos, fila, atrasos, pressão. Ajuda a decidir acção (ex.: priorizar mesa X).
- **Controlo:** Alterar pedidos, cancelar, mudar prioridades, fechar contas. O mini TPV no AppStaff pode permitir acções **limitadas** (ex.: marcar item enviado, abrir mesa) conforme permissões; o contrato de TPV e de papéis define o que é permitido.

O contrato de consciência garante que **todos** (com permissão) veem o mínimo necessário para operar. O contrato de finanças e de tarefas define o que podem **fazer**.

---

## 5. UI mínima

- **Mini KDS:** Lista ou grelha de pedidos activos (estado, tempo decorrido, prioridade). Acções mínimas (ex.: marcar “pronto”) se o Core permitir.
- **Mini TPV:** Mesas/pedidos em aberto; totais; acções básicas (ex.: adicionar item, fechar) conforme papel e [CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md](./CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md).
- **Métricas:** Linha ou bloco resumido (atrasos, fila, pressão) sem virar dashboard completo.

---

## 6. Resumo

- AppStaff tem mini KDS, mini TPV e métricas operacionais; fonte = Core.
- Consciência ≠ controlo; métricas são operacionais, não relatório financeiro completo.
- UI mínima: lista KDS/TPV + resumo de atrasos/fila/pressão.
