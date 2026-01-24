# 🔥 UNIVERSAL TEST PLAN — ChefIApp Operational Sovereignty

> **Objetivo**: Provar que o ChefIApp funciona em condições reais de restaurante, com concorrência, offline, e caos controlado.

---

## 🎯 O que este teste prova

| #   | Critério                 | Descrição                                       |
| --- | ------------------------ | ----------------------------------------------- |
| 1   | Concorrência real        | Múltiplos dispositivos operando simultaneamente |
| 2   | Offline parcial/total    | Funciona sem internet, sincroniza depois        |
| 3   | Integridade de dados     | Nenhum pedido perdido ou duplicado              |
| 4   | Autoridade do backend    | DATABASE_AUTHORITY respeitada                   |
| 5   | UX operacional           | Usável sob pressão real                         |
| 6   | Não duplica pedidos      | Idempotência funciona                           |
| 7   | Não perde pedidos        | OfflineQueue confiável                          |
| 8   | Sem fraude de permissão  | RBAC backend bloqueia                           |
| 9   | Sync correto após caos   | Reconexão sem conflitos                         |
| 10  | Utilizável no mundo real | Não só "passa teste técnico"                    |

---

## 🧱 Arquitetura do Teste

### Ambientes Necessários

| Tipo              | Quantidade | Como           |
| ----------------- | ---------- | -------------- |
| iOS Simulators    | 3–5        | Xcode          |
| Android Emulators | 3–5        | Android Studio |
| TPV (Web)         | 1–2        | Browser        |
| KDS (Web/Tablet)  | 1          | Browser        |
| Customer Portal   | 1          | Browser        |
| Backend           | 1          | Supabase       |
| Stripe            | 1          | Test Mode      |

**Total**: 10–15 clientes concorrentes reais

---

## 🚫 FASE 0 — PRÉ-CONDIÇÕES (Bloqueantes)

> ⚠️ **SEM ISSO O TESTE NÃO VALE NADA**

| Requisito                            | Status | Arquivo            |
| ------------------------------------ | ------ | ------------------ |
| `fetchOrders()` com filtro/paginação | ⬜     | `OrderContext.tsx` |
| RBAC no backend (não só client)      | ⬜     | RLS policies       |
| RLS bloqueando ações financeiras     | ⬜     | Supabase           |
| Idempotência em criação de pedidos   | ⬜     | `idempotency_key`  |
| Logs básicos ativados                | ⬜     | `Logger.ts`        |

---

## 🧪 FASE 1 — Teste de Identidade & Papéis (RBAC)

### Atores

| Papel      | Dispositivo     |
| ---------- | --------------- |
| Garçom A   | iOS             |
| Garçom B   | Android         |
| Cozinheiro | Tablet          |
| Gerente    | Web             |
| Dono       | Web             |
| Cliente    | Customer Portal |
| Caixa      | TPV             |

### Validações

| Ação                 | Garçom | Gerente | Dono |
| -------------------- | ------ | ------- | ---- |
| Criar pedido         | ✅     | ✅      | ✅   |
| Editar pedido        | ✅     | ✅      | ✅   |
| Cancelar pedido pago | ❌     | ⚠️      | ✅   |
| Fechar caixa         | ❌     | ✅      | ✅   |
| Ver relatórios       | ❌     | ✅      | ✅   |
| Editar menu          | ❌     | ⚠️      | ✅   |

### Teste de Fraude

- [ ] Tentar forçar ação via DevTools
- [ ] Alterar estado local manualmente
- [ ] Backend DEVE bloquear

**✅ Resultado esperado**: 0 ações ilegais passam

---

## 🧪 FASE 2 — Concorrência Real (Caos Controlado)

### Cenário

- Todos os dispositivos logados
- Mesmo restaurante
- Mesmo turno aberto

### Ações Simultâneas

1. Garçom A cria pedido mesa 5
2. Garçom B cria pedido mesa 5
3. Cliente web adiciona item mesa 5
4. Gerente edita pedido
5. TPV adiciona item manual
6. Dono observa dashboard

### Validações

- [ ] Pedidos não duplicam
- [ ] Itens se unem corretamente
- [ ] KDS recebe tudo
- [ ] Ordem correta
- [ ] Nenhum crash
- [ ] Nenhuma perda

