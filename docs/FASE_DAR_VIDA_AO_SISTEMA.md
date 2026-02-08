# 🔌 FASE: DAR VIDA AO SISTEMA
## Checklist Técnico Completo

**Objetivo:** Transformar o ChefIApp de "protótipo visual" para "sistema operacional real" conectando UI ⇄ Core.

**Critério de Sucesso:** 1 restaurante operando de ponta a ponta com dados reais, sem placeholders.

---

## 🎯 VISÃO GERAL

### O que está faltando
- ❌ Identidade (quem sou eu?)
- ❌ Nascimento (como começa?)
- ❌ Conexão (dados reais)

### O que vamos fazer
- ✅ Portal 1: Autenticação mínima funcional
- ✅ Portal 2: Onboarding de restaurante (wizard)
- ✅ Portal 3: Conectar 5 telas-chave ao Core real

---

## 🔑 PORTAL 1: IDENTIDADE

### 1.1 Autenticação Mínima Funcional

**Arquivo:** `merchant-portal/src/auth/AuthContext.tsx` (criar)

**O que fazer:**
- [ ] Criar `AuthContext` com:
  - `user: { id, email, name, role }`
  - `restaurant: { id, name }`
  - `login(email, role)` — simples, sem senha por enquanto
  - `logout()`
  - `setActiveRestaurant(restaurantId)`

**Integração:**
- [ ] Usar `localStorage` para persistir sessão
- [ ] Provider no `App.tsx` envolvendo rotas
- [ ] Hook `useAuth()` para consumo

**Telas:**
- [ ] `LoginPage.tsx` — email + role (Dono/Gerente/Funcionário)
- [ ] Redirecionar para `/owner/vision`, `/manager/dashboard`, `/employee/home` baseado em role

**Critério de Pronto:**
- ✅ Posso fazer login e ver meu nome no header
- ✅ Posso trocar de restaurante (se multi-location)
- ✅ Sessão persiste após refresh

---

## 🏗️ PORTAL 2: NASCIMENTO DO RESTAURANTE

### 2.1 Wizard de Onboarding

**Arquivo:** `merchant-portal/src/pages/Onboarding/RestaurantWizard.tsx` (criar)

**Fluxo (5 passos):**

#### Passo 1: Nome do Restaurante
- [ ] Input: nome do restaurante
- [ ] Validação: mínimo 3 caracteres
- [ ] Botão "Próximo"

#### Passo 2: Quantas Mesas
- [ ] Input numérico: quantidade de mesas
- [ ] Validação: mínimo 1, máximo 100
- [ ] Preview: "Você terá X mesas"
- [ ] Botões "Voltar" / "Próximo"

#### Passo 3: Cardápio Mínimo (3 itens)
- [ ] Formulário repetível:
  - Nome do item
  - Preço
  - Categoria (Comida / Bebida)
- [ ] Validação: exatamente 3 itens
- [ ] Botões "Voltar" / "Próximo"

#### Passo 4: Criar 1 Funcionário
- [ ] Input: nome
- [ ] Select: função (Garçom / Cozinha / Bar / Limpeza)
- [ ] Input: email (opcional)
- [ ] Botões "Voltar" / "Próximo"

#### Passo 5: Concluir
- [ ] Resumo: "Restaurante X criado com Y mesas, Z itens, 1 funcionário"
- [ ] Botão "Entrar no Dashboard"
- [ ] Redirecionar para `/owner/vision` (ou `/manager/dashboard` se role = manager)

**Integração com Core:**
- [ ] RPC: `create_restaurant(name, tables_count)` → retorna `restaurant_id`
- [ ] RPC: `create_tables(restaurant_id, count)` → cria mesas
- [ ] RPC: `create_menu_items(restaurant_id, items[])` → cria itens do cardápio
- [ ] RPC: `create_user(name, role, restaurant_id)` → cria funcionário

**Critério de Pronto:**
- ✅ Posso criar restaurante completo em 2 minutos
- ✅ Dados persistem no banco
- ✅ Após criar, vejo dados reais no dashboard

---

## 🔌 PORTAL 3: CONEXÃO UI ⇄ CORE

### 3.1 Tela 1: Operação (Pedidos Reais)

**Arquivo:** `merchant-portal/src/pages/Employee/OperationPage.tsx` (modificar)

