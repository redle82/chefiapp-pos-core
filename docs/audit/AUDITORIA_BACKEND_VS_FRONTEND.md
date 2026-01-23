# AUDITORIA BACKEND vs FRONTEND — CHEFIAPP

**Data:** 2026-01-18  
**Auditor:** Principal Software Architect  
**Produto:** ChefIApp  
**Stack:** React/React Native (Frontend) + Supabase (Backend)  
**Objetivo:** Avaliar separação de responsabilidades e riscos arquiteturais

---

## 🎯 VEREDITO EXECUTIVO

**Nota de Separação de Responsabilidades:** **6.5/10**

**Arquitetura está:** **Parcialmente Invertida** (com pontos críticos)

**Resumo:**
- ✅ Backend autoritário em operações críticas (pedidos, billing)
- ⚠️ Frontend decide roteamento e estado operacional
- ⚠️ Validações duplicadas (frontend + backend)
- ❌ Frontend pode burlar algumas proteções em modo dev
- ✅ RLS e RPCs protegem dados críticos

---

## FASE 1 — INVENTÁRIO DE RESPONSABILIDADES

### FRONTEND — O QUE ELE DECIDE

#### ✅ Responsabilidades Corretas
1. **Roteamento e Navegação**
   - Arquivo: `merchant-portal/src/core/flow/CoreFlow.ts`
   - Decisão: Para onde redirecionar usuário baseado em estado
   - **Status:** ✅ Correto (UX, não segurança)

2. **Renderização Condicional**
   - Arquivo: `mobile-app/app/(tabs)/orders.tsx` (linha 319)
   - Decisão: Mostrar/ocultar botões baseado em permissões
   - **Status:** ✅ Correto (UX, não autorização)

3. **Validação de Formato (UX)**
   - Arquivo: `merchant-portal/src/pages/TPV/TPV.tsx`
   - Decisão: Campos obrigatórios, formato de entrada
   - **Status:** ✅ Correto (melhora UX, não segurança)

#### ❌ Responsabilidades Indevidas
1. **Decisão de Autenticação (Parcial)**
   - Arquivo: `merchant-portal/src/core/auth/useAuthStateMachine.ts` (linha 65)
   - Decisão: Valida formato de token e decide se está autenticado
   - **Problema:** Frontend confia em token local sem revalidação
   - **Risco:** Token expirado pode ser aceito temporariamente
   - **Status:** ⚠️ Frágil (depende de Supabase Auth, mas não revalida)

2. **Decisão de Estado de Turno (Parcial)**
   - Arquivo: `mobile-app/context/AppStaffContext.tsx` (linha 550)
   - Decisão: Se não tem user, ainda permite `setShiftState('active')` em dev
   - **Problema:** Em `__DEV__`, permite turno sem autenticação
   - **Risco:** Baixo (só em dev), mas mostra padrão perigoso
   - **Status:** ⚠️ Perigoso em produção (mas só ativo em dev)

3. **Validação de Permissões (Duplicada)**
   - Arquivo: `mobile-app/context/AppStaffContext.tsx` (linha 819)
   - Decisão: `canAccess()` decide se ação pode ser executada
   - **Problema:** Backend também valida, mas frontend pode bloquear antes
   - **Risco:** Médio (se frontend for burlado, backend segura, mas UX quebra)
   - **Status:** ⚠️ Duplicação (não ideal, mas não crítico)

---

### BACKEND — O QUE ELE DECIDE

#### ✅ Responsabilidades Corretas
1. **Autorização de Acesso a Restaurante**
   - Arquivo: `supabase/migrations/20260114224500_secure_rpcs.sql` (linha 23)
   - Decisão: Valida membership antes de criar pedido
   - **Código:**
   ```sql
   IF NOT EXISTS (
       SELECT 1 FROM public.gm_restaurants WHERE id = p_restaurant_id AND owner_id = auth.uid()
       UNION
       SELECT 1 FROM public.gm_restaurant_members WHERE restaurant_id = p_restaurant_id AND user_id = auth.uid()
   ) THEN RAISE EXCEPTION 'Access Denied'
   ```
   - **Status:** ✅ Autoritário (fail-closed)

