# ROADMAP AS CODE — Schema Specification

> **O roadmap deixa de ser narrativa, passa a ser contrato verificável.**

---

## 📋 Propósito

Transformar o roadmap de documento Markdown em **estrutura de dados executável**:

- Cada item tem **evidências** (código, docs, runtime)
- Um script pode **validar** automaticamente
- Se alguém quebrar algo → **o scan acusa**

---

## 📐 Schema YAML

```yaml
# ROADMAP_MASTER.yaml
version: "1.0"
generated: "2026-01-18T11:30:00Z"
metadata:
  project: chefiapp-pos
  phase: "Q1 2026"
  progress: 79  # percentage

surfaces:
  - id: kernel
    name: "Kernel (Core)"
    visibility: internal
    items: []  # Kernel não tem roadmap público

  - id: panel
    name: "Dashboard"
    visibility: merchant
    items:
      - id: OPERATION_GATE_UI
        status: partial  # 60%
        priority: P1
        description: "OperationGate modal and history"
        evidence:
          code:
            - path: "src/core/flow/OperationGate.tsx"
              required: true
            - path: "src/pages/Operation/OperationStatusPage.tsx"
              required: true
          docs:
            - path: "docs/architecture/OPERATION_GATE.md"
              required: false
          runtime:
            systems:
              - orders
            guards: []
        depends_on: []
        
      - id: AUDIT_LOG_UI
        status: implemented
        priority: P2
        description: "Audit log viewer in settings"
        evidence:
          code:
            - path: "src/pages/Audit/SystemStatusPage.tsx"
              required: true
          docs: []
          runtime:
            systems: []
            guards: []
        depends_on: []

  - id: tpv
    name: "TPV (Point of Sale)"
    visibility: merchant
    items:
      - id: TPV_CORE
        status: implemented
        priority: P0
        description: "Core TPV functionality - order creation, cart, payments"
        evidence:
          code:
            - path: "src/pages/TPV/TPV.tsx"
              required: true
            - path: "src/pages/TPV/context/OrderContextReal.tsx"
              required: true
          docs:
            - path: "docs/architecture/TPV_INSTALLATION_CONTRACT.md"
              required: true
          runtime:
            systems:
              - orders
              - menu
            guards:
              - assertNoMock

      - id: TPV_FISCAL_INTEGRATION
        status: implemented
        priority: P1
        description: "InvoiceXpress fiscal integration"
        evidence:
          code:
            - path: "src/fiscal-modules/FiscalService.ts"
              required: true
            - path: "src/fiscal-modules/InvoiceXpressAdapter.ts"
              required: true
            - path: "server/api/fiscal/InvoiceXpressAdapterServer.ts"
              required: true
          docs:
            - path: "docs/architecture/FISCAL_INTEGRATION.md"
              required: false
          runtime:
            systems:
              - fiscal
            guards:
              - assertNoMock

      - id: TPV_STRIPE_PAYMENTS
        status: planned
        priority: P2
        description: "Stripe payment processing"
        evidence:
          code: []
          docs: []
          runtime:
            systems: []
            guards: []
        target_date: "Q2 2026"
        depends_on:
          - TPV_CORE

  - id: kds
    name: "KDS (Kitchen Display)"
    visibility: kitchen
    items:
      - id: KDS_REALTIME
        status: implemented
        priority: P0
        description: "Real-time order subscriptions and status"
        evidence:
          code:
            - path: "src/pages/TPV/KDS/KitchenDisplay.tsx"
              required: true
            - path: "src/pages/TPV/KDS/KDSStandalone.tsx"
              required: true
          docs: []
          runtime:
            systems:
              - orders
            guards: []

      - id: KDS_SOUND
        status: partial
        priority: P3
        description: "Sound notifications on new orders"
        evidence:
          code:
            - path: "src/pages/TPV/KDS/KitchenDisplay.tsx"
              required: true
          docs: []
          runtime:
            systems: []
            guards: []

  - id: staff
    name: "AppStaff"
    visibility: staff
    items:
      - id: STAFF_TASK_STREAM
        status: implemented
        priority: P0
        description: "Worker task stream and management"
        evidence:
          code:
            - path: "src/pages/AppStaff/StaffModule.tsx"
              required: true
            - path: "src/pages/AppStaff/components/WorkerTaskStream.tsx"
              required: true
          docs:
            - path: "docs/WAITER_COMMANDER_ROADMAP.md"
              required: false
          runtime:
            systems:
              - staff
            guards: []

      - id: STAFF_MINIPOS
        status: implemented
        priority: P1
        description: "MiniPOS for waiters - table selection and ordering"
        evidence:
          code:
            - path: "src/pages/AppStaff/features/MiniPOS.tsx"
              required: true
          docs: []
          runtime:
            systems:
              - orders
              - tables
            guards: []

  - id: web
    name: "Public Web"
    visibility: public
    items:
      - id: WEB_PUBLIC_MENU
        status: implemented
        priority: P0
        description: "Public menu pages"
        evidence:
          code:
            - path: "src/pages/Public/PublicPages.tsx"
              required: true
          docs: []
          runtime:
            systems:
              - menu
            guards: []

systems:
  - id: orders
    name: "Order System"
    status: OK
    evidence:
      - "src/core/sovereignty/OrderSovereignty.ts"

  - id: tables
    name: "Table System"
    status: OK
    evidence:
      - "src/core/sovereignty/TableSovereignty.ts"

  - id: cashRegister
    name: "Cash Register"
    status: OK
    evidence:
      - "src/core/sovereignty/CashRegisterSovereignty.ts"

  - id: fiscal
    name: "Fiscal System"
    status: CONFIGURED
    evidence:
      - "src/fiscal-modules/FiscalService.ts"

  - id: menu
    name: "Menu System"
    status: OK
    evidence:
      - "src/pages/Menu/MenuManager.tsx"

  - id: staff
    name: "Staff System"
    status: OK
    evidence:
      - "src/pages/AppStaff/context/StaffContext.tsx"

guards:
  - id: assertNoMock
    description: "Crashes app if mock used in production"
    required_in_prod: true
    
  - id: dbWriteGate
    description: "Protects database writes"
    required_in_prod: false
    
  - id: runtimeContext
    description: "Enforces correct runtime mode"
    required_in_prod: true

observability:
  logs:
    status: active
    evidence:
      - "src/core/logger/Logger.ts"
      
  monitoring:
    status: planned
    evidence: []
    target: "UptimeRobot"
    
  alerts:
    status: planned
    evidence: []
    target: "Discord webhooks"
```

