# 🎯 PLANO DE FECHAMENTO DE PRODUTO - ChefIApp

**Data:** 2026-01-30  
**Objetivo:** Finalizar ChefIApp como PRODUTO REAL DE MERCADO (vendável comercialmente)  
**Base:** `docs/audit/FINAL_PRODUCT_AUDIT.md`  
**Tempo Total:** 6 semanas

---

## ⚡ TL;DR (30 segundos)

**3 bloqueadores críticos:**
1. Billing não integrado no fluxo principal (2-3 semanas)
2. Onboarding não garante primeira venda (1 semana)
3. Gamificação pendente (2 semanas ou 1 dia)

**Decisão obrigatória:** Implementar gamificação nível mínimo OU remover código.

**Resultado:** Após 6 semanas, produto vendável comercialmente (self-service).

---

# PARTE 1 — BILLING (BLOQUEADOR CRÍTICO)

## Objetivo

**Usuário NÃO pode operar TPV sem plano ativo (exceto trial).**

---

## Fluxo Exato de Billing no Onboarding

### Fluxo Atual vs Fluxo Necessário

**Fluxo Atual:**
```
Login → Bootstrap (cria restaurante) → OnboardingQuick (2 telas) → Dashboard
```

**Fluxo Necessário:**
```
Login → Bootstrap (cria restaurante) → OnboardingQuick (2 telas) → 
BillingStep (escolher plano) → CheckoutStep (configurar pagamento) → 
TrialStart (ativar trial) → Dashboard (com RequireActivation)
```

---

### Tela 1: BillingStep (Escolher Plano)

**Quando aparece:** Após `OnboardingQuick` completar (antes de ir para dashboard)

**O que mostra:**
- 3 planos: STARTER (€29), PROFESSIONAL (€59), ENTERPRISE (€149)
- Features por plano (usar `FeatureGateService`)
- Botão "Começar Trial" (14 dias para todos)
- Botão "Pular Trial" (paga imediatamente)

**Ação do usuário:**
- Escolhe plano
- Clica "Começar Trial" OU "Pagar Agora"

**Backend:**
- Chama `RestaurantOnboardingService.createSubscription()`
- Se trial: `status = 'TRIAL'`, `trial_ends_at = now + 14 days`
- Se pago: `status = 'ACTIVE'`, precisa `client_secret` do Stripe

**Arquivo:** `merchant-portal/src/pages/Onboarding/BillingStep.tsx` (NOVO)

---

### Tela 2: CheckoutStep (Configurar Pagamento)

**Quando aparece:** Se usuário escolheu "Pagar Agora" OU se trial está acabando

**O que mostra:**
- Formulário Stripe Elements (card input)
- Valor do plano escolhido
- Botão "Confirmar Pagamento"

**Ação do usuário:**
- Preenche cartão
- Clica "Confirmar Pagamento"

**Backend:**
- Chama `StripeBillingService.createSubscription()` (já existe)
- Recebe `client_secret`
- Confirma pagamento via Stripe Elements
- Atualiza subscription: `status = 'ACTIVE'`

**Arquivo:** `merchant-portal/src/pages/Onboarding/CheckoutStep.tsx` (NOVO)

---

### Tela 3: TrialStart (Ativar Trial)

**Quando aparece:** Se usuário escolheu "Começar Trial"

**O que mostra:**
- "Trial de 14 dias ativado!"
- "Você será cobrado em [data]"
- Botão "Configurar Método de Pagamento" (opcional, mas recomendado)
- Botão "Continuar para Dashboard"

**Ação do usuário:**
- Pode configurar pagamento agora OU depois
- Clica "Continuar para Dashboard"

**Backend:**
- Subscription já criada com `status = 'TRIAL'`
- Se configurar pagamento: chama `StripeBillingService.attachPaymentMethod()`

**Arquivo:** `merchant-portal/src/pages/Onboarding/TrialStart.tsx` (NOVO)

---

## Componentes de Frontend Necessários

### 1. BillingStep.tsx (NOVO)
**Localização:** `merchant-portal/src/pages/Onboarding/BillingStep.tsx`

**Props:**
```typescript
interface BillingStepProps {
  restaurantId: string;
  onComplete: (planId: string, startTrial: boolean) => void;
}
```

**Funcionalidades:**
- Lista planos (usar `DEFAULT_PLANS` de `billing-core/types.ts`)
- Mostra features por plano (usar `FeatureGateService`)
- Botão "Começar Trial" / "Pagar Agora"
- Chama `RestaurantOnboardingService.createSubscription()`

