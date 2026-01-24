# ChefIApp OS — Canonical Architecture Diagram

## The Layered Gate Architecture

---

## 🏛️ STRUCTURAL VIEW

```mermaid
graph TB
    subgraph L0["L0: RUNTIME (Physics)"]
        Browser["🌐 Browser"]
        React["⚛️ React"]
        JS["⚡ JS Engine"]
    end

    subgraph L1["L1: KERNEL (Sovereignty)"]
        Kernel["🔒 CoreKernel.ts"]
    end

    subgraph L2["L2: BOOTSTRAP (Orchestration)"]
        Boot["🥾 BootstrapComposer.tsx"]
    end

    subgraph L3["L3: GATES (Laws)"]
        FlowGate["🚪 FlowGate.tsx"]
        TenantRes["🏢 TenantResolver.ts"]
        OpGate["⚙️ OperationGate.tsx"]
        DomainWrapper["🌉 AppDomainWrapper.tsx"]
    end

    subgraph L4["L4: DOMAIN (Truth)"]
        OrderCtx["📦 OrderContext"]
        ProductCtx["🍽️ ProductContext"]
        TableCtx["🪑 TableContext"]
        TaskOps["📋 TaskOps"]
    end

    subgraph L5["L5: VIEWS (Projection)"]
        TPV["💳 TPV"]
        KDS["🍳 KDS"]
        Staff["👔 App Staff"]
        Dashboard["📊 Dashboard"]
    end

    subgraph DB["DATABASE (Judge)"]
        Postgres["🗄️ Postgres"]
        Triggers["⚡ Triggers"]
        RLS["🔐 RLS Policies"]
    end

    Browser --> Kernel
    Kernel -->|"READY?"| Boot
    Boot --> FlowGate
    FlowGate -->|"Auth + Tenant"| TenantRes
    TenantRes -->|"ACTIVE"| OpGate
    OpGate -->|"Session Valid"| DomainWrapper
    DomainWrapper -->|"tenantId prop"| OrderCtx
    DomainWrapper -->|"tenantId prop"| ProductCtx
    DomainWrapper -->|"tenantId prop"| TableCtx
    
    OrderCtx --> TPV
    OrderCtx --> KDS
    ProductCtx --> TPV
    TaskOps --> Staff
    OrderCtx --> Dashboard
    
    OrderCtx <-->|"Mutations"| Postgres
    Postgres --> Triggers
    Triggers -->|"Validation"| Postgres
```

---

## 🥾 BOOT SEQUENCE

```mermaid
sequenceDiagram
    participant Browser
    participant Kernel as CoreKernel
    participant Boot as BootstrapComposer
    participant FG as FlowGate
    participant TR as TenantResolver
    participant OG as OperationGate
    participant DW as AppDomainWrapper
    participant Domain as OrderContext
    participant View as TPV

    Browser->>Kernel: Load
    Kernel->>Kernel: signal(L2, 'stable')
    
    Kernel->>Boot: isReady(L2)?
    Boot->>Boot: Mount Providers
    
    Boot->>FG: Render
    FG->>FG: Check Session
    
    alt No Session
        FG-->>Browser: Redirect /auth
    else Session Valid
        FG->>TR: resolve(userId)
        TR->>TR: Fetch Memberships
        
        alt Single Tenant
            TR->>TR: Auto-select
        else Multiple Tenants
            TR-->>Browser: Redirect /select-tenant
        end
        
        TR->>TR: setActiveTenant(id, 'ACTIVE')
        TR-->>FG: RESOLVED
    end
    
    FG->>OG: Render Children
    OG->>OG: Check operation_status
    
    alt Status = paused/suspended
        OG-->>Browser: Redirect /paused
    else Status = active
        OG->>DW: Render
    end
    
    DW->>DW: useTenant()
    DW->>Domain: <OrderProvider restaurantId={tenantId}>
    
    Domain->>View: Render TPV
    View->>View: Display Menu
```

---

## 🔄 ORDER FLOW (E2E)

```mermaid
sequenceDiagram
    participant Waiter as 👨‍🍳 Waiter
    participant TPV as 💳 TPV
    participant Domain as 📦 OrderEngine
    participant DB as 🗄️ Database
    participant KDS as 🍳 KDS
    participant Staff as 👔 Staff App

    Waiter->>TPV: Select Items
    TPV->>Domain: createOrder({items, tableId})
    
    Domain->>Domain: Validate Cash Register Open
    Domain->>DB: INSERT gm_orders
    
    DB->>DB: TRIGGER: validate_session
    DB->>DB: TRIGGER: validate_restaurant
    
    alt Validation Failed
        DB-->>Domain: Error (constraint)
        Domain-->>TPV: Show Error
    else Validation Passed
        DB-->>Domain: Order Created
        DB->>KDS: Realtime: NEW ORDER
        DB->>Staff: Realtime: TASK CREATED
    end
    
    Domain-->>TPV: Order Confirmed
    
    Note over KDS: Kitchen sees order
    Note over Staff: Task appears
    
    Waiter->>TPV: Mark as Paid
    TPV->>Domain: performAction('pay', {method: 'cash'})
    
    Domain->>DB: RPC: process_order_payment
    DB->>DB: TRIGGER: validate_amount
    DB->>DB: TRIGGER: check_idempotency
    DB->>DB: UPDATE status = 'PAID'
    
    DB-->>Domain: Payment Confirmed
    Domain-->>TPV: Success ✓
```

---

## 🧭 GATE DECISION TREE

```mermaid
flowchart TD
    START([Request to /app/*]) --> FG{FlowGate}
    
    FG -->|No Session| AUTH[/auth]
    FG -->|Session Valid| CHECK_TENANT{Tenant Status?}
    
    CHECK_TENANT -->|ACTIVE| PASS[✓ Continue]
    CHECK_TENANT -->|UNSELECTED| RESOLVE{Resolve Tenant}
    
    RESOLVE -->|No Tenants| ONBOARD[/onboarding/identity]
    RESOLVE -->|Single Tenant| AUTO[Auto-select + SEAL]
    RESOLVE -->|Multiple| SELECT[/app/select-tenant]
    
    AUTO --> PASS
    SELECT -->|User Selects| SEAL[setActiveTenant + SEAL]
    SEAL --> PASS
    
    PASS --> OG{OperationGate}
    
    OG -->|active| DOMAIN[Domain Layer]
    OG -->|paused| PAUSED[/app/paused]
    OG -->|suspended| SUSPENDED[/app/suspended]
    
    DOMAIN --> VIEW[View Renders]
```

---

## 📊 LAYER RESPONSIBILITIES

| Layer | Component | Responsibility | Never Does |
|-------|-----------|----------------|------------|
| L0 | Runtime | Execute code | Make decisions |
| L1 | Kernel | Assert causality | Render UI |
| L2 | Bootstrap | Orchestrate boot | Know domain |
| L3 | Gates | Validate identity/context | Store data |
| L4 | Domain | Business logic | Resolve tenant |
| L5 | Views | Display state | Mutate truth |
| DB | Postgres | Judge final | Trust frontend |

---

## 🏁 THE LAW

> **ChefIApp OS is not assembled by components.**  
> **It is assembled by TRUTH → GATES → CONTRACTS → EXECUTION.**

If a layer violates its boundary, the system is in an illegal state.
