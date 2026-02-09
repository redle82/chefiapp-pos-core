# DATA_VISIBILITY_CONTRACT (The Read Plane)

This contract defines the authoritative visibility boundaries for ChefIApp data.

## 1. Visibility Hierarchies

- **Administrative Plane**: `Owner` and `Admin` have total visibility (Read-All) over financial, operational, and configuration data.
- **Operational Plane**: `Manager` has full visibility over the current restaurant state, but MAY be restricted from historical billing data (Billing Plane).
- **Execution Plane**: `Waiter` and `KDS` have visibility strictly limited to **Active Operational Tasks** (Current Orders, Status) and the Menu. They MUST NOT have access to aggregate store financials or sensitive configuration.

## 2. Data Categories

- **Financial (High-Trust)**: Daily Totals, Revenue, Billing status. Visible: `Owner`, `Admin`.
- **Operational (Task-Driven)**: Active Orders, Table status, Items. Visible: All operational roles.
- **Confidential (Core)**: Logs, Audit trails, Security metadata. Visible: `Core` only (via Engineering tools).

## 3. Enforcement

- **Frontend**: Navigation and Data Fetching MUST respect the role defined in `TenantResolver.ts`.
- **Backend (RLS)**: Core security SHOULD enforce these boundaries via Row Level Security to prevent horizontal data leaks, ensuring even a compromised TPV cannot read a restaurant's total revenue.

## 4. Multi-Tenant Isolation

- **Sovereign Isolation**: A user belonging to Tenant A MUST NEVER see any data from Tenant B. This is the absolute law of the system (Nível 0).

---

_Status: CANONIZED - 2026-01-31_
