# 🔄 Regras de Transição Entre Modos (Roles)

**Quando e como o AppStaff muda de interface**

---

## 🎯 Princípio

**Um app não significa uma UI.**

**Significa uma inteligência única que adapta a interface ao papel e momento.**

---

## 🔄 Tipos de Transição

### 1. Transição Permanente (Mudança de Função)

**Quando:**
- Funcionário muda de função permanentemente
- Ex: Garçom vira gerente

**Como:**
```typescript
// 1. Usuário seleciona novo role
setActiveRole('manager');

// 2. NOW ENGINE recalcula
const action = calculateActionForRole('manager');

// 3. UI atualiza automaticamente
// Garçom: vê ações de mesa
// Gerente: vê exceções e pressão
```

**Interface:**
- Mudança completa de interface
- Novas ações disponíveis
- Novos filtros aplicados

---

### 2. Transição Temporária (Multitarefa)

**Quando:**
- Funcionário assume função temporária
- Ex: Garçom vira caixa temporariamente
- Ex: Cozinheiro vira apoio temporariamente

**Como:**
```typescript
// 1. Sistema detecta necessidade
if (pendingPayments.length > 3 && currentRole === 'waiter') {
  // Sugerir transição temporária
  suggestRoleTransition('cashier');
}

// 2. Usuário confirma (1 toque)
confirmRoleTransition('cashier');

// 3. NOW ENGINE recalcula
const action = calculateActionForRole('cashier');

// 4. UI atualiza
// Agora vê apenas pagamentos pendentes
```

**Interface:**
- Interface muda temporariamente
- Ações filtradas para nova função
- Pode voltar ao role original facilmente

---

### 3. Transição Automática (Pressão)

**Quando:**
- Sistema detecta pressão e adapta automaticamente
- Ex: Cozinha saturada → garçom prioriza bebidas

**Como:**
```typescript
// 1. Sistema detecta pressão
if (kitchenPressure === 'high' && role === 'waiter') {
  // Não muda role, mas muda ações disponíveis
  const action = {
    type: 'urgent',
    title: 'Cozinha',
    message: 'Pressão alta - priorizar bebidas',
    action: 'prioritize_drinks'
  };
  
  // Garçom ainda é garçom, mas vê ação de priorização
  return action;
}
```

**Interface:**
- Role não muda
- Ações disponíveis mudam
- Filtros adaptam automaticamente

---

## 🎯 Regras de Transição por Cenário

### Cenário 1: Garçom Vira Caixa

**Quando:**
- Muitos pagamentos pendentes (> 3)
- Caixa está ocupado/ausente
- Garçom tem permissão de caixa

**Transição:**
```typescript
// 1. Sistema sugere
if (pendingPayments.length > 3 && 
    canAccess('cash:handle') && 
    currentRole === 'waiter') {
  
  // Mostrar ação especial
  return {
    type: 'urgent',
    title: 'Caixa',
    message: `${pendingPayments.length} pagamentos pendentes`,
    action: 'switch_to_cashier'
  };
}

// 2. Usuário confirma (1 toque)
onConfirm(() => {
  setActiveRole('cashier');
  // Agora vê apenas pagamentos
});
```

**Interface Antes:**
```
┌─────────────────────────────┐
│         💰                  │
│      Mesa 7                 │
│   Quer pagar                │
│  ┌───────────────────────┐  │
│  │   COBRAR              │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Interface Depois:**
```
┌─────────────────────────────┐
│         💰                  │
│      Caixa                   │
│   5 pagamentos pendentes     │
│  ┌───────────────────────┐  │
│  │   VER PAGAMENTOS      │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

### Cenário 2: Cozinheiro Vira Apoio

**Quando:**
- Cozinha está ociosa
- Muitos itens prontos para entregar (> 5)
- Garçons estão ocupados

**Transição:**
```typescript
// 1. Sistema sugere
if (readyItems.length > 5 && 
    kitchenPressure === 'low' && 
    currentRole === 'cook') {
  
  return {
    type: 'attention',
    title: 'Apoio',
    message: `${readyItems.length} itens prontos`,
    action: 'switch_to_runner'
  };
}

// 2. Usuário confirma
onConfirm(() => {
  setActiveRole('runner'); // Role temporário
  // Agora vê apenas itens prontos para entregar
});
```

**Interface Antes:**
```
┌─────────────────────────────┐
│  PEDIDOS EM FILA            │
│                             │
│  [Risotto] 15 min 🔴        │
│  [Pizza] 8 min 🟠           │
└─────────────────────────────┘
```