**Dependências:**
- `billing-core/onboarding.ts` (já existe)
- `billing-core/types.ts` (já existe)

---

### 2. CheckoutStep.tsx (NOVO)
**Localização:** `merchant-portal/src/pages/Onboarding/CheckoutStep.tsx`

**Props:**
```typescript
interface CheckoutStepProps {
  restaurantId: string;
  planId: string;
  clientSecret: string; // Do Stripe
  onComplete: () => void;
}
```

**Funcionalidades:**
- Integração Stripe Elements (card input)
- Confirmação de pagamento
- Feedback visual (loading, success, error)

**Dependências:**
- `@stripe/stripe-js` (instalar se não existir)
- `@stripe/react-stripe-js` (instalar se não existir)

---

### 3. TrialStart.tsx (NOVO)
**Localização:** `merchant-portal/src/pages/Onboarding/TrialStart.tsx`

**Props:**
```typescript
interface TrialStartProps {
  restaurantId: string;
  subscription: Subscription;
  onComplete: () => void;
}
```

**Funcionalidades:**
- Mostra data de término do trial
- Botão opcional "Configurar Método de Pagamento"
- Botão "Continuar para Dashboard"

**Dependências:**
- `billing-core/types.ts` (já existe)

---

### 4. Atualizar OnboardingQuick.tsx
**Modificação:** Adicionar redirecionamento para `BillingStep` após completar

**Mudança:**
```typescript
// ANTES (linha 103):
navigate('/app/dashboard');

// DEPOIS:
navigate('/onboarding/billing', { state: { restaurantId } });
```

---

### 5. Atualizar FlowGate.tsx
**Modificação:** Adicionar rota `/onboarding/billing` no fluxo

**Mudança:**
- Adicionar verificação: se `subscription.status === null`, redirecionar para `/onboarding/billing`

---

## Rotas que Devem ser Protegidas por RequireActivation

### Rotas Críticas (Bloquear se não tiver subscription ativa)

**Lista completa:**
1. `/app/tpv` — TPV principal
2. `/app/dashboard` — Dashboard
3. `/app/menu` — Menu Manager
4. `/app/kds` — KDS
5. `/app/settings` — Settings (exceto billing)

**Rotas que NÃO devem bloquear:**
- `/onboarding/*` — Onboarding completo
- `/app/settings/billing` — Página de billing (precisa acessar para pagar)

---

### Atualizar RequireActivation.tsx

**Modificação:** Verificar subscription status, não só `operation_status`

**Mudança:**
```typescript
// ANTES (linha 53):
const isActiveInDB = restaurant?.operation_status === 'active' ||
    (restaurant as any)?.operation_mode === 'Gamified' ||
    (restaurant as any)?.operation_mode === 'Active';

// DEPOIS:
const subscription = await fetchSubscription(restaurant.id);
const isActiveInDB = 
    subscription?.status === 'ACTIVE' || 
    subscription?.status === 'TRIAL' ||
    restaurant?.operation_status === 'active';
```

**Arquivo:** `merchant-portal/src/core/activation/RequireActivation.tsx`

---

## Estados Possíveis (Subscription Status)

### TRIAL
- **Permite:** Tudo (TPV, KDS, Menu, etc.)
- **Bloqueia:** Nada
- **Ação:** Mostrar banner "Trial termina em X dias"

### ACTIVE
- **Permite:** Tudo
- **Bloqueia:** Nada
- **Ação:** Nenhuma

### PAST_DUE
- **Permite:** TPV básico (vendas)
- **Bloqueia:** Analytics Pro, API Access
- **Ação:** Banner "Pagamento pendente. Renovar agora."

### SUSPENDED
- **Permite:** Nada (só visualização)
- **Bloqueia:** Tudo (TPV, KDS, vendas)
- **Ação:** Banner "Conta suspensa. Reativar agora."

### CANCELLED
- **Permite:** Nada
- **Bloqueia:** Tudo
- **Ação:** Redirecionar para `/onboarding/billing`

---

## Checklist Técnico

### Backend (Já existe, verificar integração)
- [x] `StripeBillingService.ts` — Criar subscription
- [x] `RestaurantOnboardingService.ts` — Onboarding com billing
- [x] `FeatureGateService.ts` — Feature gates por plano
- [x] Edge Functions — `stripe-billing`, `stripe-billing-webhook`
- [ ] Verificar se webhooks estão configurados no Stripe

