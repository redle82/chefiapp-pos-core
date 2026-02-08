# 🎯 PROMPT — EXECUTAR FASE "DAR VIDA AO SISTEMA"

**Role:** Você é um Full-Stack Engineer sênior especializado em React + TypeScript + Supabase/PostgreSQL, responsável por conectar a UI do ChefIApp com o Core real.

**Contexto:** O ChefIApp tem:
- ✅ Core constitucionalmente validado (PostgreSQL, RPCs, Event Sourcing)
- ✅ UI completa com 15 telas implementadas
- ❌ UI e Core não conversam — todas as telas usam placeholders

**Objetivo:** Implementar os 3 portais fundamentais para dar vida ao sistema:
1. **Identidade** — Autenticação mínima funcional
2. **Nascimento** — Onboarding de restaurante (wizard)
3. **Conexão** — Conectar 5 telas-chave ao Core real

---

## 📋 TAREFAS OBRIGATÓRIAS (EM ORDEM)

### 🔑 PORTAL 1: IDENTIDADE (2-3 horas)

**1.1 Criar AuthContext**
- Arquivo: `merchant-portal/src/auth/AuthContext.tsx`
- Implementar:
  - `AuthContext` com `user`, `restaurant`, `login()`, `logout()`
  - Persistência em `localStorage`
  - Provider para envolver rotas
- Hook: `useAuth()` para consumo

**1.2 Criar LoginPage**
- Arquivo: `merchant-portal/src/pages/Auth/LoginPage.tsx`
- Formulário simples:
  - Email (input)
  - Role (select: Dono / Gerente / Funcionário)
- Botão "Entrar"
- Após login, redirecionar baseado em role:
  - Dono → `/owner/vision`
  - Gerente → `/manager/dashboard`
  - Funcionário → `/employee/home`

**1.3 Integrar no App.tsx**
- Envolver rotas com `AuthProvider`
- Adicionar rota `/login`
- Proteger rotas (redirecionar para `/login` se não autenticado)
- Mostrar nome do usuário no header (se aplicável)

**Critério de Pronto:**
- ✅ Posso fazer login e ver meu nome/role
- ✅ Sessão persiste após refresh
- ✅ Logout funciona

---

### 🏗️ PORTAL 2: NASCIMENTO DO RESTAURANTE (4-5 horas)

**2.1 Criar Wizard de Onboarding**
- Arquivo: `merchant-portal/src/pages/Onboarding/RestaurantWizard.tsx`
- Fluxo em 5 passos:
  1. **Nome do Restaurante**
     - Input: nome (mínimo 3 caracteres)
     - Botão "Próximo"
  2. **Quantas Mesas**
     - Input numérico: quantidade (1-100)
     - Preview: "Você terá X mesas"
     - Botões "Voltar" / "Próximo"
  3. **Cardápio Mínimo (3 itens)**
     - Formulário repetível:
       - Nome do item
       - Preço (número)
       - Categoria (Comida / Bebida)
     - Validação: exatamente 3 itens
     - Botões "Voltar" / "Próximo"
  4. **Criar 1 Funcionário**
     - Input: nome
     - Select: função (Garçom / Cozinha / Bar / Limpeza)
     - Input: email (opcional)
     - Botões "Voltar" / "Próximo"
  5. **Concluir**
     - Resumo: "Restaurante X criado com Y mesas, Z itens, 1 funcionário"
     - Botão "Entrar no Dashboard"
     - Redirecionar para `/owner/vision`

**2.2 Criar RPCs no Core (se não existirem)**
- `create_restaurant(name, tables_count)` → retorna `restaurant_id`
- `create_tables(restaurant_id, count)` → cria mesas
- `create_menu_items(restaurant_id, items[])` → cria itens do cardápio
- `create_user(name, role, restaurant_id)` → cria funcionário

**2.3 Integrar Wizard com RPCs**
- Chamar RPCs na ordem correta
- Mostrar loading durante criação
- Tratar erros (mostrar mensagem)
- Após sucesso, redirecionar para dashboard

**Critério de Pronto:**
- ✅ Posso criar restaurante completo em 2 minutos
- ✅ Dados persistem no banco
- ✅ Após criar, vejo dados reais no dashboard

---

### 🔌 PORTAL 3: CONEXÃO UI ⇄ CORE (8-10 horas)

**3.1 Tela: Operação (Pedidos Reais)**
- Arquivo: `merchant-portal/src/pages/Employee/OperationPage.tsx`
- Criar hooks:
  - `useActiveOrders(restaurantId)` → busca pedidos OPEN do banco
  - `useCreateOrder(tableId, items[])` → chama RPC `create_order_atomic`
  - `useUpdateOrderStatus(orderId, status)` → atualiza status
- Modificar tela:
  - Listar pedidos reais (não placeholder)
  - Botão "Novo Pedido" abre modal:
    - Select de mesa (buscar mesas disponíveis)
    - Lista de itens do cardápio (buscar do banco)
    - Botão "Criar Pedido" → chama RPC
  - Mostrar tempo real de cada pedido
- **Critério:** Vejo pedidos reais em tempo real

**3.2 Tela: KDS (Estado Real)**
- Arquivo: `merchant-portal/src/pages/Employee/KDSIntelligentPage.tsx`
- Criar hooks:
  - `useKDSByStation(restaurantId, station)` → busca itens por estação
  - `useMarkItemReady(itemId)` → marca item como pronto
  - `useBlockItem(itemId, reason)` → bloqueia item