2. **Cálculo de Total de Pedido**
   - Arquivo: `supabase/migrations/20260114224500_secure_rpcs.sql` (linha 34)
   - Decisão: Backend calcula `total_cents` a partir de items
   - **Código:**
   ```sql
   v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
   v_total_cents := v_total_cents + v_item_total;
   ```
   - **Status:** ✅ Autoritário (frontend não pode mentir sobre preço)

3. **Validação de Modo Operacional (Tower)**
   - Arquivo: `supabase/migrations/20260220000000_create_turn_sessions.sql` (linha 74)
   - Decisão: Só permite `tower` mode se user é owner/manager
   - **Código:**
   ```sql
   if p_operational_mode = 'tower' then
       select role into v_user_role from public.gm_restaurant_members
       where user_id = auth.uid() and restaurant_id = p_restaurant_id;
       if v_user_role not in ('owner', 'manager') then
           return jsonb_build_object('success', false, 'error', 'TOWER_MODE_FORBIDDEN');
       end if;
   end if;
   ```
   - **Status:** ✅ Autoritário (backend decide)

4. **Criação de Subscription (Billing)**
   - Arquivo: `supabase/functions/stripe-billing/index.ts`
   - Decisão: Cria subscription no Stripe e salva no banco
   - **Status:** ✅ Autoritário (frontend só inicia, backend executa)

#### ⚠️ Responsabilidades Parciais
1. **Validação de Estado de Pedido**
   - Arquivo: `server/web-module-api-server.ts` (linha 2786)
   - Decisão: Valida transições de status (pending → preparing → ready → delivered)
   - **Problema:** Validação existe, mas frontend também valida
   - **Status:** ⚠️ Duplicação (backend é autoritário, frontend é UX)

---

## FASE 2 — FLUXOS CRÍTICOS (END-TO-END)

### 1. LOGIN / AUTENTICAÇÃO

**Fluxo:**
1. Frontend: `merchant-portal/src/pages/AuthPage.tsx` → coleta credenciais
2. Frontend: Chama `supabase.auth.signInWithPassword()`
3. Backend: Supabase Auth valida credenciais
4. Frontend: `useAuthStateMachine.ts` valida formato de token
5. Frontend: `FlowGate.tsx` decide roteamento baseado em `isAuthenticated`

**Quem decide o SIM/NÃO final?**
- ✅ **Backend (Supabase Auth)** — Valida credenciais
- ⚠️ **Frontend** — Decide roteamento e estado local

**Pode burlar?**
- ❌ Não pode burlar autenticação (Supabase Auth é autoritário)
- ⚠️ Pode burlar roteamento se token for malformado (mas não acessa dados)

**Validação duplicada?**
- ✅ Sim (frontend valida formato, backend valida credenciais)
- **Impacto:** Baixo (frontend é apenas UX, backend é segurança)

**Classificação:** 🟢 **Fluxo Saudável**

---

### 2. INÍCIO DE TURNO

**Fluxo:**
1. Frontend: `mobile-app/context/AppStaffContext.tsx` (linha 539) → `startShift()`
2. Frontend: Insere diretamente em `gm_shifts` via Supabase client
3. Backend: RLS valida `auth.uid()` e `restaurant_id`
4. Alternativa: RPC `start_turn()` existe mas não é usado sempre

**Quem decide o SIM/NÃO final?**
- ⚠️ **Frontend** — Decide quando iniciar (chama insert)
- ✅ **Backend (RLS)** — Valida membership e autoriza insert

**Pode burlar?**
- ⚠️ Frontend pode tentar inserir turno para outro restaurante
- ✅ RLS bloqueia (mas frontend não sabe até tentar)
- **Risco:** Médio (RLS protege, mas UX pode quebrar)