### Frontend (Criar/Atualizar)
- [ ] `BillingStep.tsx` — Escolher plano
- [ ] `CheckoutStep.tsx` — Configurar pagamento
- [ ] `TrialStart.tsx` — Ativar trial
- [ ] Atualizar `OnboardingQuick.tsx` — Redirecionar para billing
- [ ] Atualizar `FlowGate.tsx` — Adicionar rota billing
- [ ] Atualizar `RequireActivation.tsx` — Verificar subscription
- [ ] Atualizar `App.tsx` — Proteger rotas críticas
- [ ] Instalar `@stripe/stripe-js` e `@stripe/react-stripe-js`

### Integração
- [ ] Conectar `BillingStep` com `RestaurantOnboardingService`
- [ ] Conectar `CheckoutStep` com `StripeBillingService`
- [ ] Conectar `RequireActivation` com subscription status
- [ ] Testar fluxo completo: Login → Onboarding → Billing → Dashboard

---

## Checklist de UX

### BillingStep
- [ ] Planos claros (preço, features)
- [ ] Botão "Começar Trial" destacado
- [ ] Botão "Pagar Agora" secundário
- [ ] Feedback visual (loading, success, error)

### CheckoutStep
- [ ] Formulário Stripe Elements claro
- [ ] Valor do plano visível
- [ ] Botão "Confirmar Pagamento" destacado
- [ ] Feedback visual (loading, success, error)

### TrialStart
- [ ] Data de término do trial clara
- [ ] Botão "Configurar Método de Pagamento" opcional
- [ ] Botão "Continuar para Dashboard" destacado

### RequireActivation
- [ ] Banner claro quando bloqueado
- [ ] Link para renovar/ativar
- [ ] Mensagem de erro clara

---

## Critério de Pronto

**Billing está resolvido quando:**
1. ✅ Usuário não pode acessar TPV sem subscription (TRIAL ou ACTIVE)
2. ✅ Onboarding inclui escolha de plano obrigatória
3. ✅ Trial é ativado automaticamente após escolher plano
4. ✅ Checkout funciona (Stripe Elements integrado)
5. ✅ `RequireActivation` bloqueia rotas críticas se subscription não ativa
6. ✅ Estados PAST_DUE e SUSPENDED bloqueiam operação corretamente
7. ✅ Webhooks do Stripe processam eventos corretamente

**Teste manual:**
1. Criar novo usuário
2. Completar onboarding
3. Escolher plano (trial)
4. Tentar acessar TPV (deve funcionar)
5. Tentar acessar TPV com subscription SUSPENDED (deve bloquear)

---

# PARTE 2 — ONBOARDING (PRIMEIRA VENDA)

## Objetivo

**Primeira venda em menos de 10 minutos.**

---

## Fluxo Mínimo Obrigatório até Primeira Venda

### Fluxo Atual vs Fluxo Necessário

**Fluxo Atual:**
```
OnboardingQuick (2 telas) → Billing → Dashboard → [usuário precisa criar menu manualmente]
```

**Fluxo Necessário:**
```
OnboardingQuick (2 telas) → Billing → MenuDemo (criar menu de exemplo) → 
FirstSaleGuide (tutorial) → TPV (modo demo) → Primeira Venda Real
```

---

### Tela 1: MenuDemo (Criar Menu de Exemplo)

**Quando aparece:** Após billing completar (antes de dashboard)

**O que mostra:**
- "Vamos criar seu primeiro menu!"
- 3 opções:
  1. **"Usar Menu de Exemplo"** (recomendado) — Cria 5-10 itens automaticamente
  2. **"Criar Menu Manualmente"** — Abre Menu Manager
  3. **"Pular por Agora"** — Vai para dashboard (não recomendado)

**Ação do usuário:**
- Escolhe opção (recomendado: "Usar Menu de Exemplo")

**Backend:**
- Se "Usar Menu de Exemplo": Chama função que cria categorias + itens de exemplo
- Itens de exemplo baseados no tipo de negócio (Restaurante, Café, Bar, etc.)

**Arquivo:** `merchant-portal/src/pages/Onboarding/MenuDemo.tsx` (NOVO)

---

### Tela 2: FirstSaleGuide (Tutorial de Primeira Venda)

**Quando aparece:** Após menu criado (antes de TPV)

**O que mostra:**
- "Agora vamos fazer sua primeira venda!"
- Passo a passo visual:
  1. "Abra o TPV"
  2. "Selecione uma mesa (ou balcão)"
  3. "Adicione itens do menu"
  4. "Processe o pagamento"
