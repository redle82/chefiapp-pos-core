# 📱 Estrutura do AppStaff e Perfis

**Data:** 2026-01-26  
**Status:** ✅ Documentado

> **📚 Ver também:** [UX: Visibilidade de Pedidos](./UX_VISIBILIDADE_PEDIDOS.md) — Regras de ouro sobre visões de pedidos

---

## 🏗️ Estrutura do AppStaff

### Visão Geral

O **AppStaff** é um sistema unificado que serve múltiplos perfis de funcionários. Não é apenas para garçons — é uma plataforma operacional completa.

**Rota Principal:** `/app/staff` ou `/garcom`

---

## 👥 Perfis (StaffRole)

### Tipos de Perfis Disponíveis

```typescript
export type StaffRole = 
  | 'manager'    // Gerente
  | 'waiter'     // Garçom
  | 'kitchen'    // Cozinha
  | 'cleaning'   // Limpeza
  | 'worker'     // Trabalhador genérico
  | 'owner';     // Dono
```

### Descrição dos Perfis

| Perfil | Descrição | Interface Principal | Pode Criar Pedidos? |
|--------|-----------|---------------------|---------------------|
| **waiter** | Garçom/Mesário | MiniPOS (TablePanel) | ✅ **SIM** |
| **manager** | Gerente | ManagerDashboard | ❓ Depende do contexto |
| **kitchen** | Cozinha | KitchenDisplay (KDS) | ❌ Não (apenas visualiza) |
| **cleaning** | Limpeza | CleaningTaskView | ❌ Não |
| **worker** | Trabalhador genérico | WorkerTaskStream | ❌ Não |
| **owner** | Dono | OwnerDashboard | ❓ Depende do contexto |

---

## 🎯 Sistema de DominantTool

O AppStaff usa um sistema de **"Dominant Tool"** que determina qual interface mostrar baseado no perfil e estado do funcionário.

### Como Funciona

```typescript
const dominantTool = useMemo((): DominantTool => {
  if (shiftState === 'offline') return 'hands';
  if (activeRole === 'manager') return 'tablet';
  if (activeRole === 'kitchen') {
    // Kitchen: 'production' se houver pedidos ativos, senão 'check'
    const hasActiveOrders = orders.some(o => o.status === 'OPEN' || o.status === 'IN_PREP');
    return hasActiveOrders ? 'production' : 'check';
  }
  if (activeRole === 'waiter') return 'order'; // ✅ Waiter recebe 'order' para criar pedidos
  if (activeRole === 'cleaning') return 'check';
  return 'hands';
}, [shiftState, activeRole, orders]);
```

### Mapeamento DominantTool → Interface

| DominantTool | Interface | Quem Vê | Função |
|--------------|-----------|---------|--------|
| **`order`** | `MiniPOS` | **Garçons (waiter)** | ✅ **Criar pedidos** |
| **`production`** | `KitchenDisplay` | Cozinha (kitchen) | Visualizar pedidos |
| **`check`** | `CleaningTaskView` | Limpeza (cleaning) | Checklist de limpeza |
| **`tablet`** | `ManagerDashboard` | Gerente (manager) | Dashboard gerencial |
| **`hands`** | `WorkerTaskStream` | Trabalhador genérico | Stream de tarefas |
| **`knife`** | `KitchenDisplay` | Cozinha (kitchen) | KDS para cozinha |
| **`tray`** | (Não usado atualmente) | - | - |

---

## ✅ Quem Pode Criar Pedidos para a Cozinha?

### Resposta Direta

**Apenas perfis com `dominantTool === 'order'` podem criar pedidos.**

Atualmente, isso significa:

1. ✅ **`waiter` (Garçom)** — ✅ **SEMPRE** pode criar pedidos
   - `dominantTool === 'order'` (sempre para waiter)
   - Acessa `MiniPOS` automaticamente
   - Usa `TablePanel` para criar pedidos
   - Pedidos criados têm origem **`APPSTAFF`**

2. ❌ **`manager` (Gerente)** — Não cria pedidos diretamente
   - Normalmente vê `ManagerDashboard`
   - Pode ter acesso ao MiniPOS em certas situações
   - **Precisa verificar se tem acesso**