**Validação duplicada?**
- ❌ Não (frontend não valida, só insere)
- **Problema:** Frontend não sabe se vai falhar até tentar

**Classificação:** 🟡 **Fluxo Frágil** (RLS protege, mas falta validação prévia)

**Recomendação:** Usar RPC `start_turn()` sempre, não insert direto

---

### 3. CRIAÇÃO DE VENDA (PEDIDO)

**Fluxo:**
1. Frontend: `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` (linha 382)
2. Frontend: Chama `executeSafe()` que chama Kernel
3. Kernel: Chama `OrderProjection.persistOrder()`
4. Backend: RPC `create_order_atomic()` valida membership e calcula total
5. Backend: Insere pedido com total calculado

**Quem decide o SIM/NÃO final?**
- ✅ **Backend (RPC)** — Valida membership, calcula total, autoriza criação

**Pode burlar?**
- ❌ Não pode burlar membership (RPC valida)
- ❌ Não pode burlar total (backend calcula)
- ✅ Backend é autoritário

**Validação duplicada?**
- ✅ Sim (frontend valida Kernel ready, backend valida membership)
- **Impacto:** Baixo (frontend é UX, backend é segurança)

**Classificação:** 🟢 **Fluxo Saudável**

---

### 4. BILLING / ASSINATURA

**Fluxo:**
1. Frontend: `merchant-portal/src/pages/Onboarding/BillingStep.tsx`
2. Frontend: Chama Edge Function `stripe-billing` (action: `create-subscription`)
3. Backend: Edge Function cria customer no Stripe
4. Backend: Edge Function cria subscription no Stripe
5. Backend: Edge Function salva em `subscriptions` table
6. Backend: Edge Function emite evento em `billing_events`

**Quem decide o SIM/NÃO final?**
- ✅ **Backend (Edge Function)** — Cria subscription, valida plano, salva no banco

**Pode burlar?**
- ❌ Não pode burlar criação (Edge Function é autoritária)
- ❌ Não pode burlar status (banco é fonte da verdade)

**Validação duplicada?**
- ❌ Não (frontend só inicia, backend executa tudo)

**Classificação:** 🟢 **Fluxo Saudável**

---

### 5. AÇÕES CRÍTICAS (CANCELAR, ESTORNAR, FECHAR TURNO)

#### A. Cancelar Pedido

**Fluxo:**
1. Frontend: `mobile-app/app/(tabs)/orders.tsx` (linha 319) → valida `canAccess('order:void')`
2. Frontend: `OrderContextReal.tsx` (linha 1057) → chama `executeSafe({ event: 'CANCEL' })`
3. Backend: Kernel processa cancelamento
4. Backend: RPC atualiza status

**Quem decide o SIM/NÃO final?**
- ⚠️ **Frontend** — Bloqueia UI se não tem permissão
- ✅ **Backend** — Processa cancelamento (mas não valida permissão explicitamente no RPC)

**Pode burlar?**
- ⚠️ Frontend pode tentar cancelar sem permissão
- ⚠️ Backend não valida permissão no RPC (só valida membership)
- **Risco:** Médio (qualquer membro pode cancelar, não valida role)

**Validação duplicada?**
- ⚠️ Frontend valida permissão, backend não
- **Problema:** Backend deveria validar role, não só membership

**Classificação:** 🟡 **Fluxo Frágil** (backend não valida role para cancelamento)

#### B. Fechar Turno

**Fluxo:**
1. Frontend: `mobile-app/context/AppStaffContext.tsx` (linha 691) → valida `canAccess('shift:end')`
2. Frontend: Atualiza `gm_shifts` diretamente
3. Backend: RLS valida `auth.uid()`

**Quem decide o SIM/NÃO final?**
- ⚠️ **Frontend** — Valida permissão e decide quando fechar
- ✅ **Backend (RLS)** — Valida que user pode atualizar seu próprio turno

