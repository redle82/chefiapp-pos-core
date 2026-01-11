# 🧪 PLANO COMPLETO DE TESTES — ChefIApp POS Core

**Data:** 2026-01-11  
**Status Atual:** 108 arquivos de teste | Cobertura <20%  
**Meta:** Cobertura >50% | 300+ testes

---

## 📊 SITUAÇÃO ATUAL

| Métrica | Valor |
|---------|-------|
| **Arquivos de Teste Existentes** | 108 |
| **Arquivos de Código** | 306 (core/pages/components) |
| **Cobertura Atual** | <20% 🔴 |
| **Testes Passando** | 150/158 (94.9%) ✅ |
| **Meta de Cobertura** | >50% 🎯 |

---

## 🎯 TIPOS DE TESTES NECESSÁRIOS

### 1. **Testes Unitários** (Jest)
**Objetivo:** Testar funções, componentes e lógica isoladamente

**O que testar:**
- ✅ Funções puras (calculadoras, validadores)
- ✅ Hooks customizados (React hooks)
- ✅ Utilitários e helpers
- ✅ Lógica de negócio isolada
- ✅ Transformações de dados

**Quantidade estimada:** 150-200 testes

---

### 2. **Testes de Componente** (Vitest + React Testing Library)
**Objetivo:** Testar componentes React isoladamente

**O que testar:**
- ✅ Renderização básica
- ✅ Interações do usuário (clicks, inputs)
- ✅ Estados e props
- ✅ Callbacks e eventos
- ✅ Acessibilidade básica

**Componentes críticos:**
- `FlowGate` - Navegação soberana
- `AuthPage` - Autenticação
- `OnboardingWizard` - Fluxo de onboarding
- `TPV` - Terminal de vendas
- `DashboardZero` - Dashboard principal
- `OrderContext` - Gerenciamento de pedidos

**Quantidade estimada:** 80-100 testes

---

### 3. **Testes de Integração** (Jest + Supertest)
**Objetivo:** Testar interação entre componentes/serviços

**O que testar:**
- ✅ Integração com Supabase (RPC, queries)
- ✅ Integração com Stripe (webhooks, pagamentos)
- ✅ Fluxos completos (onboarding, pedidos)
- ✅ Persistência de dados
- ✅ Sincronização offline/online

**Fluxos críticos:**
- `create_tenant_atomic` RPC
- `process_order_payment` RPC
- Onboarding completo (8 etapas)
- TPV offline → online sync
- AppStaff → KDS comunicação

**Quantidade estimada:** 40-60 testes

---

### 4. **Testes E2E** (Playwright)
**Objetivo:** Testar fluxos completos do usuário

**O que testar:**
- ✅ Fluxos críticos end-to-end
- ✅ Navegação entre páginas
- ✅ Autenticação completa
- ✅ Onboarding completo
- ✅ Criação de pedido
- ✅ Processamento de pagamento
- ✅ Publicação de cardápio

**Fluxos prioritários:**
1. **Onboarding Completo** (8 etapas)
   - Identidade → Autoridade → Existência → Topologia → Fluxo → Caixa → Equipa → Consagração
   
2. **TPV Flow**
   - Criar pedido → Adicionar itens → Processar pagamento → Fechar caixa
   
3. **AppStaff Flow**
   - Receber pedido → Preparar → Servir → Finalizar

4. **Menu Management**
   - Criar categoria → Adicionar item → Publicar

**Quantidade estimada:** 30-40 testes

---

### 5. **Testes de Performance** (Jest + Lighthouse)
**Objetivo:** Garantir performance aceitável

**O que testar:**
- ✅ Tempo de carregamento inicial
- ✅ Tempo de resposta de queries
- ✅ Bundle size
- ✅ Memory leaks
- ✅ Renderização de listas grandes

**Quantidade estimada:** 10-15 testes

---

### 6. **Testes de Segurança** (Jest + Supertest)
**Objetivo:** Validar segurança e permissões

**O que testar:**
- ✅ Autenticação e autorização
- ✅ RLS (Row Level Security) do Supabase
- ✅ Validação de inputs
- ✅ Sanitização de dados
- ✅ Proteção contra SQL injection
- ✅ Proteção contra XSS

**Quantidade estimada:** 20-30 testes

---

## 📋 TESTES PRIORITÁRIOS (URGENTE)

### 🔴 P0 - Crítico (Fazer Agora)

#### 1. FlowGate (Navegação Soberana)
**Tipo:** Unitário + Integração  
**Quantidade:** 15-20 testes

```typescript
// Testes necessários:
- ✅ Redireciona não-autenticado para /auth
- ✅ Redireciona autenticado sem tenant para onboarding
- ✅ Permite acesso a /app após onboarding completo
- ✅ Bloqueia acesso a rotas protegidas
- ✅ Resolve tenant corretamente
- ✅ Lida com erros de rede
```

#### 2. create_tenant_atomic RPC
**Tipo:** Integração  
**Quantidade:** 10-15 testes

```typescript
// Testes necessários:
- ✅ Cria tenant com sucesso
- ✅ Retorna tenant existente (idempotência)
- ✅ Valida campos obrigatórios
- ✅ Cria empire_pulses corretamente
- ✅ Cria menu_categories
- ✅ Cria restaurant_members
- ✅ Lida com erros de constraint
```

#### 3. OnboardingWizard
**Tipo:** Componente + E2E  
**Quantidade:** 20-25 testes