**Interface Depois:**
```
┌─────────────────────────────┐
│         🍽️                  │
│      Mesa 3                 │
│   Item pronto               │
│  ┌───────────────────────┐  │
│  │   ENTREGAR            │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

### Cenário 3: Barman Vira Garçom

**Quando:**
- Bar está ocioso
- Muitas mesas precisando atenção (> 5)
- Garçons estão sobrecarregados

**Transição:**
```typescript
// 1. Sistema sugere
if (tablesNeedingAttention.length > 5 && 
    barPressure === 'low' && 
    currentRole === 'bartender') {
  
  return {
    type: 'attention',
    title: 'Apoio',
    message: `${tablesNeedingAttention.length} mesas precisam atenção`,
    action: 'switch_to_waiter'
  };
}

// 2. Usuário confirma
onConfirm(() => {
  setActiveRole('waiter'); // Temporário
  // Agora vê ações de mesa
});
```

---

### Cenário 4: Pressão Alta - Adaptação Automática

**Quando:**
- Cozinha saturada (pressão alta)
- Garçom está ativo

**Transição:**
```typescript
// Não muda role, mas adapta ações
if (kitchenPressure === 'high' && role === 'waiter') {
  // Prioriza bebidas (rápidas)
  const action = {
    type: 'urgent',
    title: 'Cozinha',
    message: 'Pressão alta - priorizar bebidas',
    action: 'prioritize_drinks'
  };
  
  // Garçom ainda é garçom
  // Mas vê ação de priorização
  return action;
}
```

**Interface:**
```
┌─────────────────────────────┐
│         🔥                  │
│      Cozinha                 │
│   Pressão alta - priorizar   │
│   bebidas                    │
│  ┌───────────────────────┐  │
│  │   PRIORIZAR           │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 🔄 Fluxo de Transição

### Diagrama

```
┌─────────────────────────────────────────┐
│         CONTEXTO OPERACIONAL             │
│  - Pressão alta                         │
│  - Muitos pagamentos pendentes           │
│  - Itens prontos sem entregar           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      NOW ENGINE - DETECTA NECESSIDADE   │
│                                         │
│  "Garçom pode ajudar no caixa?"         │
│  "Cozinheiro pode entregar itens?"      │
│  "Barman pode ajudar mesas?"            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      APPSTAFF - SUGERE TRANSIÇÃO        │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │         💰                         │ │
│  │      Caixa                         │ │
│  │   5 pagamentos pendentes            │ │
│  │  ┌───────────────────────────────┐ │ │
│  │  │   AJUDAR NO CAIXA             │ │ │
│  │  └───────────────────────────────┘ │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      USUÁRIO - CONFIRMA (1 TOQUE)       │
│                                         │
│  Role muda: waiter → cashier            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      NOW ENGINE - RECALCULA             │
│                                         │
│  Filtro muda:                           │
│  - Antes: ações de mesa                 │
│  - Depois: ações de pagamento           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      APPSTAFF - ATUALIZA INTERFACE     │
│                                         │
│  Agora mostra apenas pagamentos         │
└─────────────────────────────────────────┘
```

---

## 🎯 Regras de Transição

### 1. Transição Permanente

**Quando permitir:**
- Usuário tem permissão para role
- Role é compatível com função atual
- Não está em turno ativo (ou permite mudança)

**Como:**
```typescript
// Seleção manual de role
function changeRole(newRole: StaffRole) {
  // Validar permissão
  if (!canAccessRole(newRole)) {
    return; // Não permitir
  }
  
  // Mudar role
  setActiveRole(newRole);
  
  // NOW ENGINE recalcula
  recalculateNowAction();
}
```

---

### 2. Transição Temporária

**Quando sugerir:**
- Pressão operacional detectada
- Outro setor precisa ajuda
- Funcionário tem permissão
- Não está ocupado com ação crítica

**Como:**
```typescript
// Sistema sugere transição
function suggestTemporaryTransition(
  fromRole: StaffRole,
  toRole: StaffRole,
  reason: string
) {
  // Verificar se pode
  if (!canAccessRole(toRole)) return;
  if (hasCriticalAction()) return; // Não sugerir se ocupado
  
  // Mostrar ação de transição
  return {
    type: 'attention',
    title: toRole,
    message: reason,
    action: `switch_to_${toRole}`
  };
}
```

---

### 3. Transição Automática (Pressão)