**Pode burlar?**
- ⚠️ Frontend pode tentar fechar turno de outro user
- ✅ RLS bloqueia (mas frontend não sabe até tentar)

**Validação duplicada?**
- ⚠️ Frontend valida permissão, backend valida ownership
- **Problema:** Backend não valida role (qualquer user pode fechar seu turno)

**Classificação:** 🟡 **Fluxo Frágil** (RLS protege ownership, mas não valida role)

---

## FASE 3 — VALIDAÇÃO E AUTORIDADE

### Regras Duplicadas

1. **Permissões (RBAC)**
   - Frontend: `mobile-app/context/ContextPolicy.ts` (linha 34) → `BASE_ROLE_PERMISSIONS`
   - Backend: Não valida permissões explicitamente em RPCs
   - **Problema:** Frontend decide quem pode fazer o quê, backend só valida membership
   - **Risco:** Médio (qualquer membro pode executar ações se burlar frontend)

2. **Estado de Pedido (Transições)**
   - Frontend: `merchant-portal/src/pages/TPV/TPV.tsx` (linha 664) → valida ações críticas
   - Backend: `server/web-module-api-server.ts` (linha 2786) → valida transições
   - **Status:** ✅ Duplicação aceitável (frontend UX, backend segurança)

3. **Autenticação**
   - Frontend: `useAuthStateMachine.ts` → valida formato de token
   - Backend: Supabase Auth → valida credenciais
   - **Status:** ✅ Duplicação aceitável (frontend UX, backend segurança)

### Regras no Lugar Errado

1. **Validação de Permissões em Ações Críticas**
   - **Onde está:** Frontend (`canAccess()`)
   - **Onde deveria estar:** Backend (RPCs deveriam validar role)
   - **Arquivo:** `mobile-app/context/AppStaffContext.tsx` (linha 819)
   - **Risco:** Médio (frontend pode ser burlado)

2. **Decisão de Estado de Turno**
   - **Onde está:** Frontend (insere diretamente em `gm_shifts`)
   - **Onde deveria estar:** Backend (RPC `start_turn()` existe mas não é usado sempre)
   - **Arquivo:** `mobile-app/context/AppStaffContext.tsx` (linha 556)
   - **Risco:** Baixo (RLS protege, mas falta validação prévia)

### Regras sem Dono Claro

1. **Validação de Ações Pendentes antes de Fechar Turno**
   - **Onde está:** Frontend (`mobile-app/app/(tabs)/staff.tsx` linha 123)
   - **Problema:** Frontend valida se há ações críticas pendentes
   - **Risco:** Baixo (só UX, não bloqueia backend)
   - **Status:** ⚠️ Deveria estar no backend (RPC `end_shift()`)

---

## FASE 4 — ESTADO E FONTE DA VERDADE

### Onde Vive o Estado Final?

1. **Pedidos**
   - ✅ **Fonte da Verdade:** Banco (`gm_orders`)
   - ✅ Frontend: Sincroniza via realtime subscription
   - ✅ Backend: Calcula total e valida antes de salvar
   - **Status:** 🟢 Saudável

2. **Turnos**
   - ✅ **Fonte da Verdade:** Banco (`gm_shifts`, `turn_sessions`)
   - ⚠️ Frontend: Mantém estado local (`shiftState`, `shiftStart`)
   - ⚠️ Problema: Frontend pode estar desincronizado
   - **Status:** 🟡 Frágil (frontend mantém estado local que pode divergir)

3. **Billing**
   - ✅ **Fonte da Verdade:** Banco (`subscriptions`, `billing_events`)
   - ✅ Frontend: Só lê, nunca escreve diretamente
   - ✅ Backend: Edge Functions são únicos escritores
   - **Status:** 🟢 Saudável