- Botão "Fazer Primeira Venda" (abre TPV em modo demo)

**Ação do usuário:**
- Lê tutorial
- Clica "Fazer Primeira Venda"

**Arquivo:** `merchant-portal/src/pages/Onboarding/FirstSaleGuide.tsx` (NOVO)

---

### Tela 3: TPV (Modo Demo)

**Quando aparece:** Após clicar "Fazer Primeira Venda"

**O que mostra:**
- TPV normal, mas com banner "Modo Demo"
- Dados de exemplo pré-preenchidos:
  - Mesa 1 selecionada
  - 2-3 itens já no carrinho
- Botão "Processar Pagamento" (não cria pagamento real, só mostra sucesso)

**Ação do usuário:**
- Vê como funciona
- Clica "Processar Pagamento" (demo)
- Vê mensagem "Primeira venda concluída! Agora você pode fazer vendas reais."

**Arquivo:** Modificar `merchant-portal/src/pages/TPV/TPV.tsx` (adicionar modo demo)

---

## Menu de Exemplo

### Estrutura de Dados

**Para Restaurante:**
```typescript
const exampleMenu = {
  categories: [
    { name: 'Entradas', items: [
      { name: 'Bruschetta', price: 8.50 },
      { name: 'Salada Caesar', price: 12.00 }
    ]},
    { name: 'Principais', items: [
      { name: 'Hambúrguer Artesanal', price: 15.00 },
      { name: 'Pizza Margherita', price: 14.00 }
    ]},
    { name: 'Bebidas', items: [
      { name: 'Coca-Cola', price: 3.50 },
      { name: 'Água', price: 2.00 }
    ]}
  ]
};
```

**Para Café:**
```typescript
const exampleMenu = {
  categories: [
    { name: 'Cafés', items: [
      { name: 'Espresso', price: 2.50 },
      { name: 'Cappuccino', price: 3.50 }
    ]},
    { name: 'Doces', items: [
      { name: 'Pastel de Nata', price: 2.00 },
      { name: 'Bolo de Chocolate', price: 4.50 }
    ]}
  ]
};
```

**Arquivo:** `merchant-portal/src/pages/Onboarding/exampleMenus.ts` (NOVO)

---

## Pedido Demo

**Não necessário.** Modo demo no TPV é suficiente.

---

## Modo Treino

**Não necessário.** Modo demo no TPV é suficiente.

---

## Onde o Sistema Deve Guiar, Forçar, Bloquear

### Guiar
- ✅ Mostrar tutorial visual (FirstSaleGuide)
- ✅ Pré-preencher dados no modo demo
- ✅ Mostrar mensagens de sucesso após cada passo

### Forçar
- ✅ Não permitir pular MenuDemo (ou pelo menos desencorajar fortemente)
- ✅ Não permitir acessar TPV sem menu criado (ou mostrar aviso)

### Bloquear
- ❌ NÃO bloquear acesso ao dashboard (usuário pode voltar depois)
- ❌ NÃO bloquear acesso ao TPV (usuário pode testar)

---

## Novo Fluxo Resumido (Passo a Passo)

1. **Login** → Bootstrap (cria restaurante)
2. **OnboardingQuick** → Nome + Tipo de negócio + Modelo operacional
3. **BillingStep** → Escolher plano (trial ou pago)
4. **CheckoutStep** (se pago) → Configurar pagamento
5. **TrialStart** (se trial) → Ativar trial
6. **MenuDemo** → Criar menu (exemplo ou manual)
7. **FirstSaleGuide** → Tutorial de primeira venda
8. **TPV (Modo Demo)** → Fazer primeira venda demo
9. **Dashboard** → Acesso completo

**Tempo estimado:** 8-10 minutos

---

## O que Reaproveitar do Código Atual

### OnboardingQuick.tsx
- ✅ Reaproveitar 100% (só adicionar redirecionamento para billing)

### Menu Manager
- ✅ Reaproveitar 100% (usar para criar menu manualmente)

### TPV.tsx
- ✅ Reaproveitar 90% (adicionar modo demo)

### FlowGate.tsx
- ✅ Reaproveitar 100% (adicionar verificação de menu)

---

## Critério Objetivo de Sucesso

**Onboarding garante primeira venda quando:**
1. ✅ Menu é criado automaticamente (exemplo) OU manualmente (guiado)
2. ✅ Tutorial de primeira venda é mostrado
3. ✅ Modo demo permite testar sem dados reais
4. ✅ Primeira venda real pode ser feita em <10 minutos desde login
5. ✅ Usuário entende como usar o TPV após tutorial

