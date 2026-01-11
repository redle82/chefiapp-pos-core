# 🏗️ TPV Canonical Architecture
> **Strategy**: Shared Structure, Unique Identity.
> **Philosophy**: Respect the Waiter's Cognitive Model.

This document defines the **Canonical Layout** for all Operational Screens (TPV, KDS, Dispatch).
We do not reinvent the wheel here. We adopt the market standard for ergonomics and differentiate with our **Unified Design System (UDS)**.

---

## 1. The 3-Zone Standard
Every TPV screen must adhere to this structural division:

```
┌────────────────────────────────────────────────────────┐
│  STATUS BAR (System Health / User / Shift)             │
├──────────────┬────────────────────────┬────────────────┤
│  ZONE A      │  ZONE B                │  ZONE C        │
│  (Command)   │  (The Stream)          │  (Context)     │
│              │                        │                │
│  Navigation  │  Active Orders         │  Menu          │
│  Actions     │  Ticket Tunnel         │  Table Map     │
│  Shift Mgmt  │  "The Truth"           │  Item Details  │
│              │                        │                │
└──────────────┴────────────────────────┴────────────────┘
     25%               45%                   30%
```

### Zone A: Command (Stability)
*   **Purpose**: Anchor the user. Navigation and primary global actions.
*   **Content**: "Nova Venda", "Mesas", "Caixa", Shift Status.
*   **Rule**: Never changes structure. Muscle memory location.

### Zone B: The Stream (Focus)
*   **Purpose**: Process valid work.
*   **Content**: Active Tickets, KDS Orders.
*   **Visuals**: "Visual Tunnel" (Darker/Lighter container).
*   **Rule**: Must show status clearly. No noise.

### Zone C: Context (Utility)
*   **Purpose**: Input and Detail.
*   **Content**: The Menu (always accessible), Table Grid, Ticket Details.
*   **Rule**: **1-Touch Access**. The menu must never be more than 1 tap away.

---

## 2. Interaction Patterns

### The "Waiter's Loop"
The architecture supports the infinite loop of service:
1.  **Scan** Stream (Zone B) for issues.
2.  **Tap** "Nova Venda" (Zone A).
3.  **Select** Items from Menu (Zone C).
4.  **Confirm** (Zone C/A).
5.  **Return** to Stream (Zone B).

### The "Dark Cockpit" Implementation
*   **Global Background**: `colors.surface.base` (True Black).
*   **Separators**: `borders.subtle` (Zinc-800).
*   **Active Elements**: High Contrast (`text.primary` on `surface.layer2`).

---

## 3. Differentiation (The "Skin")
While the structure is standard, the Identity is unique to ChefIApp:
*   **Typography**: Inter (Operational Weights).
*   **Colors**: Deep Zinc + Vibrant Token Semantics (Emerald/Amber).
*   **Shapes**: Large Radius (`radius.xl`) for modern feel.
*   **Micro-interactions**: Snappy, instant feedback (0 latency feel).