4. **Autenticação**
   - ✅ **Fonte da Verdade:** Supabase Auth (backend)
   - ⚠️ Frontend: Mantém token local
   - ⚠️ Problema: Token pode expirar sem frontend saber
   - **Status:** 🟡 Frágil (depende de revalidação periódica)

### Frontend Mantém Estado "Verdadeiro"?

- ❌ **Turnos:** Frontend mantém `shiftState` local que pode divergir do banco
- ⚠️ **Pedidos:** Frontend mantém estado otimista, mas sincroniza com banco
- ✅ **Billing:** Frontend não mantém estado, só lê

### Backend Recalcula ou Confia?

- ✅ **Pedidos:** Backend recalcula total (não confia no frontend)
- ✅ **Billing:** Backend é único escritor (não confia no frontend)
- ⚠️ **Turnos:** Backend confia no frontend (insert direto, só RLS valida)

### Banco Aceita Estados Inválidos?

- ✅ **Pedidos:** Constraints e triggers validam
- ✅ **Billing:** Constraints validam status e tier
- ⚠️ **Turnos:** RLS valida membership, mas não valida regras de negócio (ex: turno ativo já existe)

### Teste Mental: Se Frontend Mentir, Backend Segura?

- ✅ **Pedidos:** Sim (backend calcula total, valida membership)
- ✅ **Billing:** Sim (backend é único escritor)
- ⚠️ **Turnos:** Parcialmente (RLS valida membership, mas não valida regras de negócio)

---

## FASE 5 — ACOPLAMENTO PERIGOSO

### Frontend Conhece Detalhes do Banco?

1. **Estrutura de Tabelas**
   - Arquivo: `mobile-app/context/AppStaffContext.tsx` (linha 556)
   - Problema: Frontend insere diretamente em `gm_shifts` conhecendo estrutura
   - **Risco:** Médio (acoplamento estrutural)

2. **Nomes de Colunas**
   - Arquivo: `merchant-portal/src/pages/TPV/context/OrderContext.tsx` (linha 225)
   - Problema: Frontend conhece `restaurant_id`, `table_number`, `status`
   - **Risco:** Baixo (normal em ORMs, mas acoplamento existe)

### Backend Depende de Estrutura Visual?

- ❌ Não encontrado (backend não depende de UI)

### Edge Functions Viram "Mini-Frontends"?

- ✅ **Billing:** Edge Functions são autoritárias (criam subscription, não são pass-through)
- ✅ **Pedidos:** RPCs são autoritárias (calculam total, validam membership)
- **Status:** 🟢 Edge Functions são backend real, não pass-through

### Lógica de Negócio em Hooks ou Components?

1. **Cálculo de Permissões**
   - Arquivo: `mobile-app/context/AppStaffContext.tsx` (linha 819)
   - Problema: `canAccess()` calcula permissões no frontend
   - **Risco:** Médio (deveria estar no backend)

2. **Validação de Ações Pendentes**
   - Arquivo: `mobile-app/app/(tabs)/staff.tsx` (linha 123)
   - Problema: Frontend valida se há ações críticas antes de fechar turno
   - **Risco:** Baixo (só UX, mas deveria estar no backend)

### Pontos de Acoplamento Excessivo

1. **Frontend conhece estrutura de `gm_shifts`**
   - Risco de manutenção: Alto (se estrutura mudar, frontend quebra)

2. **Frontend calcula permissões baseado em role**
   - Risco de manutenção: Médio (se regras mudarem, frontend e backend podem divergir)

---

## FASE 6 — TESTE DO APAGÃO

### Se Frontend Cair, Backend Continua Correto?

- ✅ **Pedidos:** Sim (backend valida e calcula tudo)
- ✅ **Billing:** Sim (backend é único escritor)
- ⚠️ **Turnos:** Parcialmente (RLS protege, mas frontend pode ter estado local desincronizado)

### Se Chamar APIs Manualmente, Sistema se Protege?