**Teste manual:**
1. Criar novo usuário
2. Completar onboarding completo
3. Medir tempo até primeira venda real
4. Verificar se usuário consegue fazer venda sem ajuda

**Meta:** <10 minutos do login até primeira venda real

---

# PARTE 3 — GAMIFICAÇÃO INTERNA (DECISÃO FINAL)

## Decisão Obrigatória

**Implementar nível mínimo (2 semanas) OU Remover código (1 dia)**

**Recomendação:** **Implementar nível mínimo** (motiva equipe, diferencial, código já existe)

---

## Nível Mínimo Aceitável para Mercado

### 1. Pontos Básicos
- Completar tarefa = 10 pontos
- Completar tarefa crítica = 20 pontos
- Processar pagamento = 5 pontos

**Implementação:**
- Usar `GamificationService.awardPoints()` (já existe)
- Chamar após completar tarefa no `NowEngine`
- Chamar após processar pagamento no `PaymentEngine`

---

### 2. Rankings Simples
- Top 10 da equipe (semanal)
- Mostrar: Nome, Pontos, Posição

**Implementação:**
- Usar `GamificationService.getLeaderboard()` (já existe)
- Criar tela `LeaderboardScreen.tsx` no mobile app
- Atualizar semanalmente (cron job ou manual)

---

### 3. Achievements Básicos
- 5 achievements mínimos:
  1. **"Primeiro Passo"** — Completar primeira tarefa (10 pontos)
  2. **"Velocidade"** — Completar 10 tarefas em um turno (50 pontos)
  3. **"Qualidade"** — 50 tarefas sem erro (100 pontos)
  4. **"Vendas"** — Processar €100 em vendas (75 pontos)
  5. **"Equipe"** — Ajudar 5 colegas (25 pontos)

**Implementação:**
- Usar `GamificationService.checkAchievements()` (já existe)
- Chamar após cada ação relevante
- Mostrar notificação quando achievement desbloqueado

---

## O que Já Existe no Backend

### GamificationService.ts
- ✅ `awardPoints()` — Dar pontos
- ✅ `checkAchievements()` — Verificar achievements
- ✅ `getUserScore()` — Obter pontuação do usuário
- ✅ `getLeaderboard()` — Obter ranking

**Arquivo:** `merchant-portal/src/core/gamification/GamificationService.ts` (já existe)

---

## O que Falta Apenas Expor no App

### Mobile App (AppStaff)

**Telas mínimas necessárias:**
1. **LeaderboardScreen.tsx** (NOVO)
   - Mostrar top 10 da equipe
   - Mostrar pontuação do usuário atual
   - Atualizar semanalmente

2. **AchievementsScreen.tsx** (NOVO)
   - Mostrar achievements desbloqueados
   - Mostrar achievements disponíveis (bloqueados)
   - Mostrar progresso para cada achievement

3. **Atualizar StaffScreen.tsx**
   - Adicionar botão "Ranking" na tab bar
   - Mostrar pontuação do usuário no header

**Integrações necessárias:**
- Chamar `awardPoints()` após completar tarefa
- Chamar `checkAchievements()` após cada ação relevante
- Mostrar notificação quando achievement desbloqueado

---

## Escopo Fechado (2 Semanas)

### Semana 1: Backend + Integrações
- [ ] Verificar schema SQL (tabelas `user_scores`, `user_achievements`)
- [ ] Criar migrations se necessário
- [ ] Integrar `awardPoints()` no `NowEngine` (após completar tarefa)
- [ ] Integrar `awardPoints()` no `PaymentEngine` (após processar pagamento)
- [ ] Integrar `checkAchievements()` após cada ação relevante
- [ ] Testar backend completo

### Semana 2: Frontend (Mobile App)
- [ ] Criar `LeaderboardScreen.tsx`
- [ ] Criar `AchievementsScreen.tsx`
- [ ] Atualizar `StaffScreen.tsx` (adicionar botão Ranking)
- [ ] Adicionar notificações quando achievement desbloqueado
- [ ] Testar fluxo completo

---

## Telas Mínimas

### 1. LeaderboardScreen.tsx
**Localização:** `mobile-app/app/(tabs)/leaderboard.tsx` (NOVO)

**Funcionalidades:**
- Lista top 10 da equipe
- Mostra pontuação do usuário atual
- Atualiza semanalmente

**Dependências:**
- `GamificationService.getLeaderboard()` (já existe)

---