**Quando aplicar:**
- Pressão detectada
- Ações disponíveis mudam
- Role não muda, mas filtros adaptam

**Como:**
```typescript
// Adaptação automática sem mudar role
function adaptActionsForPressure(
  role: StaffRole,
  pressure: PressureLevel
) {
  // Não muda role
  // Apenas adapta ações disponíveis
  
  if (pressure === 'high' && role === 'waiter') {
    // Prioriza bebidas (rápidas)
    return filterActions([...actions, prioritizeDrinksAction]);
  }
  
  return actions;
}
```

---

## 🔒 Garantias

### 1. Transição Não Quebra Trabalho

```typescript
// Se funcionário está em ação crítica, não sugerir transição
if (currentAction?.type === 'critical') {
  return; // Não sugerir transição
}
```

### 2. Transição É Reversível

```typescript
// Sempre pode voltar ao role original
function returnToOriginalRole() {
  setActiveRole(originalRole);
  recalculateNowAction();
}
```

### 3. Transição É Clara

```typescript
// Sempre mostrar motivo da transição
return {
  title: 'Caixa',
  message: '5 pagamentos pendentes',
  action: 'switch_to_cashier'
};
```

---

## 📊 Exemplos de Transição

### Exemplo 1: Garçom → Caixa (Temporário)

**Antes:**
- Role: `waiter`
- Vê: Ações de mesa
- Ação atual: "Mesa 7 quer pagar"

**Sistema detecta:**
- 5 pagamentos pendentes
- Caixa ocupado

**Sugestão:**
```
┌─────────────────────────────┐
│         💰                  │
│      Caixa                   │
│   5 pagamentos pendentes     │
│  ┌───────────────────────┐  │
│  │   AJUDAR NO CAIXA     │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Depois:**
- Role: `cashier` (temporário)
- Vê: Apenas pagamentos pendentes
- Ação atual: "Mesa 5 - €25.50"

---

### Exemplo 2: Cozinheiro → Runner (Temporário)

**Antes:**
- Role: `cook`
- Vê: KDS (pedidos em fila)
- Pressão: Baixa

**Sistema detecta:**
- 8 itens prontos sem entregar
- Garçons ocupados

**Sugestão:**
```
┌─────────────────────────────┐
│         🍽️                  │
│      Apoio                   │
│   8 itens prontos            │
│  ┌───────────────────────┐  │
│  │   ENTREGAR ITENS       │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Depois:**
- Role: `runner` (temporário)
- Vê: Apenas itens prontos para entregar
- Ação atual: "Mesa 3 - Item pronto"

---

### Exemplo 3: Pressão Alta - Adaptação Automática

**Antes:**
- Role: `waiter`
- Vê: Ações de mesa normais
- Pressão: Normal

**Sistema detecta:**
- Cozinha saturada (pressão alta)
- 12 pedidos em preparação

**Adaptação:**
```
┌─────────────────────────────┐
│         🔥                  │
│      Cozinha                 │
│   Pressão alta - priorizar   │
│   bebidas                    │
│  ┌───────────────────────┐  │
│  │   PRIORIZAR           │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Depois:**
- Role: `waiter` (não muda)
- Vê: Ações de mesa + priorização de bebidas
- Filtro adapta: mostra bebidas primeiro

---

## ✅ Critérios de Transição

### Quando Sugerir Transição

- ✅ Pressão operacional detectada
- ✅ Outro setor precisa ajuda
- ✅ Funcionário tem permissão
- ✅ Não está ocupado com ação crítica
- ✅ Transição resolve problema

### Quando NÃO Sugerir

- ❌ Funcionário está em ação crítica
- ❌ Não tem permissão para role
- ❌ Transição não resolve problema
- ❌ Pressão é normal

---

## 🎯 Regras de UI para Transição

### 1. Transição Deve Ser Clara

```typescript
// Sempre mostrar motivo
{
  title: 'Caixa', // Para onde vai
  message: '5 pagamentos pendentes', // Por quê
  action: 'switch_to_cashier' // Como
}
```

### 2. Transição Deve Ser Rápida

```typescript
// 1 toque para confirmar
onPress(() => {
  setActiveRole(newRole);
  // UI atualiza imediatamente
});
```

### 3. Transição Deve Ser Reversível

```typescript
// Sempre pode voltar
function returnToOriginalRole() {
  setActiveRole(originalRole);
  // UI volta ao normal
}
```

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Regras Definidas