---

## 🔍 Status Values

| Status | Meaning | Truth Scan |
|--------|---------|------------|
| `implemented` | Code exists + working | ✅ Validate all evidence |
| `partial` | Code exists, incomplete | ⚠️ Validate code, flag missing |
| `configured` | Requires setup, not code | ✅ Check runtime systems |
| `planned` | Future work | ⏭️ Skip validation |
| `blocked` | Waiting on dependency | ⏭️ Check depends_on |

---

## ✅ Evidence Schema

```yaml
evidence:
  code:
    - path: "relative/path/to/file.ts"
      required: true  # Must exist for status=implemented
      
  docs:
    - path: "docs/something.md"
      required: false  # Optional documentation
      
  runtime:
    systems:
      - orders      # Must show OK/CONFIGURED in SYSTEM_STATE
      - fiscal
    guards:
      - assertNoMock  # Must be active in prod
```

---

## 🔗 Integration with Truth Scan

```bash
pnpm truth:scan

# Output:
┌─────────────────────────────────────────────────────────┐
│ CHEFIAPP TRUTH SCAN — 2026-01-18T11:30:00Z              │
├─────────────────────────────────────────────────────────┤
│ ✅ TPV_CORE — IMPLEMENTED (4/4 evidence files)         │
│ ✅ TPV_FISCAL_INTEGRATION — IMPLEMENTED (3/3 files)    │
│ ⚠️ KDS_SOUND — PARTIAL (code exists, feature disabled) │
│ ❌ MONITORING — MISSING (doc only, no code)            │
│ ⏭️ TPV_STRIPE_PAYMENTS — PLANNED (skipped)             │
├─────────────────────────────────────────────────────────┤
│ Overall: 85% verified | 2 warnings | 1 missing         │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 File Location

```
docs/
├── ROADMAP_MASTER.md      # Human-readable (generated)
├── roadmap/
│   ├── ROADMAP_MASTER.yaml   # Machine-readable (source of truth)
│   └── ROADMAP_SCHEMA.md     # This document
```

---

## 🔄 Workflow

1. **Edit YAML** → Make changes to `ROADMAP_MASTER.yaml`
2. **Run Scan** → `pnpm truth:scan` validates evidence
3. **Generate MD** → Optional: generate human-readable from YAML
4. **CI Check** → Scan runs on PR, blocks if failures

---

## 🚫 Rules

1. **No item without evidence** → Planned items must have at least target_date
2. **No implemented without code** → Status `implemented` requires code paths
3. **No runtime without systems** → If runtime is checked, systems must be listed
4. **Guards are prod-only** → Guards only validated in `environment: prod`