### 2. AchievementsScreen.tsx
**Localização:** `mobile-app/app/(tabs)/achievements.tsx` (NOVO)

**Funcionalidades:**
- Lista achievements desbloqueados
- Lista achievements disponíveis (bloqueados)
- Mostra progresso para cada achievement

**Dependências:**
- `GamificationService.getUserScore()` (já existe)

---

### 3. Atualizar StaffScreen.tsx
**Modificação:** Adicionar botão "Ranking" na tab bar

**Mudança:**
```typescript
// Adicionar na tab bar:
<Tab.Screen name="leaderboard" component={LeaderboardScreen} />
```

---

## Critério de Pronto

**Gamificação está implementada quando:**
1. ✅ Pontos são atribuídos automaticamente (tarefas, pagamentos)
2. ✅ Rankings são visíveis no mobile app (top 10 semanal)
3. ✅ Achievements são desbloqueados automaticamente
4. ✅ Notificações aparecem quando achievement desbloqueado
5. ✅ Usuário pode ver sua pontuação e achievements

**Teste manual:**
1. Completar tarefa → Verificar se pontos foram atribuídos
2. Processar pagamento → Verificar se pontos foram atribuídos
3. Desbloquear achievement → Verificar se notificação aparece
4. Abrir Leaderboard → Verificar se ranking está correto

---

## Alternativa: Remover Código (1 Dia)

**Se decidir NÃO implementar:**

1. Remover `GamificationService.ts`
2. Remover referências no código
3. Remover schema SQL (se existir)
4. Atualizar documentação

**Tempo:** 1 dia

**Recomendação:** **NÃO remover** (código já existe, implementar é rápido, motiva equipe)

---

# PARTE 4 — APLICATIVOS (POLIMENTO FINAL)

## Objetivo

**Ajustar para parecer produto final (não dev tool), sem refatoração grande.**

---

## Mobile App (AppStaff)

### Ajustes Necessários (Máx. 5)

1. **Role Selector Menos Técnico** 🔴 CRÍTICO
   - **Problema:** `RoleSelectorDevPanel.tsx` parece dev tool
   - **Solução:** Criar `RoleSelector.tsx` com UI amigável
   - **Arquivo:** `mobile-app/components/RoleSelector.tsx` (NOVO)
   - **Tempo:** 2 dias

2. **Performance em Telas Pesadas** 🟡 ALTO
   - **Problema:** Algumas telas podem melhorar performance
   - **Solução:** Adicionar `React.memo()` em componentes pesados
   - **Arquivos:** `mobile-app/app/(tabs)/manager.tsx`, `mobile-app/app/(tabs)/orders.tsx`
   - **Tempo:** 1 dia

3. **Feedback Visual Consistente** 🟡 MÉDIO
   - **Problema:** Algumas ações não têm feedback visual
   - **Solução:** Adicionar haptic feedback em ações críticas
   - **Arquivos:** Vários (adicionar onde falta)
   - **Tempo:** 1 dia

4. **Gamificação Integrada** 🔴 CRÍTICO (se decidir implementar)
   - **Problema:** Gamificação não está no app
   - **Solução:** Ver PARTE 3
   - **Tempo:** 2 semanas (já contabilizado)

5. **Offline Banner Mais Visível** 🟡 BAIXO
   - **Problema:** Banner pode ser mais visível
   - **Solução:** Melhorar design do `OfflineBanner.tsx`
   - **Arquivo:** `mobile-app/components/OfflineBanner.tsx`
   - **Tempo:** 0.5 dia

---

### O que NÃO Deve ser Tocado

- ❌ Refatoração grande de arquitetura
- ❌ Mudanças em lógica de negócio
- ❌ Adição de novas features
- ❌ Refatoração de `AppStaffContext.tsx` (funciona bem)

---

## Web TPV

### Ajustes Necessários (Máx. 5)

1. **Performance em Mobile** 🟡 ALTO
   - **Problema:** TPV pode ser lento em dispositivos móveis
   - **Solução:** Adicionar lazy loading, code splitting
   - **Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`
   - **Tempo:** 2 dias

2. **Organização de Código** 🟡 MÉDIO
   - **Problema:** 12k linhas em um arquivo
   - **Solução:** **NÃO refatorar agora** (funciona, não é bloqueador)
   - **Ação:** Documentar estrutura interna, adiar refatoração
   - **Tempo:** 0 dias (documentar apenas)

3. **Feedback Visual em Ações Críticas** 🟡 MÉDIO
   - **Problema:** Algumas ações não têm feedback visual
   - **Solução:** Adicionar toasts/notifications
   - **Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`
   - **Tempo:** 1 dia