3. ❓ **`owner` (Dono)** — Depende do contexto
   - Normalmente vê `OwnerDashboard`
   - Pode ter acesso ao MiniPOS em certas situações
   - **Precisa verificar se tem acesso**

### ❌ Perfis que NÃO Podem Criar Pedidos

- ❌ **`kitchen`** — Apenas visualiza pedidos no KDS
- ❌ **`cleaning`** — Apenas vê checklist de limpeza
- ❌ **`worker`** — Apenas vê stream de tarefas

---

## 🔍 Fluxo de Criação de Pedidos

### 1. Garçom (waiter) Criando Pedido

```
AppStaff (/app/staff)
  ↓
activeRole = 'waiter'
  ↓
dominantTool = 'order' (ou 'tray')
  ↓
MiniPOS component
  ↓
TablePanel (quando seleciona mesa)
  ↓
createOrder() com origem 'APPSTAFF'
  ↓
Pedido aparece no KDS com badge 👤 APPSTAFF
```

### 2. Detecção de Origem

**Arquivo:** `merchant-portal/src/pages/Waiter/TablePanel.tsx`

```typescript
// Detectar se estamos no AppStaff
const isAppStaff = window.location.pathname.includes('/app/staff');
const orderOrigin = isAppStaff ? 'APPSTAFF' : 'CAIXA';

await createOrder({
  // ...
  syncMetadata: {
    origin: orderOrigin  // 'APPSTAFF' quando criado via AppStaff
  }
});
```

---

## 📊 Hierarquia de Interfaces

### Por Perfil

```
AppStaff (/app/staff)
│
├─ Owner (owner)
│  └─ OwnerDashboard
│
├─ Manager (manager)
│  └─ ManagerDashboard
│
└─ Workers (waiter, kitchen, cleaning, worker)
   │
   ├─ Se dominantTool === 'order'
   │  └─ MiniPOS → TablePanel → ✅ Cria pedidos
   │
   ├─ Se dominantTool === 'production'
   │  └─ KitchenDisplay → Visualiza pedidos
   │
   ├─ Se dominantTool === 'check'
   │  └─ CleaningTaskView → Checklist
   │
   └─ Se dominantTool === 'hands'
      └─ WorkerTaskStream → Tarefas genéricas
```

---

## 🎯 AppStaff vs Garçom

### São Iguais?

**Resposta:** **SIM e NÃO** — Depende do contexto.

### Semelhanças

- ✅ Ambos usam a mesma rota base (`/app/staff` ou `/garcom`)
- ✅ Ambos usam o mesmo componente `AppStaff.tsx`
- ✅ Ambos usam o mesmo contexto `StaffContext`
- ✅ Ambos podem acessar `MiniPOS` quando `dominantTool === 'order'`

### Diferenças

- **AppStaff** é o sistema completo (todos os perfis)
- **Garçom** é uma referência específica ao perfil `waiter`
- O termo "garçom" é usado no código para referenciar o perfil `waiter`

### Na Prática

- **Rota `/app/staff`** → AppStaff completo (todos os perfis)
- **Rota `/garcom`** → AppStaff focado em garçons (mas pode ser usado por outros)
- **Perfil `waiter`** → Garçom específico (pode criar pedidos)

---

## 🔐 Permissões de Criação de Pedidos

### Regras Atuais

1. **Perfil `waiter` (Garçom)**
   - ✅ **Pode criar pedidos** quando `dominantTool === 'order'`
   - ✅ Acessa `MiniPOS` → `TablePanel`
   - ✅ Pedidos criados têm origem `APPSTAFF`

2. **Perfil `manager` (Gerente)**
   - ❓ **Acesso depende do contexto**
   - Normalmente vê `ManagerDashboard`
   - Pode ter acesso ao MiniPOS em modo de supervisão

3. **Perfil `owner` (Dono)**
   - ❓ **Acesso depende do contexto**
   - Normalmente vê `OwnerDashboard`
   - Pode ter acesso ao MiniPOS em modo de supervisão

4. **Outros perfis**
   - ❌ **Não podem criar pedidos**
   - Apenas visualizam ou gerenciam tarefas

---

## 📁 Estrutura de Arquivos