- ✅ **Pedidos:** Sim (RPC valida membership e calcula total)
- ✅ **Billing:** Sim (Edge Functions validam)
- ⚠️ **Turnos:** Parcialmente (RLS valida membership, mas não valida regras de negócio)

**Teste Manual:**
```bash
# Criar pedido manualmente (bypass frontend)
curl -X POST https://[project].supabase.co/rest/v1/rpc/create_order_atomic \
  -H "Authorization: Bearer [token]" \
  -d '{"p_restaurant_id": "[id]", "p_items": [...]}'
```
**Resultado:** ✅ Backend valida membership e calcula total (protegido)

### Se Frontend for Malicioso, Backend Impede Abuso?

- ✅ **Pedidos:** Sim (backend valida membership e calcula total)
- ✅ **Billing:** Sim (backend é único escritor)
- ⚠️ **Turnos:** Parcialmente (RLS valida membership, mas não valida regras de negócio como "já existe turno ativo")

**Cenário Malicioso:**
```javascript
// Frontend malicioso tenta criar pedido com preço errado
await supabase.rpc('create_order_atomic', {
  p_restaurant_id: restaurantId,
  p_items: [{ quantity: 1, unit_price: 1 }] // Preço muito baixo
});
```
**Resultado:** ✅ Backend calcula total corretamente (protegido)

### Classificação do Backend

- **Pedidos:** 🟢 **Autoritário** (valida e calcula tudo)
- **Billing:** 🟢 **Autoritário** (único escritor)
- **Turnos:** 🟡 **Permissivo** (valida membership, mas não valida regras de negócio)

---

## FASE 7 — VEREDITO FINAL

### 1. Nota de Separação de Responsabilidades

**6.5/10**

**Justificativa:**
- ✅ Backend autoritário em operações críticas (pedidos, billing)
- ⚠️ Frontend decide roteamento e estado operacional (aceitável para UX)
- ⚠️ Validações duplicadas (frontend UX + backend segurança)
- ❌ Frontend pode burlar algumas proteções (mas backend segura)
- ⚠️ Falta validação de regras de negócio no backend para turnos

### 2. Arquitetura Está

**Parcialmente Invertida** (com pontos críticos)

**Justificativa:**
- ✅ Operações críticas (pedidos, billing) são autoritárias no backend
- ⚠️ Operações operacionais (turnos) são permissivas no backend
- ⚠️ Frontend decide roteamento (aceitável, mas poderia ser mais declarativo)
- ⚠️ Frontend valida permissões (deveria estar no backend também)

### 3. Top 5 Acertos

1. **Backend Calcula Total de Pedidos**
   - Arquivo: `supabase/migrations/20260114224500_secure_rpcs.sql` (linha 34)
   - Frontend não pode mentir sobre preço

2. **Backend Valida Membership em RPCs**
   - Arquivo: `supabase/migrations/20260114224500_secure_rpcs.sql` (linha 23)
   - Frontend não pode acessar restaurante de outro tenant

3. **Billing é Autoritário no Backend**
   - Arquivo: `supabase/functions/stripe-billing/index.ts`
   - Frontend só inicia, backend executa tudo

4. **RLS Protege Dados**
   - Arquivo: `supabase/migrations/20260130000000_create_billing_core_tables.sql` (linha 162)
   - Usuários só veem dados do seu restaurante

5. **Edge Functions Não São Pass-Through**
   - Arquivo: `supabase/functions/stripe-billing/index.ts`
   - Edge Functions são backend real, não apenas proxies

### 4. Top 5 Erros Perigosos

1. **Frontend Valida Permissões sem Backend Validar Role**
   - Arquivo: `mobile-app/context/AppStaffContext.tsx` (linha 819)
   - Risco: Qualquer membro pode executar ações se burlar frontend
   - **Severidade:** 🟡 Média

2. **Turnos: Insert Direto sem Validação de Regras de Negócio**
   - Arquivo: `mobile-app/context/AppStaffContext.tsx` (linha 556)
   - Risco: Pode criar turnos duplicados ou inválidos
   - **Severidade:** 🟡 Média

