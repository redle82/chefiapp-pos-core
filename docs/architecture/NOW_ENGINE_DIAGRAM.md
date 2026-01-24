# 🧠 NOW ENGINE - Diagrama de Decisão por Role

**Como o NOW ENGINE decide o que cada pessoa vê**

---

## 🎯 Princípio Fundamental

**Um app = um cérebro (NOW ENGINE)**

**Múltiplas interfaces = terminais especializados**

O que muda não é o app. O que muda é o que o cérebro decide mostrar para cada pessoa, naquele momento.

---

## 🧩 Arquitetura: Um Cérebro, Múltiplos Modos

```
┌─────────────────────────────────────────────────┐
│           CHEFIAPP CORE (ÚNICO)                 │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         NOW ENGINE (CÉREBRO)              │ │
│  │  - Observa contexto (TPV, KDS, Tempo)     │ │
│  │  - Calcula prioridade única                │ │
│  │  - Decide o que cada role vê               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ TPV  │  │ KDS  │  │Staff │  │Dash  │       │
│  │(Venda)│ │(Prod)│ │(Exec)│ │(Dec) │       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
│                                                 │
│  Mesmo backend, mesmo motor, mesma verdade     │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Decisão por Role

### Diagrama Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXTO OPERACIONAL                      │
│  - Mesas (status, tempo, pedidos)                            │
│  - KDS (pressão, itens prontos)                              │
│  - Vendas (pagamentos pendentes)                             │
│  - Tempo (elapsed, pressão geral)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NOW ENGINE (CÉREBRO)                      │
│                                                              │
│  1. Coleta contexto                                          │
│  2. Calcula todas as ações possíveis                         │
│  3. Filtra por ROLE                                          │
│  4. Prioriza (crítico → urgente → atenção)                   │
│  5. Seleciona 1 ação única                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   GARÇOM      │  │  COZINHEIRO    │  │   GERENTE     │
│               │  │                │  │               │
│  Vê: Mesas    │  │  Vê: KDS       │  │  Vê: Fluxo    │
│  Vê: Pagamentos│ │  Vê: Pressão   │  │  Vê: Pressão  │
│  NÃO vê: KDS  │  │  NÃO vê: Mesas │  │  Vê: Exceções │
└───────────────┘  └───────────────┘  └───────────────┘
```

---

## 👨‍🍳 Garçom - Terminal de Execução

### O Que Garçom Vê

```
┌─────────────────────────────────────────┐
│         NOW ENGINE (Filtro)             │
│                                         │
│  Ações disponíveis:                     │
│  ✅ Coletar pagamento                   │
│  ✅ Entregar itens                      │
│  ✅ Verificar mesas                     │
│  ✅ Acompanhar pedidos                  │
│  ❌ Não vê: Ações de cozinha            │
│  ❌ Não vê: Ações de bar (exceto bebidas)│
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         APPSTAFF (Garçom)               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │         💰                         │ │
│  │      Mesa 7                        │ │
│  │   Quer pagar há 5+ min              │ │
│  │  ┌───────────────────────────────┐ │ │
│  │  │   COBRAR                      │ │ │
│  │  └───────────────────────────────┘ │ │
│  └───────────────────────────────────┘ │
│                                         │
│  🍽️ Garçom • 2h 15m                    │
└─────────────────────────────────────────┘
```

### Regras de Filtro para Garçom

```typescript
function filterForWaiter(allActions: NowAction[]): NowAction | null {
  // Garçom vê apenas:
  // 1. Ações de mesa (coletar pagamento, verificar, entregar)
  // 2. Itens prontos para entregar (do KDS)
  // 3. Bebidas prontas (do bar)
  
  const waiterActions = allActions.filter(action => 
    action.tableId || // Ações de mesa
    action.action === 'deliver' || // Entregar itens
    action.action === 'collect_payment' // Coletar pagamento
  );
  
  // Não vê:
  // - Ações de cozinha (exceto itens prontos)
  // - Ações de bar (exceto bebidas prontas)
  // - Ações de gestão
  
  return selectHighestPriority(waiterActions);
}
```

### Exemplos de Ações para Garçom