**✅ KDS = fonte visual da verdade**

---

## 🧪 FASE 3 — Offline Parcial

### Setup

1. Desligar internet: Garçom A, Garçom B
2. Manter online: KDS, TPV

### Ações

- [ ] Garçons criam pedidos offline
- [ ] KDS não recebe ainda
- [ ] UI mostra "pendente de sync"
- [ ] Nada trava

### Reconexão

- [ ] Internet volta
- [ ] Pedidos sincronizam
- [ ] KDS recebe UMA vez (sem duplicidade)
- [ ] Ordem correta

**✅ Valida**: OfflineQueue + Idempotência

---

## 🧪 FASE 4 — Offline Total (O Mais Difícil)

### Cenário

TODOS offline: Garçons, TPV, KDS

### Ações

- [ ] Criar pedidos
- [ ] Alterar mesas
- [ ] Dividir conta localmente
- [ ] Registrar pagamento "pendente"

### Expectativa

- [ ] Tudo funciona local
- [ ] UI mostra claramente "Modo Offline"
- [ ] Nenhuma ação crítica escondida

### Reconexão

- [ ] Tudo sincroniza
- [ ] Backend aceita
- [ ] Sem conflitos fatais
- [ ] Logs mostram replay correto

**✅ Se passar → SOBERANIA OPERACIONAL REAL**

---

## 🧪 FASE 5 — Pagamento & Divisão de Conta (10 Pessoas)

### Cenário

- Mesa com 10 clientes
- Pedido grande (€150+)

### Fluxo

1. [ ] Criar pedido completo
2. [ ] Dividir conta:
   - Por pessoa
   - Por item
   - Mista (alguns juntos)
3. [ ] Pagamentos:
   - 8 pagos
   - 2 pendentes
4. [ ] Último cliente paga depois

### Validações

- [ ] Totais corretos
- [ ] Troco correto
- [ ] Nenhuma pessoa paga duas vezes
- [ ] Pedido só fecha quando tudo pago
- [ ] KDS muda estado corretamente

---

## 🧪 FASE 6 — Estresse Controlado

### Automação

Script que cria:

- 100 pedidos em 10 minutos
- 5 dispositivos
- Sem UI, só carga

### Métricas a Monitorar

| Métrica         | Limite Aceitável |
| --------------- | ---------------- |
| Uso de memória  | < 500MB          |
| Tempo de render | < 100ms          |
| Tempo de sync   | < 2s             |
| Crashes         | 0                |

---

## 🧪 FASE 7 — Testes de Imprevisto

> **O que ninguém testa mas mata restaurante**

- [ ] Impressora sem papel
- [ ] Impressora desligada
- [ ] App fechado no meio do pedido
- [ ] App crasha e reabre
- [ ] Token expira no meio do turno
- [ ] Duas pessoas editam mesmo pedido
- [ ] Cancelamento durante sync
- [ ] Mudança de timezone (DST)
- [ ] Bateria acaba no meio da ação

---

## 📊 Classificação de Resultados

| Símbolo | Nível      | Descrição               |
| ------- | ---------- | ----------------------- |
| ❌      | Bloqueante | Impede operação         |
| ⚠️      | Grave      | Funciona mas com risco  |
| 🟡      | UX         | Problema de experiência |
| 🟢      | Aceitável  | Ok para produção        |

---

## 🎯 Decisão Final

| Pergunta                         | Resposta        |
| -------------------------------- | --------------- |
| Pode operar em restaurante real? | ⬜ Sim / ⬜ Não |
| Pode vender para clientes?       | ⬜ Sim / ⬜ Não |
| Pode escalar (multi-location)?   | ⬜ Sim / ⬜ Não |

---

## 📁 Documentos Relacionados

- [UNIVERSAL_TEST_CHECKLIST.md](./UNIVERSAL_TEST_CHECKLIST.md)
- [TEST_REPORT_TEMPLATE.md](./TEST_REPORT_TEMPLATE.md)
- [../scripts/test-open-simulators.sh](../../scripts/test-open-simulators.sh)
- [../scripts/test-offline-toggle.sh](../../scripts/test-offline-toggle.sh)