- Modificar tela:
  - Listar itens reais do KDS por estação
  - Mostrar tempo decorrido desde criação
  - Destacar itens atrasados (SLA violado)
  - Botões funcionais: "Marcar Pronto" / "Bloquear"
- **Critério:** Posso marcar como pronto e item some da lista

**3.3 Tela: Estoque (Consumo Real)**
- Arquivo: `merchant-portal/src/pages/Owner/StockRealPage.tsx`
- Criar hooks:
  - `useStockItems(restaurantId)` → busca estoque atual
  - `useStockConsumption(restaurantId, itemId, period)` → consumo real
  - `useStockForecast(restaurantId)` → previsão de ruptura
- Modificar tela:
  - Listar itens com estoque atual (não placeholder)
  - Calcular consumo real das últimas 24h
  - Prever ruptura baseado em consumo histórico
  - Botão "Comprar agora" → navega para compras com item pré-selecionado
- **Critério:** Vejo estoque real atualizado

**3.4 Tela: Escala (Salvar Turno)**
- Arquivo: `merchant-portal/src/pages/Manager/ScheduleCreatePage.tsx`
- Criar hooks:
  - `useUsers(restaurantId)` → busca lista de funcionários
  - `useCreateShift(userId, role, date, start, end)` → cria turno real
  - `useShiftsByDate(restaurantId, date)` → busca turnos do dia
- Modificar tela:
  - Select "Pessoa" populado com funcionários reais
  - Validação: não permitir turnos sobrepostos
  - Botão "Salvar Turno" → chama RPC `create_shift` e persiste
  - Feedback: "Turno criado com sucesso" → navega de volta
- **Critério:** Posso criar turno e ele aparece na lista

**3.5 Tela: Compras (Gerar Pedido Real)**
- Arquivo: `merchant-portal/src/pages/Owner/PurchasesPage.tsx`
- Criar hooks:
  - `useShoppingList(restaurantId)` → busca lista automática
  - `useGenerateShoppingList(restaurantId)` → chama RPC `generate_shopping_list`
  - `useCreatePurchaseOrder(restaurantId, items[])` → chama RPC `create_purchase_order`
- Modificar tela:
  - Lista automática gerada quando estoque < mínimo
  - Botão "Gerar lista automática" → chama RPC
  - Botão "Criar Pedido" → chama RPC
  - Mostrar histórico de pedidos anteriores
- **Critério:** Lista automática aparece quando há estoque crítico

---

## 🧪 TESTE DE VALIDAÇÃO OBRIGATÓRIO

**Cenário End-to-End:**
1. Login como Dono
2. Criar restaurante via wizard:
   - Nome: "Restaurante Teste"
   - 5 mesas
   - 3 itens no cardápio
   - 1 funcionário (Garçom)
3. Ver dashboard com dados reais (0 pedidos, 0 SLAs)
4. Criar pedido na Operação:
   - Mesa 1
   - 1 item do cardápio
5. Ver pedido aparecer no KDS
6. Marcar item como pronto no KDS
7. Ver pedido fechar automaticamente
8. Ver estoque consumir o item usado
9. Ver dashboard atualizado (1 pedido, 0 SLAs violados)

**Critério de Pronto:**
- ✅ Fluxo completo funciona sem erros
- ✅ Dados persistem após refresh
- ✅ Nenhum placeholder visível

---

## ⚠️ REGRAS IMPORTANTES

1. **Não criar novas features** — só conectar o que já existe
2. **Não adicionar telas** — só modificar as 5 telas-chave
3. **Usar RPCs existentes** — verificar `core_schema.sql` antes de criar novos
4. **Validar dados** — todos os inputs devem ter validação
5. **Feedback visual** — todas as ações devem ter loading/sucesso/erro
6. **Persistência** — todos os dados devem vir do banco, não de placeholders

---

## 📊 ESTRUTURA DE ARQUIVOS ESPERADA

```
merchant-portal/src/
├── auth/
│   ├── AuthContext.tsx (NOVO)
│   └── useAuth.ts (NOVO)
├── pages/
│   ├── Auth/
│   │   └── LoginPage.tsx (NOVO)
│   ├── Onboarding/
│   │   └── RestaurantWizard.tsx (NOVO)
│   ├── Employee/
│   │   ├── OperationPage.tsx (MODIFICAR)
│   │   └── KDSIntelligentPage.tsx (MODIFICAR)
│   ├── Owner/
│   │   ├── StockRealPage.tsx (MODIFICAR)
│   │   └── PurchasesPage.tsx (MODIFICAR)
│   └── Manager/
│       └── ScheduleCreatePage.tsx (MODIFICAR)
└── features/
    ├── orders/
    │   └── hooks/useActiveOrders.ts (NOVO)
    ├── kds/
    │   └── hooks/useKDSByStation.ts (NOVO)
    ├── stock/
    │   └── hooks/useStockItems.ts (NOVO)
    ├── schedule/
    │   └── hooks/useCreateShift.ts (NOVO)
    └── purchases/
        └── hooks/useShoppingList.ts (NOVO)
```

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

## 🚀 COMEÇAR AGORA

Execute as tarefas na ordem:
1. Portal 1 (Identidade) — 2-3h
2. Portal 2 (Onboarding) — 4-5h
3. Portal 3 (Conexão) — 8-10h
4. Teste End-to-End — validar tudo

**Tempo total estimado:** 16-21 horas (2-3 dias úteis)

---

**Prompt criado em:** 26/01/2026  
**Status:** ✅ Pronto para execução