4. **Modo Demo no TPV** 🔴 CRÍTICO (para onboarding)
   - **Problema:** Não existe modo demo
   - **Solução:** Adicionar modo demo (ver PARTE 2)
   - **Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`
   - **Tempo:** 1 dia (já contabilizado em PARTE 2)

5. **Billing Integrado** 🔴 CRÍTICO (já contabilizado em PARTE 1)
   - **Problema:** Billing não está integrado
   - **Solução:** Ver PARTE 1
   - **Tempo:** 2-3 semanas (já contabilizado)

---

### O que NÃO Deve ser Tocado

- ❌ Refatoração grande do TPV (12k linhas) — funciona, adiar
- ❌ Mudanças em lógica de negócio
- ❌ Adição de novas features
- ❌ Refatoração de `OrderContext.tsx` (funciona bem)

---

## Lista Curta de Ajustes

### Mobile App
1. Role Selector menos técnico (2 dias)
2. Performance em telas pesadas (1 dia)
3. Feedback visual consistente (1 dia)
4. Gamificação integrada (2 semanas, se decidir)
5. Offline banner mais visível (0.5 dia)

**Total:** 4.5 dias + 2 semanas (se gamificação)

### Web TPV
1. Performance em mobile (2 dias)
2. Organização de código (0 dias — documentar apenas)
3. Feedback visual (1 dia)
4. Modo demo (1 dia — já contabilizado)
5. Billing integrado (2-3 semanas — já contabilizado)

**Total:** 3 dias + billing (já contabilizado)

---

# PARTE 5 — IMPRESSÃO (FECHAMENTO)

## Decisão Clara

**Browser print é suficiente para MVP comercial.**

---

## O que é Obrigatório para Mercado

### 1. Impressão via Browser ✅ JÁ EXISTE
- **Status:** Implementado
- **Arquivo:** `merchant-portal/src/core/fiscal/FiscalPrinter.ts`
- **Avaliação:** Funciona bem, suficiente para maioria dos restaurantes

---

## O que é Nice-to-Have

### 1. UI de Configuração de Impressoras 🟡
- **Status:** Não implementado
- **Impacto:** BAIXO (configuração manual via AsyncStorage funciona)
- **Decisão:** **ADIAR** (não é bloqueador)

### 2. Descoberta Automática de Impressoras 🟡
- **Status:** Não implementado
- **Impacto:** BAIXO (configuração manual funciona)
- **Decisão:** **ADIAR** (não é bloqueador)

### 3. Suporte a Impressoras Fiscais Dedicadas 🟡
- **Status:** Não implementado (Epson, Star)
- **Impacto:** BAIXO (browser print funciona para maioria)
- **Decisão:** **ADIAR** (não é bloqueador)

---

## O que Pode ser Explicitamente Adiado

**Tudo relacionado a impressão física (térmica, fiscal dedicada) pode ser adiado.**

**Justificativa:**
- Browser print funciona para 90% dos restaurantes
- Configuração manual via AsyncStorage funciona
- Não é bloqueador de mercado

---

## Decisão Final

**Browser print é suficiente para MVP comercial.**

**Ações:**
- ✅ Manter `FiscalPrinter.ts` como está
- ✅ Manter `PrinterService.ts` como está (para quem quiser usar)
- ❌ NÃO criar UI de configuração agora
- ❌ NÃO implementar descoberta automática agora
- ❌ NÃO implementar suporte a impressoras fiscais dedicadas agora

**Documentar:**
- Adicionar nota na documentação: "Browser print é o método padrão. Impressoras físicas podem ser configuradas manualmente."

---

## Critério de Pronto

**Impressão está fechada quando:**
1. ✅ Browser print funciona (já funciona)
2. ✅ Documentação clara sobre impressão (adicionar nota)
3. ✅ Decisão documentada: browser print é suficiente

**Teste manual:**
1. Processar pagamento
2. Imprimir recibo via browser
3. Verificar se recibo está correto

---

# PARTE 6 — VEREDITO FINAL

## Lista FINAL do que Precisa ser Feito (Checklist)

### Crítico (Bloqueador de Mercado)

1. **Billing integrado no fluxo principal** (2-3 semanas)
   - [ ] Criar `BillingStep.tsx`
   - [ ] Criar `CheckoutStep.tsx`
   - [ ] Criar `TrialStart.tsx`
   - [ ] Atualizar `OnboardingQuick.tsx`
   - [ ] Atualizar `FlowGate.tsx`
   - [ ] Atualizar `RequireActivation.tsx`
   - [ ] Proteger rotas críticas
   - [ ] Testar fluxo completo

2. **Onboarding garante primeira venda** (1 semana)
   - [ ] Criar `MenuDemo.tsx`
   - [ ] Criar `FirstSaleGuide.tsx`
   - [ ] Adicionar modo demo no TPV
   - [ ] Criar menu de exemplo
   - [ ] Testar fluxo completo

3. **Gamificação implementada ou removida** (2 semanas ou 1 dia)
   - [ ] Decidir: implementar OU remover
   - [ ] Se implementar: ver PARTE 3
   - [ ] Se remover: remover código

---

### Alto (Não Bloqueador, mas Importante)

4. **Role selector menos técnico** (2 dias)
   - [ ] Criar `RoleSelector.tsx`
   - [ ] Substituir `RoleSelectorDevPanel.tsx`

5. **Performance em mobile** (2 dias)
   - [ ] Adicionar lazy loading no TPV
   - [ ] Adicionar `React.memo()` em componentes pesados

6. **Feedback visual consistente** (1 dia)
   - [ ] Adicionar haptic feedback onde falta
   - [ ] Adicionar toasts/notifications

---

### Baixo (Nice-to-Have)

7. **Offline banner mais visível** (0.5 dia)
   - [ ] Melhorar design do `OfflineBanner.tsx`

8. **Documentação de impressão** (0.5 dia)
   - [ ] Adicionar nota sobre browser print

---

## Estimativa Realista de Tempo

### Semana 1-2: Billing
- BillingStep, CheckoutStep, TrialStart
- Integração com onboarding
- Proteção de rotas
- **Total:** 2 semanas

### Semana 3: Onboarding
- MenuDemo, FirstSaleGuide
- Modo demo no TPV
- Menu de exemplo
- **Total:** 1 semana

### Semana 4-5: Gamificação (se decidir implementar)
- Backend + integrações
- Frontend (mobile app)
- **Total:** 2 semanas

### Semana 6: Polimento
- Role selector
- Performance
- Feedback visual
- **Total:** 1 semana

**Tempo Total:** 6 semanas (com gamificação) OU 4 semanas (sem gamificação)

---

## Quando o ChefIApp Pode ser Considerado

### Produto Vendável (Self-Service)

**Após completar:**
- ✅ Billing integrado
- ✅ Onboarding garante primeira venda
- ✅ Gamificação implementada OU removida
- ✅ Polimento básico (role selector, performance)

**Tempo:** 6 semanas (com gamificação) OU 4 semanas (sem gamificação)

---

### Produto Escalável

**Após completar:**
- ✅ Tudo acima
- ✅ Refatoração TPV (12k linhas)
- ✅ Analytics melhorados
- ✅ Mapa visual completo

**Tempo:** 3-4 meses adicionais

**Decisão:** **ADIAR** (não é necessário para MVP comercial)

---

## Riscos se Algo NÃO for Feito

### Billing NÃO Integrado 🔴 ALTO
- **Risco:** Usuário pode usar TPV sem pagar
- **Impacto:** Perda de receita, produto não vendável
- **Mitigação:** OBRIGATÓRIO fazer

### Onboarding NÃO Garante Primeira Venda 🔴 MÉDIO
- **Risco:** Usuário não entende como usar
- **Impacto:** Churn alto, suporte excessivo
- **Mitigação:** OBRIGATÓRIO fazer

### Gamificação Pendente 🟡 BAIXO
- **Risco:** Código morto, confusão
- **Impacto:** Manutenção desnecessária
- **Mitigação:** Decidir (implementar OU remover)

### Role Selector Técnico 🟡 BAIXO
- **Risco:** Usuário confuso
- **Impacto:** UX ruim, mas não bloqueia uso
- **Mitigação:** Fazer se houver tempo

---

## 🎯 CONCLUSÃO FINAL

**ChefIApp está a 6 semanas de ser um produto real de mercado.**

**Ordem de execução:**
1. **Semanas 1-2:** Billing integrado
2. **Semana 3:** Onboarding garante primeira venda
3. **Semanas 4-5:** Gamificação (se decidir implementar)
4. **Semana 6:** Polimento básico

**Após isso:** Pronto para venda comercial (self-service).

**Decisão obrigatória:** Implementar gamificação nível mínimo OU remover código.

---

**Fim do Plano de Fechamento**