**O que conectar:**
- [ ] Hook: `useActiveOrders(restaurantId)` → busca pedidos OPEN
- [ ] Hook: `useCreateOrder(tableId, items[])` → cria pedido real
- [ ] Hook: `useUpdateOrderStatus(orderId, status)` → atualiza status

**Dados reais:**
- [ ] Listar pedidos ativos do banco (não placeholder)
- [ ] Mostrar tempo real de cada pedido
- [ ] Botão "Novo Pedido" abre modal com:
  - Select de mesa (buscar mesas disponíveis)
  - Lista de itens do cardápio (buscar do banco)
  - Botão "Criar Pedido" → chama RPC `create_order_atomic`

**Critério de Pronto:**
- ✅ Vejo pedidos reais em tempo real
- ✅ Posso criar pedido e ele aparece imediatamente
- ✅ Tempo de SLA atualiza automaticamente

---

### 3.2 Tela 2: KDS (Estado Real)

**Arquivo:** `merchant-portal/src/pages/Employee/KDSIntelligentPage.tsx` (modificar)

**O que conectar:**
- [ ] Hook: `useKDSByStation(restaurantId, station)` → busca itens por estação
- [ ] Hook: `useMarkItemReady(itemId)` → marca item como pronto
- [ ] Hook: `useBlockItem(itemId, reason)` → bloqueia item

**Dados reais:**
- [ ] Listar itens do KDS por estação (BAR / KITCHEN)
- [ ] Mostrar tempo decorrido desde criação
- [ ] Destacar itens atrasados (SLA violado)
- [ ] Botões funcionais: "Marcar Pronto" / "Bloquear"

**Critério de Pronto:**
- ✅ Vejo itens reais do KDS em tempo real
- ✅ Posso marcar como pronto e item some da lista
- ✅ Bloqueios aparecem com causa visível

---

### 3.3 Tela 3: Estoque (Consumo Real)

**Arquivo:** `merchant-portal/src/pages/Owner/StockRealPage.tsx` (modificar)

**O que conectar:**
- [ ] Hook: `useStockItems(restaurantId)` → busca estoque atual
- [ ] Hook: `useStockConsumption(restaurantId, itemId, period)` → consumo real
- [ ] Hook: `useStockForecast(restaurantId)` → previsão de ruptura

**Dados reais:**
- [ ] Listar itens com estoque atual (não placeholder)
- [ ] Calcular consumo real das últimas 24h
- [ ] Prever ruptura baseado em consumo histórico
- [ ] Botão "Comprar agora" → navega para compras com item pré-selecionado

**Critério de Pronto:**
- ✅ Vejo estoque real atualizado
- ✅ Consumo reflete pedidos reais processados
- ✅ Previsão de ruptura é baseada em dados históricos

---

### 3.4 Tela 4: Escala (Salvar Turno)

**Arquivo:** `merchant-portal/src/pages/Manager/ScheduleCreatePage.tsx` (modificar)

**O que conectar:**
- [ ] Hook: `useUsers(restaurantId)` → busca lista de funcionários
- [ ] Hook: `useCreateShift(userId, role, date, start, end)` → cria turno real
- [ ] Hook: `useShiftsByDate(restaurantId, date)` → busca turnos do dia

**Dados reais:**
- [ ] Select "Pessoa" populado com funcionários reais
- [ ] Validação: não permitir turnos sobrepostos
- [ ] Botão "Salvar Turno" → chama RPC `create_shift` e persiste
- [ ] Feedback: "Turno criado com sucesso" → navega de volta

**Critério de Pronto:**
- ✅ Posso criar turno e ele aparece na lista
- ✅ Validação impede conflitos de horário
- ✅ Turno persiste após refresh

---

### 3.5 Tela 5: Compras (Gerar Pedido Real)

**Arquivo:** `merchant-portal/src/pages/Owner/PurchasesPage.tsx` (modificar)

**O que conectar:**
- [ ] Hook: `useShoppingList(restaurantId)` → busca lista automática
- [ ] Hook: `useGenerateShoppingList(restaurantId)` → gera lista baseada em estoque crítico
- [ ] Hook: `useCreatePurchaseOrder(restaurantId, items[])` → cria pedido de compra

**Dados reais:**
- [ ] Lista automática gerada quando estoque < mínimo
- [ ] Botão "Gerar lista automática" → chama RPC `generate_shopping_list`
- [ ] Botão "Criar Pedido" → chama RPC `create_purchase_order`
- [ ] Mostrar histórico de pedidos anteriores

