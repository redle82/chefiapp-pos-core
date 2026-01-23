# ✅ UNIVERSAL TEST CHECKLIST — ChefIApp

> **Instruções**: Execute cada item na ordem. Marque ✅ quando passar, ❌ quando falhar.

---

## 📋 PRÉ-CONDIÇÕES (FASE 0)

| #   | Item                                              | Status | Notas |
| --- | ------------------------------------------------- | ------ | ----- |
| 0.1 | `fetchOrders()` com filtro/paginação implementado | ⬜     |       |
| 0.2 | RBAC no backend (RLS policies)                    | ⬜     |       |
| 0.3 | RLS bloqueando ações financeiras                  | ⬜     |       |
| 0.4 | `idempotency_key` em criação de pedidos           | ⬜     |       |
| 0.5 | Logger ativo (console + backend)                  | ⬜     |       |
| 0.6 | Ambiente de teste configurado                     | ⬜     |       |
| 0.7 | Stripe em Test Mode                               | ⬜     |       |

**⚠️ Se algum item acima falhar, PARE. Não continue o teste.**

---

## 🧪 FASE 1 — RBAC & Identidade

### 1.1 Setup de Atores

| Ator       | Dispositivo           | Login OK |
| ---------- | --------------------- | -------- |
| Garçom A   | iOS Simulator         | ⬜       |
| Garçom B   | Android Emulator      | ⬜       |
| Cozinheiro | Web (KDS)             | ⬜       |
| Gerente    | Web (TPV)             | ⬜       |
| Dono       | Web (Dashboard)       | ⬜       |
| Cliente    | Web (Customer Portal) | ⬜       |

### 1.2 Testes de Permissão

| Teste                                                | Resultado |
| ---------------------------------------------------- | --------- |
| Garçom tenta fechar caixa → Backend bloqueia         | ⬜        |
| Garçom tenta cancelar pedido pago → Backend bloqueia | ⬜        |
| Garçom tenta ver relatórios → Acesso negado          | ⬜        |
| Gerente fecha caixa → Sucesso                        | ⬜        |
| Dono acessa tudo → Sucesso                           | ⬜        |
| Cliente cria pedido → Sucesso                        | ⬜        |
| Cliente tenta editar pedido de outro → Bloqueia      | ⬜        |

### 1.3 Teste de Fraude

| Teste                                            | Resultado |
| ------------------------------------------------ | --------- |
| Alterar `role` via DevTools → Backend ignora     | ⬜        |
| Forçar request direto (bypass UI) → RLS bloqueia | ⬜        |

**✅ FASE 1 APROVADA**: ⬜

---

## 🧪 FASE 2 — Concorrência Real

### 2.1 Setup

| Item                          | Status |
| ----------------------------- | ------ |
| Todos os dispositivos online  | ⬜     |
| Mesmo restaurante selecionado | ⬜     |
| Turno aberto                  | ⬜     |

### 2.2 Ações Simultâneas (Executar em ≤10 segundos)

| Ação                             | Executado |
| -------------------------------- | --------- |
| Garçom A: Criar pedido mesa 5    | ⬜        |
| Garçom B: Criar pedido mesa 5    | ⬜        |
| Cliente: Adicionar item mesa 5   | ⬜        |
| Gerente: Editar pedido existente | ⬜        |
| TPV: Adicionar item manual       | ⬜        |

### 2.3 Validações

| Check                           | Resultado |
| ------------------------------- | --------- |
| Pedidos não duplicaram          | ⬜        |
| Itens consolidados corretamente | ⬜        |
| KDS recebeu todos os itens      | ⬜        |
| Ordem cronológica correta       | ⬜        |
| Zero crashes                    | ⬜        |
| Zero perda de dados             | ⬜        |

**✅ FASE 2 APROVADA**: ⬜

---

## 🧪 FASE 3 — Offline Parcial

### 3.1 Setup

| Item                   | Status |
| ---------------------- | ------ |
| Garçom A: Internet OFF | ⬜     |
| Garçom B: Internet OFF | ⬜     |
| KDS: Internet ON       | ⬜     |
| TPV: Internet ON       | ⬜     |

### 3.2 Ações Offline

| Ação                         | Resultado |
| ---------------------------- | --------- |
| Garçom A cria pedido         | ⬜        |
| Garçom B cria pedido         | ⬜        |
| UI mostra indicador offline  | ⬜        |
| UI mostra "pendente de sync" | ⬜        |
| App não trava                | ⬜        |

### 3.3 Reconexão