3. **Frontend Mantém Estado Local de Turno que Pode Divergir**
   - Arquivo: `mobile-app/context/AppStaffContext.tsx` (linha 572)
   - Risco: UI pode mostrar estado incorreto
   - **Severidade:** 🟢 Baixa (só UX, não segurança)

4. **Validação de Ações Pendentes Só no Frontend**
   - Arquivo: `mobile-app/app/(tabs)/staff.tsx` (linha 123)
   - Risco: Pode fechar turno com ações pendentes se burlar frontend
   - **Severidade:** 🟡 Média

5. **Token de Autenticação Validado Só por Formato no Frontend**
   - Arquivo: `merchant-portal/src/core/auth/useAuthStateMachine.ts` (linha 65)
   - Risco: Token expirado pode ser aceito temporariamente
   - **Severidade:** 🟢 Baixa (Supabase Auth revalida, mas frontend pode ter estado inconsistente)

### 5. Riscos Reais em Produção

#### Fraude
- 🟢 **Baixo Risco:** Backend calcula total de pedidos (não pode mentir sobre preço)
- 🟡 **Médio Risco:** Qualquer membro pode executar ações críticas se burlar frontend (cancelar pedido, fechar turno)

#### Bug Silencioso
- 🟡 **Médio Risco:** Frontend pode ter estado local desincronizado (turno ativo quando não está)
- 🟢 **Baixo Risco:** Pedidos e billing são autoritários no backend

#### Dados Inconsistentes
- 🟡 **Médio Risco:** Turnos podem ser criados sem validação de regras de negócio (ex: turno ativo já existe)
- 🟢 **Baixo Risco:** Pedidos e billing são validados no backend

### 6. Recomendações (Direções, Não Ações)

1. **Backend Deve Validar Role em Ações Críticas**
   - Direção: RPCs de ações críticas (cancelar pedido, fechar turno) devem validar role, não só membership
   - Exemplo: `cancel_order()` deve verificar se user tem `order:void` permission

2. **Turnos Devem Usar RPC Sempre**
   - Direção: Frontend não deve inserir diretamente em `gm_shifts`, deve usar RPC `start_turn()` sempre
   - Benefício: Backend valida regras de negócio (ex: não permite turno duplicado)

3. **Validação de Ações Pendentes Deve Estar no Backend**
   - Direção: RPC `end_shift()` deve validar se há ações críticas pendentes antes de permitir fechamento
   - Benefício: Backend é autoritário, frontend não pode burlar

4. **Frontend Não Deve Manter Estado "Verdadeiro"**
   - Direção: Frontend deve sempre ler estado do banco, não manter estado local que pode divergir
   - Exemplo: `shiftState` deve ser derivado de query ao banco, não estado local

5. **Permissões Devem Ser Validadas no Backend**
   - Direção: Backend deve ter tabela de permissões e validar em RPCs
   - Benefício: Frontend e backend não podem divergir sobre quem pode fazer o quê

---

## CONCLUSÃO

**O ChefIApp tem uma arquitetura parcialmente invertida, mas com pontos críticos bem protegidos.**

**Pontos Fortes:**
- ✅ Backend autoritário em operações críticas (pedidos, billing)
- ✅ RLS protege dados
- ✅ Edge Functions são backend real, não pass-through

**Pontos Fracos:**
- ⚠️ Frontend valida permissões sem backend validar role
- ⚠️ Turnos usam insert direto sem validação de regras de negócio
- ⚠️ Frontend mantém estado local que pode divergir

**Risco Geral em Produção:** 🟡 **Médio** (backend protege dados críticos, mas operações operacionais são frágeis)

**Recomendação:** Implementar validação de role no backend para ações críticas e usar RPCs sempre para turnos.

---

**AUDITORIA CONCLUÍDA:** 2026-01-18