**Critério de Pronto:**
- ✅ Lista automática aparece quando há estoque crítico
- ✅ Posso criar pedido de compra e ele persiste
- ✅ Pedido aparece no histórico

---

## 🧪 TESTES DE VALIDAÇÃO

### Teste End-to-End Mínimo

**Cenário:** Criar restaurante e operar 1 pedido completo

1. [ ] Login como Dono
2. [ ] Criar restaurante via wizard:
   - Nome: "Restaurante Teste"
   - 5 mesas
   - 3 itens no cardápio
   - 1 funcionário (Garçom)
3. [ ] Ver dashboard com dados reais (0 pedidos, 0 SLAs)
4. [ ] Criar pedido na Operação:
   - Mesa 1
   - 1 item do cardápio
5. [ ] Ver pedido aparecer no KDS
6. [ ] Marcar item como pronto no KDS
7. [ ] Ver pedido fechar automaticamente
8. [ ] Ver estoque consumir o item usado
9. [ ] Ver dashboard atualizado (1 pedido, 0 SLAs violados)

**Critério de Pronto:**
- ✅ Fluxo completo funciona sem erros
- ✅ Dados persistem após refresh
- ✅ Nenhum placeholder visível

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Identidade (2-3 horas)
- [ ] Criar `AuthContext.tsx`
- [ ] Criar `LoginPage.tsx`
- [ ] Integrar Provider no `App.tsx`
- [ ] Criar hook `useAuth()`
- [ ] Testar login/logout

### Fase 2: Onboarding (4-5 horas)
- [ ] Criar `RestaurantWizard.tsx` (5 passos)
- [ ] Criar RPCs no Core:
  - `create_restaurant`
  - `create_tables`
  - `create_menu_items`
  - `create_user`
- [ ] Integrar wizard com RPCs
- [ ] Testar criação completa

### Fase 3: Conexão UI ⇄ Core (8-10 horas)
- [ ] **Operação** (2h):
  - Criar hooks `useActiveOrders`, `useCreateOrder`
  - Modificar `OperationPage.tsx`
  - Testar criação de pedido
- [ ] **KDS** (2h):
  - Criar hooks `useKDSByStation`, `useMarkItemReady`
  - Modificar `KDSIntelligentPage.tsx`
  - Testar marcação de pronto
- [ ] **Estoque** (2h):
  - Criar hooks `useStockItems`, `useStockConsumption`
  - Modificar `StockRealPage.tsx`
  - Testar consumo real
- [ ] **Escala** (2h):
  - Criar hooks `useUsers`, `useCreateShift`
  - Modificar `ScheduleCreatePage.tsx`
  - Testar criação de turno
- [ ] **Compras** (2h):
  - Criar hooks `useShoppingList`, `useCreatePurchaseOrder`
  - Modificar `PurchasesPage.tsx`
  - Testar geração de lista

### Fase 4: Testes (2-3 horas)
- [ ] Teste end-to-end completo
- [ ] Validar persistência de dados
- [ ] Validar feedback de ações
- [ ] Corrigir bugs encontrados

---

## ⏱️ ESTIMATIVA DE TEMPO

**Total:** 16-21 horas de desenvolvimento

**Breakdown:**
- Portal 1 (Identidade): 2-3h
- Portal 2 (Onboarding): 4-5h
- Portal 3 (Conexão): 8-10h
- Testes: 2-3h

**Com foco e sem interrupções:** 2-3 dias úteis

**Com revisões e ajustes:** 1 semana

---

## 🎯 CRITÉRIO DE SUCESSO FINAL

✅ **Sistema está "vivo" quando:**
- Posso criar restaurante do zero
- Posso criar pedido e ele aparece no KDS
- Posso marcar item como pronto e pedido fecha
- Estoque consome baseado em pedidos reais
- Escala persiste e aparece na lista
- Compras gera lista baseada em estoque crítico
- **Zero placeholders visíveis**
- **Todos os dados vêm do banco**

---

## 🚀 PRÓXIMOS PASSOS APÓS ESTA FASE

1. **Mentoria IA** — Agora sim, com dados reais para interpretar
2. **Previsões** — Com histórico real para treinar
3. **Simulação** — Com dados reais para projetar

Mas primeiro: **dar vida ao sistema.**

---

**Documento criado em:** 26/01/2026  
**Status:** ✅ Pronto para execução
