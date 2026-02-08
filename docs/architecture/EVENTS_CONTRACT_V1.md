# Contrato de Eventos v1

**Status:** Contrato conceitual v1 (fechável, extensível sem quebrar)  
**Relacionado:** [OWNER_DASHBOARD_WIREFRAME.md](./OWNER_DASHBOARD_WIREFRAME.md), [COGNITIVE_MODES_OWNER_DASHBOARD.md](./COGNITIVE_MODES_OWNER_DASHBOARD.md)

Este documento define o sistema de eventos que alimenta o Owner Dashboard (web e app) e que o Staff App (Operação Viva) produz. Objetivo: acoplamento mínimo entre produtor (Staff) e consumidor (Dashboard), sem inflar UI nem duplicar sinais. Base futura para alertas, IA e automações.

---

## 1. Objetivo do sistema de eventos

- **Uma verdade:** os mesmos eventos nascem na operação (Staff / TPV / KDS / sistema) e são consumidos pelo Owner Dashboard como resumo vivo (feed) e pelos quatro eixos de poder (Dinheiro agora, Motor da operação, Pessoas & disciplina, Risco & tendência).
- **Sem duplicação:** um evento é emitido uma vez; o Dashboard agrega e apresenta conforme o contrato (feed web, feed app, ou só log).
- **Sem ruído:** só entra no feed o que o dono precisa para "10 segundos" — estado do dia e decisão rápida. Detalhe fica em relatórios.

---

## 2. Tipos de evento (lista fechada v1)

| Tipo | Descrição | Eixo de poder principal |
|------|------------|--------------------------|
| **sale** | Venda concluída (mesa, takeaway, canal). | Dinheiro agora |
| **alert** | Alerta operacional ou de negócio (stock baixo, falha, risco). | Risco & tendência |
| **shift** | Abertura/fecho de turno; estado do caixa. | Motor da operação |
| **person** | Presença, check-in/out, tarefa concluída, disciplina. | Pessoas & disciplina |
| **system** | Estado de sistema (TPV ativo, KDS ativo, sincronização). | Motor da operação |

v1 não inclui: eventos de faturação, notificações de terceiros, eventos de IA. Podem ser adicionados em v2 com as mesmas regras de severidade e visibilidade.

---

## 3. Severidade

| Severidade | Uso | Exemplo |
|------------|-----|---------|
| **INFO** | Contexto; não exige ação. | "Venda concluída — Mesa 3", "Turno aberto". |
| **ATTENTION** | Requer consciência; ação opcional. | "Stock baixo: Azeite", "Pedidos em fila: 5". |
| **RISK** | Exige decisão ou ação. | "Stock crítico: Leite", "Turno não fechado há 24h". |

Cada tipo de evento pode ser emitido com uma severidade; a mesma categoria (ex.: alert) pode ser INFO, ATTENTION ou RISK conforme o payload.

---

## 4. Onde cada tipo pode aparecer

| Tipo | Feed Web | Feed App | Apenas log interno |
|------|----------|----------|---------------------|
| sale | Sim (resumo) | Sim (máx. 4–5 itens) | Não |
| alert | Sim | Sim (prioridade ATTENTION/RISK) | Só se INFO e regra de filtro |
| shift | Sim | Sim | Não |
| person | Sim | Sim (resumo) | Opcional |
| system | Opcional | Opcional (ex.: "TPV ativo") | Sim para ruído fino |

**Regra de ouro:** Feed app = compressão (poucos itens, mais estado). Feed web = mais itens e contexto; CTAs "Ver detalhe" quando fizer sentido. Nada obriga a mostrar todos os tipos em ambos os feeds; v1 pode restringir por severidade (ex.: app só ATTENTION e RISK).

---

## 5. Regras de emissão

- **Quando nasce:** No momento da ação ou da mudança de estado (ex.: pagamento confirmado → evento sale; turno aberto → evento shift). Não em batch histórico para o feed; histórico é domínio dos relatórios.
- **Quem emite:** Staff (ação humana), TPV/KDS (transação/ordem), ou sistema (turno, health check). O contrato não exige distinguir no payload para v1; opcional: campo `source: "staff" | "system"` para análises futuras.
- **Quando expira:** Eventos do feed não "expiram" por TTL no contrato v1; a UI limita por quantidade (ex.: 20–30 no web, 4–5 no app) e ordenação cronológica. Eventos antigos saem da vista por deslize, não por invalidação. Para alertas que devem "desligar" (ex.: "Stock baixo" resolvido), o sistema emite um evento de resolução ou o estado é derivado noutra camada (fora do âmbito do feed v1).

---

## 6. Ligação aos quatro eixos de poder

O Owner Dashboard (wireframe) tem quatro painéis:

- **Dinheiro agora:** Consome eventos do tipo `sale` e estado derivado (totais do dia). Feed mostra vendas recentes.
- **Motor da operação:** Consome eventos `shift` e `system` (turno, TPV, KDS, fila). Feed mostra abertura/fecho de turno e estados.
- **Pessoas & disciplina:** Consome eventos `person`. Feed mostra check-in, tarefas, alertas de disciplina.
- **Risco & tendência:** Consome eventos `alert`. Feed mostra stock baixo, avisos, críticos.

O feed único (Zona 3) agrega todos os tipos; cada painel pode mostrar um subconjunto ou resumo (ex.: contador "0 alertas") conforme o contrato de modos cognitivos.

---

## 7. Extensibilidade v2 (sem quebrar v1)

- Novos tipos: adicionar à tabela (secção 2) e às regras de visibilidade (secção 4).
- Novas severidades: só se fizerem sentido para filtros (ex.: SILENT para só log).
- Novo consumidor (ex.: IA, automação): mesmo evento, nova subscrição; o contrato de onde aparece (feed web/app/log) mantém-se.
- Fonte (staff vs system): opcional em v1; pode ser exigido em v2 para relatórios ou RBAC.

---

*Contrato fechado v1. Alterações por uso real, não por teoria.*