**Ação 1: Coletar Pagamento**
```
┌─────────────────────────────┐
│         💰                  │
│      Mesa 7                 │
│   Quer pagar há 5+ min      │
│  ┌───────────────────────┐  │
│  │   COBRAR              │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Ação 2: Entregar Item**
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

**Ação 3: Verificar Mesa**
```
┌─────────────────────────────┐
│         👀                  │
│      Mesa 5                 │
│   Verificar                 │
│  ┌───────────────────────┐  │
│  │   VERIFICAR           │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 👨‍🍳 Cozinheiro - Terminal de Produção

### O Que Cozinheiro Vê

```
┌─────────────────────────────────────────┐
│         NOW ENGINE (Filtro)             │
│                                         │
│  Ações disponíveis:                     │
│  ✅ Itens prontos para entregar         │
│  ✅ Pressão de cozinha                  │
│  ✅ Itens demorando                     │
│  ❌ Não vê: Ações de mesa               │
│  ❌ Não vê: Pagamentos                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         KDS (Cozinheiro)                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  PEDIDOS EM FILA                   │ │
│  │                                     │ │
│  │  [Prato X] 12 min 🔴               │ │
│  │  [Prato Y] 8 min 🟠                │ │
│  │  [Prato Z] 3 min 🟢                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  👨‍🍳 Cozinheiro • 2h 15m              │
└─────────────────────────────────────────┘
```

### Regras de Filtro para Cozinheiro

```typescript
function filterForCook(allActions: NowAction[]): NowAction | null {
  // Cozinheiro vê apenas:
  // 1. Itens prontos para entregar (urgente/crítico)
  // 2. Pressão de cozinha (se alta)
  // 3. Itens demorando (se > 10min)
  
  const cookActions = allActions.filter(action => 
    action.action === 'deliver' && action.itemReady || // Itens prontos
    action.action === 'check_kitchen' || // Itens demorando
    action.action === 'prioritize_drinks' // Pressão alta
  );
  
  // Não vê:
  // - Ações de mesa
  // - Pagamentos
  // - Tarefas genéricas
  
  // Se não há ações, mostra KDS (modo padrão)
  if (cookActions.length === 0) {
    return null; // KDS aparece automaticamente
  }
  
  return selectHighestPriority(cookActions);
}
```

### Modo KDS (Padrão para Cozinheiro)

**Quando não há ações urgentes, cozinheiro vê KDS:**

```
┌─────────────────────────────┐
│  PEDIDOS EM FILA            │
│                             │
│  [Risotto] 15 min 🔴        │
│  [Pizza] 8 min 🟠           │
│  [Salada] 3 min 🟢          │
│                             │
│  👨‍🍳 Cozinheiro • 2h 15m   │
└─────────────────────────────┘
```

---

## 🍹 Barman - Terminal de Bar

### O Que Barman Vê

```
┌─────────────────────────────────────────┐
│         NOW ENGINE (Filtro)             │
│                                         │
│  Ações disponíveis:                     │
│  ✅ Bebidas prontas para entregar       │
│  ✅ Pressão de bar                      │
│  ✅ Reabastecer estoque                 │
│  ❌ Não vê: Ações de mesa               │
│  ❌ Não vê: Pagamentos                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         APPSTAFF (Barman)                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │         🍹                         │ │
│  │      Mesa 12                       │ │
│  │   Bebida pronto                    │ │
│  │  ┌───────────────────────────────┐ │ │
│  │  │   ENTREGAR                     │ │ │
│  │  └───────────────────────────────┘ │ │
│  └───────────────────────────────────┘ │
│                                         │
│  🍹 Barman • 2h 15m                    │
└─────────────────────────────────────────┘
```

### Regras de Filtro para Barman

```typescript
function filterForBartender(allActions: NowAction[]): NowAction | null {
  // Barman vê apenas:
  // 1. Bebidas prontas para entregar
  // 2. Pressão de bar (se alta)
  // 3. Reabastecer estoque (se ocioso)
  
  const bartenderActions = allActions.filter(action => 
    (action.action === 'deliver' && action.itemCategory === 'drink') || // Bebidas
    action.action === 'restock' || // Reabastecer
    action.action === 'prioritize_drinks' // Pressão alta
  );
  
  // Não vê:
  // - Ações de mesa (exceto bebidas)
  // - Pagamentos
  // - Ações de cozinha
  
  return selectHighestPriority(bartenderActions);
}
```

---

## 💼 Gerente - Terminal de Decisão

### O Que Gerente Vê