```typescript
// Testes necessários:
- ✅ Renderiza etapa correta
- ✅ Valida inputs antes de avançar
- ✅ Salva draft corretamente
- ✅ Navega entre etapas
- ✅ Completa onboarding completo
- ✅ Lida com erros de API
```

#### 4. AuthPage
**Tipo:** Componente + Integração  
**Quantidade:** 10-15 testes

```typescript
// Testes necessários:
- ✅ Renderiza formulário
- ✅ Valida email
- ✅ Inicia OAuth Google
- ✅ Login técnico funciona
- ✅ Redireciona após login
- ✅ Mostra erros corretamente
```

---

### 🟡 P1 - Alto (Esta Semana)

#### 5. TPV (Terminal de Vendas)
**Tipo:** Componente + Integração + E2E  
**Quantidade:** 25-30 testes

```typescript
// Testes necessários:
- ✅ Cria pedido
- ✅ Adiciona itens
- ✅ Calcula total
- ✅ Processa pagamento
- ✅ Funciona offline
- ✅ Sincroniza quando online
- ✅ Fecha caixa corretamente
```

#### 6. OrderContext
**Tipo:** Integração  
**Quantidade:** 15-20 testes

```typescript
// Testes necessários:
- ✅ Gerencia estado de pedidos
- ✅ Sincroniza com backend
- ✅ Queue offline funciona
- ✅ Retry em caso de erro
```

#### 7. TenantResolver
**Tipo:** Unitário  
**Quantidade:** 10-15 testes (já tem 28 ✅)

```typescript
// Status: ✅ Já bem testado
// Adicionar:
- ✅ Testes de edge cases
- ✅ Testes de performance
```

---

### 🟢 P2 - Médio (2 Semanas)

#### 8. DashboardZero
**Tipo:** Componente  
**Quantidade:** 10-15 testes

#### 9. Menu Management
**Tipo:** Componente + Integração  
**Quantidade:** 15-20 testes

#### 10. AppStaff
**Tipo:** Componente + E2E  
**Quantidade:** 20-25 testes

---

## 📊 RESUMO POR TIPO

| Tipo de Teste | Quantidade Atual | Quantidade Necessária | Gap |
|---------------|------------------|----------------------|-----|
| **Unitários** | 55 | 150-200 | +95-145 |
| **Componente** | 40 | 80-100 | +40-60 |
| **Integração** | 55 | 40-60 | -15 a +5 |
| **E2E** | 0 (Playwright) | 30-40 | +30-40 |
| **Performance** | 0 | 10-15 | +10-15 |
| **Segurança** | 4 | 20-30 | +16-26 |
| **TOTAL** | **154** | **330-445** | **+176-291** |

---

## 🎯 METAS POR FASE

### Fase 1: Crítico (Esta Semana)
**Objetivo:** Cobrir componentes críticos

- [ ] FlowGate: 15-20 testes
- [ ] create_tenant_atomic: 10-15 testes
- [ ] OnboardingWizard: 20-25 testes
- [ ] AuthPage: 10-15 testes
- [ ] **Total:** 55-75 testes novos
- [ ] **Cobertura:** >30%

### Fase 2: Essencial (2 Semanas)
**Objetivo:** Cobrir fluxos principais

- [ ] TPV: 25-30 testes
- [ ] OrderContext: 15-20 testes
- [ ] DashboardZero: 10-15 testes
- [ ] Menu Management: 15-20 testes
- [ ] **Total:** 65-85 testes novos
- [ ] **Cobertura:** >40%

### Fase 3: Completo (1 Mês)
**Objetivo:** Cobertura completa

- [ ] AppStaff: 20-25 testes
- [ ] E2E completo: 30-40 testes
- [ ] Performance: 10-15 testes
- [ ] Segurança: 20-30 testes
- [ ] **Total:** 80-110 testes novos
- [ ] **Cobertura:** >50%

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Setup (1 dia)
- [ ] Configurar coverage reports
- [ ] Configurar CI/CD para testes
- [ ] Criar estrutura de mocks
- [ ] Documentar padrões de teste

### Fase 1 - Crítico (Esta Semana)
- [ ] FlowGate tests
- [ ] create_tenant_atomic tests
- [ ] OnboardingWizard tests
- [ ] AuthPage tests

### Fase 2 - Essencial (2 Semanas)
- [ ] TPV tests
- [ ] OrderContext tests
- [ ] DashboardZero tests
- [ ] Menu Management tests

### Fase 3 - Completo (1 Mês)
- [ ] AppStaff tests
- [ ] E2E completo
- [ ] Performance tests
- [ ] Security tests

---

## 🎯 MÉTRICAS DE SUCESSO

| Métrica | Atual | Meta (1 Semana) | Meta (1 Mês) |
|---------|-------|-----------------|--------------|
| **Cobertura** | <20% | >30% | >50% |
| **Testes Unitários** | 55 | 150 | 200 |
| **Testes Componente** | 40 | 80 | 100 |
| **Testes E2E** | 0 | 10 | 40 |
| **Taxa de Sucesso** | 94.9% | >95% | >98% |

---

## ✅ CONCLUSÃO

**Testes Necessários:** **+176 a +291 testes novos**

**Prioridade:**
1. 🔴 **P0 - Crítico:** 55-75 testes (esta semana)
2. 🟡 **P1 - Alto:** 65-85 testes (2 semanas)
3. 🟢 **P2 - Médio:** 80-110 testes (1 mês)

**Meta Final:** 330-445 testes totais | Cobertura >50%

---

**Próximo Passo:** Começar com FlowGate e create_tenant_atomic (P0)
