# UI CONTRACT

## What UI Components CAN and CANNOT Do

> **Status:** LOCKED  
> **Enforcement:** `audit:architecture`

---

## ✅ UI CAN

| Action | Example |
|--------|---------|
| Display data from props/context | `{order.total}` |
| Dispatch intents to Domain | `onClick={() => performOrderAction(id, 'pay')}` |
| Format for display | `formatMoney(order.total)` |
| Handle user input | `onChange={(e) => setInputValue(e.target.value)}` |
| Local UI state | `useState` for modals, hover, selection |
| Conditional rendering | `{order.status === 'paid' && <Badge />}` |

---

## ❌ UI CANNOT

| Action | Why | Correct Approach |
|--------|-----|------------------|
| Calculate totals | Diverges from Domain truth | Use `order.total` |
| Decide permissions | Gate layer responsibility | Use `usePermissions()` |
| Mutate order status | Domain layer responsibility | Call `performOrderAction()` |
| Read storage directly | Gate layer responsibility | Use context/props |
| Make business decisions | Domain layer responsibility | Call Domain engines |

---

## 🏛️ THE LAW

```
UI = f(Domain State)
```

UI is a **pure function** of Domain state.  
It projects, it does not decide.

---

## 📌 Enforcement

```bash
npm run audit:architecture
```

Checks INV-006: No `items.reduce()` patterns in UI components.