```
┌─────────────────────────────────────────┐
│         NOW ENGINE (Filtro)             │
│                                         │
│  Ações disponíveis:                     │
│  ✅ Todas as ações (visão completa)     │
│  ✅ Exceções (reclamações, erros)       │
│  ✅ Pressão geral                       │
│  ✅ Resolver problemas                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         APPSTAFF (Gerente)              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │         ⚠️                         │ │
│  │      Cozinha                       │ │
│  │   Saturada - priorizar bebidas     │ │
│  │  ┌───────────────────────────────┐ │ │
│  │  │   PRIORIZAR                   │ │ │
│  │  └───────────────────────────────┘ │ │
│  └───────────────────────────────────┘ │
│                                         │
│  💼 Gerente • 2h 15m                    │
└─────────────────────────────────────────┘
```

### Regras de Filtro para Gerente

```typescript
function filterForManager(allActions: NowAction[]): NowAction | null {
  // Gerente vê:
  // 1. Todas as ações (visão completa)
  // 2. Exceções (reclamações, erros)
  // 3. Pressão geral
  // 4. Problemas que precisam resolução
  
  // Gerente não executa ações operacionais
  // Apenas vê e decide
  
  const managerActions = allActions.filter(action => 
    action.type === 'critical' || // Sempre vê crítico
    action.type === 'urgent' || // Sempre vê urgente
    action.action === 'resolve' || // Resolver problemas
    action.action === 'prioritize_drinks' // Pressão geral
  );
  
  return selectHighestPriority(managerActions);
}
```

---

## 👑 Dono - Terminal de Síntese

### O Que Dono Vê

```
┌─────────────────────────────────────────┐
│         NOW ENGINE (Filtro)             │
│                                         │
│  Ações disponíveis:                     │
│  ✅ Nenhuma ação operacional            │
│  ✅ Apenas síntese (dashboard)          │
│  ✅ Saúde do negócio                    │
│  ✅ Tendências                          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         DASHBOARD (Dono)                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  SAÚDE DO NEGÓCIO                  │ │
│  │                                     │ │
│  │  💰 €1,250 (hoje)                  │ │
│  │  📊 +15% vs ontem                   │ │
│  │  ⚠️ Cozinha saturada                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  👑 Dono • 2h 15m                       │
└─────────────────────────────────────────┘
```

### Regras de Filtro para Dono

```typescript
function filterForOwner(allActions: NowAction[]): NowAction | null {
  // Dono não vê ações operacionais
  // Apenas vê dashboard/síntese
  
  return null; // Sempre mostra dashboard
}
```

---

## 🔄 Fluxo Completo de Decisão

### Diagrama Detalhado

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXTO OPERACIONAL                      │
│                                                              │
│  Mesas:                                                      │
│  - Mesa 5: ocupada, 20min, quer pagar                       │
│  - Mesa 7: ocupada, 5min, pedido novo                       │
│                                                              │
│  KDS:                                                        │
│  - Item pronto: Mesa 3, há 2min                             │
│  - Pressão: alta (12 pedidos)                               │
│                                                              │
│  Vendas:                                                     │
│  - Pagamento pendente: Mesa 5, há 5min                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NOW ENGINE - CALCULAR TODAS AÇÕES               │
│                                                              │
│  Ações possíveis:                                            │
│  1. Mesa 5 quer pagar há 5min → CRÍTICO (900)               │
│  2. Item pronto Mesa 3 há 2min → URGENTE (600)              │
│  3. Mesa 7 pedido novo → ATENÇÃO (300)                       │
│  4. Pressão alta cozinha → URGENTE (550)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ FILTRO GARÇOM │  │FILTRO COZINHEIRO│ │FILTRO GERENTE │
│               │  │                │ │               │
│ Vê: 1, 2, 3   │  │ Vê: 2, 4       │ │ Vê: 1, 2, 4   │
│ (mesas, itens)│  │ (KDS, pressão) │ │ (tudo)        │
└───────────────┘  └───────────────┘ └───────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ PRIORIZA      │  │ PRIORIZA      │  │ PRIORIZA      │
│               │  │               │  │               │
│ 1. Mesa 5     │  │ 1. Item Mesa 3│  │ 1. Mesa 5     │
│ (crítico)     │  │ (urgente)     │  │ (crítico)     │
└───────────────┘  └───────────────┘ └───────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ APPSTAFF      │  │ KDS           │  │ APPSTAFF      │
│ (Garçom)      │  │ (Cozinheiro)  │  │ (Gerente)     │
│               │  │               │  │               │
│ Mesa 5        │  │ Item pronto   │  │ Mesa 5        │
│ COBRAR        │  │ Mesa 3        │  │ COBRAR        │
└───────────────┘  └───────────────┘ └───────────────┘
```

---

## 🎯 Regras de Filtro por Role

### Tabela de Visibilidade

| Ação | Garçom | Cozinheiro | Barman | Gerente | Dono |
|------|--------|------------|--------|---------|------|
| Coletar pagamento | ✅ | ❌ | ❌ | ✅ | ❌ |
| Entregar item | ✅ | ✅* | ✅* | ✅ | ❌ |
| Verificar mesa | ✅ | ❌ | ❌ | ✅ | ❌ |
| Item pronto | ✅ | ✅ | ✅* | ✅ | ❌ |
| Pressão cozinha | ❌ | ✅ | ❌ | ✅ | ✅ |
| Pressão bar | ❌ | ❌ | ✅ | ✅ | ✅ |
| Reclamação | ✅ | ❌ | ❌ | ✅ | ✅ |
| Reabastecer | ❌ | ❌ | ✅ | ✅ | ❌ |

* Apenas itens do seu setor (cozinheiro = comida, barman = bebidas)

---

## 🔄 Transição Entre Modos

### Quando Role Muda

```typescript
// Exemplo: Garçom vira caixa temporariamente