| Check                               | Resultado |
| ----------------------------------- | --------- |
| Internet ligada novamente           | ⬜        |
| Pedidos sincronizam automaticamente | ⬜        |
| KDS recebe (sem duplicidade)        | ⬜        |
| Tempo de sync < 5s                  | ⬜        |

**✅ FASE 3 APROVADA**: ⬜

---

## 🧪 FASE 4 — Offline Total

### 4.1 Setup

| Item                                | Status |
| ----------------------------------- | ------ |
| TODOS os dispositivos: Internet OFF | ⬜     |

### 4.2 Ações em Modo Offline

| Ação                        | Resultado |
| --------------------------- | --------- |
| Criar pedido                | ⬜        |
| Adicionar itens             | ⬜        |
| Alterar mesa                | ⬜        |
| Dividir conta (preparar)    | ⬜        |
| UI clara sobre modo offline | ⬜        |

### 4.3 Reconexão Total

| Check                                 | Resultado |
| ------------------------------------- | --------- |
| Todos reconectados                    | ⬜        |
| Sync completo sem erros               | ⬜        |
| Dados consistentes entre dispositivos | ⬜        |
| Sem conflitos fatais                  | ⬜        |
| Logs mostram replay correto           | ⬜        |

**✅ FASE 4 APROVADA**: ⬜

---

## 🧪 FASE 5 — Pagamento & Divisão

### 5.1 Setup

| Item                             | Status |
| -------------------------------- | ------ |
| Pedido grande criado (10+ itens) | ⬜     |
| Total > €100                     | ⬜     |

### 5.2 Divisão de Conta

| Teste                           | Resultado |
| ------------------------------- | --------- |
| Dividir por pessoa (10 pessoas) | ⬜        |
| Dividir por item                | ⬜        |
| Divisão mista                   | ⬜        |
| Totais corretos                 | ⬜        |

### 5.3 Pagamentos

| Teste                        | Resultado |
| ---------------------------- | --------- |
| 8 pessoas pagam              | ⬜        |
| 2 permanecem pendentes       | ⬜        |
| Pedido NÃO fecha ainda       | ⬜        |
| Últimos 2 pagam              | ⬜        |
| Pedido fecha automaticamente | ⬜        |
| Troco calculado corretamente | ⬜        |

**✅ FASE 5 APROVADA**: ⬜

---

## 🧪 FASE 6 — Estresse

### 6.1 Execução

| Item             | Valor      |
| ---------------- | ---------- |
| Script executado | ⬜         |
| Pedidos criados  | \_\_\_/100 |
| Tempo total      | \_\_\_ min |

### 6.2 Métricas

| Métrica            | Valor     | Limite  | OK? |
| ------------------ | --------- | ------- | --- |
| Memória máxima     | \_\_\_ MB | < 500MB | ⬜  |
| Tempo render médio | \_\_\_ ms | < 100ms | ⬜  |
| Tempo sync médio   | \_\_\_ s  | < 2s    | ⬜  |
| Crashes            | \_\_\_    | 0       | ⬜  |

**✅ FASE 6 APROVADA**: ⬜

---

## 🧪 FASE 7 — Imprevistos

| Teste                         | Resultado | Notas |
| ----------------------------- | --------- | ----- |
| Impressora sem papel          | ⬜        |       |
| Impressora desligada          | ⬜        |       |
| App fechado no meio do pedido | ⬜        |       |
| App crasha e reabre           | ⬜        |       |
| Token expira durante uso      | ⬜        |       |
| 2 pessoas editam mesmo pedido | ⬜        |       |
| Cancelamento durante sync     | ⬜        |       |
| Mudança de timezone           | ⬜        |       |

**✅ FASE 7 APROVADA**: ⬜

---

## 📊 RESUMO FINAL

| Fase                     | Status |
| ------------------------ | ------ |
| FASE 0 - Pré-condições   | ⬜     |
| FASE 1 - RBAC            | ⬜     |
| FASE 2 - Concorrência    | ⬜     |
| FASE 3 - Offline Parcial | ⬜     |
| FASE 4 - Offline Total   | ⬜     |
| FASE 5 - Pagamentos      | ⬜     |
| FASE 6 - Estresse        | ⬜     |
| FASE 7 - Imprevistos     | ⬜     |

---

## 🎯 DECISÃO

| Pergunta          | Resposta        |
| ----------------- | --------------- |
| **Pode operar?**  | ⬜ Sim / ⬜ Não |
| **Pode vender?**  | ⬜ Sim / ⬜ Não |
| **Pode escalar?** | ⬜ Sim / ⬜ Não |

---

**Testado por**: **\*\***\_\_\_**\*\***
**Data**: **\*\***\_\_\_**\*\***
**Versão**: **\*\***\_\_\_**\*\***
