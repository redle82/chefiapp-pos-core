# 📱 AppStaff — Resumo Visual

**Data:** 2026-01-26

---

## 🎯 Resposta Rápida

### AppStaff e Garçom são iguais?

**✅ SIM** — São o mesmo sistema. "Garçom" é um **perfil** (`waiter`) dentro do AppStaff.

### Quem pode fazer pedidos para a cozinha?

**✅ Apenas `waiter` (Garçom)** pode criar pedidos.

---

## 👥 Perfis e Capacidades

```
┌─────────────────────────────────────────────────────────┐
│                    APPSTAFF                              │
│              (Sistema Unificado)                        │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Owner   │         │ Manager │         │ Workers │
   │ (owner) │         │(manager)│         │         │
   └─────────┘         └─────────┘         └─────────┘
        │                   │                   │
        │                   │                   │
   Dashboard          Dashboard          ┌───────┴───────┐
   (gerencial)        (gerencial)       │               │
                                        ▼               ▼
                                   ┌─────────┐    ┌─────────┐
                                   │ Waiter  │    │ Kitchen │
                                   │(waiter) │    │(kitchen) │
                                   └─────────┘    └─────────┘
                                        │               │
                                        │               │
                                   ✅ MiniPOS      ❌ KDS
                                   (cria pedidos)  (apenas vê)
```

---

## ✅ Quem Pode Criar Pedidos?

### Perfil `waiter` (Garçom)

```
waiter (Garçom)
  ↓
dominantTool = 'order' (sempre)
  ↓
MiniPOS component
  ↓
TablePanel (ao selecionar mesa)
  ↓
createOrder() com origem 'APPSTAFF'
  ↓
✅ Pedido criado → Aparece no KDS
```

**Status:** ✅ **PODE criar pedidos**

---

### Perfil `kitchen` (Cozinha)

```
kitchen (Cozinha)
  ↓
dominantTool = 'production' ou 'check'
  ↓
KitchenDisplay (KDS)
  ↓
❌ Apenas visualiza pedidos
```

**Status:** ❌ **NÃO pode criar pedidos**

---

### Perfil `manager` (Gerente)

```
manager (Gerente)
  ↓
dominantTool = 'tablet'
  ↓
ManagerDashboard
  ↓
❌ Não acessa MiniPOS
```

**Status:** ❌ **NÃO pode criar pedidos** (atualmente)

---

### Perfil `owner` (Dono)

```
owner (Dono)
  ↓
dominantTool = 'none'
  ↓
OwnerDashboard
  ↓
❌ Não acessa MiniPOS
```

**Status:** ❌ **NÃO pode criar pedidos** (atualmente)

---

### Perfil `cleaning` (Limpeza)

```
cleaning (Limpeza)
  ↓
dominantTool = 'check'
  ↓
CleaningTaskView
  ↓
❌ Apenas checklist
```

**Status:** ❌ **NÃO pode criar pedidos**

---

### Perfil `worker` (Trabalhador Genérico)

```
worker (Genérico)
  ↓
dominantTool = 'hands'
  ↓
WorkerTaskStream
  ↓
❌ Apenas tarefas
```

**Status:** ❌ **NÃO pode criar pedidos**

---

## 📊 Tabela Resumo

| Perfil | DominantTool | Interface | Pode Criar Pedidos? | Origem do Pedido |
|--------|--------------|-----------|---------------------|------------------|
| **waiter** | `order` | MiniPOS → TablePanel | ✅ **SIM** | `APPSTAFF` |
| **kitchen** | `production` / `check` | KitchenDisplay | ❌ Não | - |
| **manager** | `tablet` | ManagerDashboard | ❌ Não | - |
| **owner** | `none` | OwnerDashboard | ❌ Não | - |
| **cleaning** | `check` | CleaningTaskView | ❌ Não | - |
| **worker** | `hands` | WorkerTaskStream | ❌ Não | - |

---

## 🔍 Fluxo Completo de Criação de Pedido

```
1. Funcionário faz login no AppStaff
   ↓
2. Sistema identifica perfil: waiter
   ↓
3. Sistema define: dominantTool = 'order'
   ↓
4. AppStaff.tsx renderiza: <MiniPOS />
   ↓
5. Garçom seleciona mesa
   ↓
6. MiniPOS renderiza: <TablePanel tableId={...} />
   ↓
7. Garçom adiciona itens e envia pedido
   ↓
8. TablePanel detecta: window.location.pathname.includes('/app/staff')
   ↓
9. TablePanel cria pedido com: origin = 'APPSTAFF'
   ↓
10. Pedido aparece no KDS com badge 👤 APPSTAFF
```

---

## 🎯 Conclusão

### Respostas Diretas

1. **AppStaff e Garçom são iguais?**
   - ✅ **SIM** — AppStaff é o sistema, Garçom é o perfil `waiter` dentro dele

2. **Quem pode fazer pedidos para a cozinha?**
   - ✅ **Apenas `waiter` (Garçom)**
   - ❌ Outros perfis não têm acesso ao MiniPOS

3. **Como funciona?**
   - Perfil `waiter` → `dominantTool = 'order'` → `MiniPOS` → `TablePanel` → Cria pedido com origem `APPSTAFF`

---

**Documentação criada em:** 2026-01-26