// 1. Role muda
setActiveRole('cashier');

// 2. NOW ENGINE recalcula
const context = gatherContext();
const action = calculateNowAction(context);

// 3. Filtro muda automaticamente
const filtered = filterForCashier([action]);

// 4. UI atualiza
// Garçom via: ações de mesa
// Caixa via: ações de pagamento
```

### Regras de Transição

- **Garçom → Caixa:** Vê apenas pagamentos pendentes
- **Cozinheiro → Apoio:** Vê ações de mesa (temporariamente)
- **Barman → Garçom:** Vê ações de mesa (temporariamente)
- **Gerente → Qualquer:** Pode ver tudo, mas foca em exceções

---

## 🧠 Lógica de Decisão no NOW ENGINE

### Código Simplificado

```typescript
class NowEngine {
  async calculateActionForRole(role: StaffRole): Promise<NowAction | null> {
    // 1. Coletar contexto
    const context = await this.gatherContext();
    
    // 2. Calcular todas as ações possíveis
    const allActions = this.calculateAllActions(context);
    
    // 3. Filtrar por role
    const roleActions = this.filterByRole(allActions, role);
    
    // 4. Priorizar
    const prioritized = this.prioritize(roleActions);
    
    // 5. Selecionar 1 única ação
    return prioritized[0] || null;
  }
  
  private filterByRole(actions: NowAction[], role: StaffRole): NowAction[] {
    switch (role) {
      case 'waiter':
        return actions.filter(a => 
          a.tableId || 
          a.action === 'deliver' || 
          a.action === 'collect_payment'
        );
      
      case 'cook':
        return actions.filter(a => 
          a.action === 'deliver' && a.itemCategory !== 'drink' ||
          a.action === 'check_kitchen' ||
          a.action === 'prioritize_drinks'
        );
      
      case 'bartender':
        return actions.filter(a => 
          a.action === 'deliver' && a.itemCategory === 'drink' ||
          a.action === 'restock'
        );
      
      case 'manager':
        return actions.filter(a => 
          a.type === 'critical' || 
          a.type === 'urgent' ||
          a.action === 'resolve'
        );
      
      case 'owner':
        return []; // Dono não vê ações operacionais
      
      default:
        return actions;
    }
  }
}
```

---

## ✅ Garantias

### 1. Um Cérebro, Múltiplos Terminais

- ✅ NOW ENGINE é único
- ✅ Cada role vê apenas o necessário
- ✅ Todos alimentam o mesmo cérebro

### 2. Consistência

- ✅ Mesma fonte de verdade
- ✅ Mesma inteligência
- ✅ Mesma priorização

### 3. Isolamento Cognitivo

- ✅ Garçom não vê cozinha
- ✅ Cozinheiro não vê mesas
- ✅ Cada um vê apenas seu mundo

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Diagrama Completo