```
merchant-portal/src/pages/AppStaff/
├── AppStaff.tsx                    # Componente principal (roteamento)
├── AppStaffLanding.tsx             # Tela de entrada/login
├── ManagerDashboard.tsx            # Dashboard do gerente
├── OwnerDashboard.tsx              # Dashboard do dono
├── WorkerCheckInView.tsx           # Check-in de funcionário
├── WorkerTaskStream.tsx             # Stream de tarefas
├── WorkerTaskFocus.tsx             # Foco em tarefa específica
├── components/
│   ├── MiniPOS.tsx                 # ✅ POS para criar pedidos
│   ├── QuickTaskModal.tsx          # Modal de tarefas rápidas
│   └── ...
├── context/
│   ├── StaffContext.tsx            # Contexto principal
│   └── StaffCoreTypes.ts           # Tipos e definições
├── views/
│   ├── CleaningTaskView.tsx       # Vista de limpeza
│   └── ...
└── core/
    ├── ReflexEngine.ts             # Motor de reflexos
    └── ...
```

---

## 🎯 Resumo Executivo

### Quem Pode Criar Pedidos?

**✅ Perfis que PODEM criar pedidos:**

1. **`waiter` (Garçom)** — ✅ **SIM** (Principal)
   - `dominantTool === 'order'` (sempre)
   - Acessa `MiniPOS` → `TablePanel` automaticamente
   - Origem: `APPSTAFF`
   - **Este é o perfil principal para criação de pedidos**

2. **`manager` (Gerente)** — ❌ **NÃO** (atualmente)
   - `dominantTool === 'tablet'` → `ManagerDashboard`
   - Não acessa MiniPOS diretamente
   - Pode gerenciar, mas não cria pedidos

3. **`owner` (Dono)** — ❌ **NÃO** (atualmente)
   - `dominantTool === 'none'` → `OwnerDashboard`
   - Não acessa MiniPOS diretamente
   - Pode gerenciar, mas não cria pedidos

**❌ Perfis que NÃO podem criar pedidos:**

- `kitchen` — Apenas visualiza
- `cleaning` — Apenas limpeza
- `worker` — Apenas tarefas genéricas

### AppStaff vs Garçom

- **AppStaff** = Sistema completo (todos os perfis)
- **Garçom** = Referência ao perfil `waiter` dentro do AppStaff
- **São o mesmo sistema**, mas "garçom" é um perfil específico

---

## 🔍 Como Verificar no Código

### 1. Verificar Perfis

```typescript
// merchant-portal/src/pages/AppStaff/context/StaffCoreTypes.ts
export type StaffRole = 'manager' | 'waiter' | 'kitchen' | 'cleaning' | 'worker' | 'owner';
```

### 2. Verificar DominantTool

```typescript
// merchant-portal/src/pages/AppStaff/context/StaffContext.tsx
const dominantTool = useMemo((): DominantTool => {
  if (shiftState === 'offline') return 'hands';
  if (activeRole === 'manager') return 'tablet';
  if (activeRole === 'kitchen') return 'knife';
  if (activeRole === 'waiter') return 'tray';  // Pode ser 'order'
  return 'hands';
}, [shiftState, activeRole]);
```

### 3. Verificar Acesso ao MiniPOS

```typescript
// merchant-portal/src/pages/AppStaff/AppStaff.tsx
if (dominantTool === 'order') {
  // WAITERS get the POS
  return withPreview(<MiniPOS tasks={tasks} role={activeRole} />);
}
```

---

## 📝 Conclusão

**Resposta à pergunta:**

1. **AppStaff e Garçom são iguais?**
   - ✅ Sim, são o mesmo sistema
   - "Garçom" é um perfil (`waiter`) dentro do AppStaff

2. **Quem pode fazer pedidos para a cozinha?**
   - ✅ **`waiter` (Garçom)** — Principalmente
   - ❓ **`manager` e `owner`** — Depende do contexto (precisa verificar)

3. **Como funciona?**
   - Perfil `waiter` → `dominantTool === 'order'` (sempre) → `MiniPOS` → `TablePanel` → Cria pedido com origem `APPSTAFF`
   - **Garçom sempre tem acesso ao MiniPOS quando está ativo**

---

**Documentação criada em:** 2026-01-26