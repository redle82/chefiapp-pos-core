# ChefiApp POS Core - Domain Specification

> Canonical reference for all bounded contexts, state machines, invariants, and integration points.
> This document is the single source of truth for domain rules across the entire ChefiApp system.

**Version:** 1.0.0
**Last updated:** 2026-03-20

---

## Table of Contents

1. [Order Management](#1-order-management)
2. [Payments](#2-payments)
3. [Floor & Service](#3-floor--service)
4. [Kitchen Operations](#4-kitchen-operations)
5. [Staff & Shifts](#5-staff--shifts)
6. [Catalog & Pricing](#6-catalog--pricing)
7. [Inventory](#7-inventory)
8. [Reservations](#8-reservations)
9. [CRM & Loyalty](#9-crm--loyalty)
10. [Fiscal & Compliance](#10-fiscal--compliance)
11. [Ubiquitous Language Glossary](#11-ubiquitous-language-glossary)

---

## 1. Order Management

### Entities

| Entity | Description |
|---|---|
| **Order** | A request for products placed by or on behalf of a customer. Carries status, items, totals, and origin. |
| **OrderItem** | A single line in an order: product reference, quantity, unit price, modifiers, notes. |
| **OrderItemModifier** | An add-on or variant applied to an item (e.g., "extra cheese", "no onions"). |

### State Machine

```
OPEN ──► PREPARING ──► READY ──► DELIVERED ──► PAID
  │          │            │          │            │
  └──────────┴────────────┴──────────┴────────────┴──► CANCELLED
```

| From | To | Trigger | Guard |
|---|---|---|---|
| OPEN | PREPARING | Send to kitchen | At least one item present |
| PREPARING | READY | All kitchen items marked ready | Kitchen confirms |
| READY | DELIVERED | Server picks up / expo clears | - |
| DELIVERED | PAID | Payment completed | Full amount settled |
| Any active | CANCELLED | Cancel action | If PAID, requires manager/owner role |
| PAID/CANCELLED/DELIVERED | OPEN | Reopen | Requires manager/owner + non-empty reason (audit) |

### Invariants

| ID | Rule | Enforced by |
|---|---|---|
| ORD-01 | Only OPEN or PREPARING orders can be modified (items added/removed). | `canModifyOrder()` |
| ORD-02 | Cancelling a PAID order requires manager or owner role. | `canCancelOrder()` |
| ORD-03 | Reopening an order requires manager/owner role AND a non-empty textual reason. | `canReopenOrder()` |
| ORD-04 | A discount amount must be positive and cannot exceed the order subtotal. | `canApplyDiscount()` |
| ORD-05 | Discount application requires the order to be in a modifiable status. | `canApplyDiscount()` |
| ORD-06 | Expired discounts or those exceeding max uses are rejected. | `canApplyDiscount()` |
| ORD-07 | Bill splitting requires PREPARING or later status (not OPEN, PAID, or CANCELLED). | `canSplitBill()` |
| ORD-08 | Bill splitting requires at least one item. | `canSplitBill()` |
| ORD-09 | Item quantity must be a positive integer. | Application-level validation |
| ORD-10 | Split bill parts must sum to the exact order total (no rounding leakage). | Application-level validation |

### Events Emitted

| Event | When |
|---|---|
| `ORDER_CREATED` | New order saved with initial items |
| `ORDER_PAID` | Payment fully settles the order |
| `ORDER_CANCELLED` | Order moves to CANCELLED with reason and actor |
| `ORDER_REOPENED` | Order moves back to OPEN with reason and actor |
| `DISCOUNT_APPLIED` | Discount successfully applied to an order |

### Integration Points

- **Kitchen Operations:** Order items dispatched as kitchen tickets on PREPARING transition.
- **Payments:** Payment context reads order total; on completion emits ORDER_PAID.
- **Floor & Service:** Table status transitions correlate with order lifecycle.
- **Fiscal & Compliance:** Order closure triggers receipt generation.

---

## 2. Payments

### Entities

| Entity | Description |
|---|---|
| **Payment** | A monetary transaction against an order. Carries amount, method, and status. |
| **Refund** | A reversal of a completed payment, partial or full. |
| **Tip** | An optional gratuity amount added before payment finalization. |

### State Machine

```
pending ──► completed
  │              │
  │              └──► refunded
  │
  └──► failed
```

| From | To | Trigger | Guard |
|---|---|---|---|
| pending | completed | Provider confirms settlement | - |
| pending | failed | Provider rejects / timeout | - |
| completed | refunded | Manager/owner issues refund | Refund amount <= payment amount |

### Payment Flow States (UI FSM)

```
idle ──► creating ──► ready ──► polling ──► completed
                        │                      │
                        └──► failed             └──► expired
```

### Supported Methods

`cash`, `card`, `mbway`, `pix`, `sumup_eur`, `loyalty`

Methods available per region: BR (pix, cash, card), PT (mbway, card, cash, sumup_eur), etc.

### Invariants

| ID | Rule | Enforced by |
|---|---|---|
| PAY-01 | Cannot pay an already PAID or CANCELLED order. | `canProcessPayment()` |
| PAY-02 | Order must have at least one item and total > 0 to be payable. | `canProcessPayment()` |
| PAY-03 | Only completed payments can be refunded. | `canRefund()` |
| PAY-04 | Only manager/owner can issue refunds. | `canRefund()` |
| PAY-05 | Refund amount must be > 0 and <= original payment amount. | `canRefund()` |
| PAY-06 | Tip cannot be negative. | `validateTip()` |
| PAY-07 | Tip cannot exceed 100% of the subtotal. | `validateTip()` |
| PAY-08 | Reconciliation requires completed status + external reference. | `canReconcile()` |
| PAY-09 | Split bill parts must sum to exact order total (no cents lost). | Application-level validation |
| PAY-10 | Offline mode restricts methods to cash only (no provider dependency). | Application-level validation |

### Events Emitted

| Event | When |
|---|---|
| `ORDER_PAID` | Payment fully settles the associated order |
| `PAYMENT_REFUNDED` | A refund is successfully processed |

### Integration Points

- **Order Management:** Reads order totals; writes payment status back.
- **Fiscal & Compliance:** Payment completion triggers fiscal document issuance.
- **CRM & Loyalty:** Loyalty points may be earned or redeemed via payment.

---

## 3. Floor & Service

### Entities

| Entity | Description |
|---|---|
| **Table** | A physical seating position identified by number and zone. |
| **Zone** | A logical grouping of tables (e.g., Terrace, Main Hall, Bar). |
| **FloorPlan** | The spatial arrangement of zones and tables for a restaurant. |
| **Cover** | A single guest seat at a table, used for per-capita metrics. |

### State Machine

```
FREE ──► OCCUPIED ──► BILL_PENDING ──► FREE
  │                        │
  ▼                        │
RESERVED ──► OCCUPIED      │
  │                        │
  └──► FREE (no-show/cancel)
```

| From | To | Trigger | Guard |
|---|---|---|---|
| FREE | OCCUPIED | Order created for table | - |
| FREE | RESERVED | Reservation confirmed for table | Slot available |
| RESERVED | OCCUPIED | Guest arrives and is seated | Reservation exists |
| RESERVED | FREE | Reservation cancelled or no-show | - |
| OCCUPIED | BILL_PENDING | All items delivered, payment requested | - |
| BILL_PENDING | FREE | Payment completed | Order PAID |

### Table Operations

| Operation | Rule |
|---|---|
| **Merge** | Two or more adjacent tables combined into one logical table. All orders transfer to the merged entity. Tables must be in the same zone. |
| **Split** | A merged table separated back into individual tables. Requires all orders to be reassigned first. |
| **Transfer** | Move an order from one table to another. Target table must be FREE or already OCCUPIED by the same party. |

### Invariants

| ID | Rule |
|---|---|
| FLR-01 | A table cannot be in RESERVED and OCCUPIED at the same time. |
| FLR-02 | Merge is only allowed for tables in the same zone. |
| FLR-03 | A table with an active unpaid order cannot be marked FREE. |
| FLR-04 | Cover count must be a positive integer. |
| FLR-05 | Zone assignment is mandatory for every table. |

### Events Emitted

Table state changes are tracked via order and reservation events (no dedicated table events currently).

### Integration Points

- **Order Management:** Table status driven by order lifecycle.
- **Reservations:** Reserved tables link to reservation entity.
- **Staff & Shifts:** Zone assignment determines waiter coverage.

---

## 4. Kitchen Operations

### Entities

| Entity | Description |
|---|---|
| **KitchenOrder** | The kitchen's view of an order: items grouped by station with prep tracking. |
| **KitchenItem** | A single item to prepare, with status, prep time, and station assignment. |
| **Station** | A work area (KITCHEN, BAR, PASTRY, etc.) that receives relevant items. |

### State Machine (per item)

```
pending ──► preparing ──► ready ──► delivered
  │              │
  └──────────────┴──► cancelled
```

| From | To | Trigger | Guard |
|---|---|---|---|
| pending | preparing | Cook starts item | Station assigned |
| preparing | ready | Cook marks done | - |
| ready | delivered | Server picks up / expo clears | - |
| pending/preparing | cancelled | Order item cancelled | - |

### Priority Levels

| Level | Meaning |
|---|---|
| `normal` | Standard FIFO processing |
| `high` | Prioritized ahead of normal items |
| `urgent` | Immediate attention required (VIP, remake, complaint) |

### Timer Thresholds

| State | Default (minutes) |
|---|---|
| `attention` | 5 |
| `delay` | 10 |

### Operational Modes

| Mode | Description |
|---|---|
| **Single** | One active order at a time per station (small kitchens). |
| **Multiple** | Multiple orders in parallel (high-volume service). |

### Invariants

| ID | Rule |
|---|---|
| KIT-01 | An item can only move to `preparing` if it is currently `pending`. |
| KIT-02 | A `cancelled` item cannot transition to any other status. |
| KIT-03 | Prep time must be a non-negative number. |
| KIT-04 | Every item must be assigned to exactly one station. |
| KIT-05 | Priority escalation (normal -> high -> urgent) is one-way during active prep. |

### Events Emitted

Kitchen state changes are currently communicated via realtime subscriptions, not discrete domain events.

### Integration Points

- **Order Management:** Receives items when order enters PREPARING.
- **Floor & Service:** "Ready" signal propagates to expo/waiter surfaces.
- **Inventory:** Item preparation triggers stock deduction.

---

## 5. Staff & Shifts

### Entities

| Entity | Description |
|---|---|
| **ShiftSnapshot** | The live state of an operator's attendance: clock-in/out times, breaks, status. |
| **Shift** | A scheduled work period with role, station, and time range. |
| **Attendance** | The actual check-in/check-out record against a scheduled shift. |
| **Schedule** | A weekly collection of shifts for a restaurant. |

### State Machine (ShiftSnapshot - live attendance)

```
active ──► on_break ──► active ──► completed
  │                                    │
  └────────────────────────────────────┴──► auto_closed
```

| From | To | Trigger | Guard |
|---|---|---|---|
| (none) | active | Clock in | No existing active shift for operator |
| active | on_break | Start break | No open break already |
| on_break | active | End break | - |
| active | completed | Clock out | No active break open |
| active | auto_closed | System timeout / end-of-day | - |

### Shift Roles

`WAITER`, `KITCHEN`, `BAR`, `MANAGER`, `CLEANING`

### Invariants

| ID | Rule | Enforced by |
|---|---|---|
| STF-01 | Cannot clock in if already clocked in (no double clock-in). | `canClockIn()` |
| STF-02 | Must end active break before clocking out. | `canClockOut()` |
| STF-03 | Can only start a break from `active` status with no open break. | `canStartBreak()` |
| STF-04 | Only manager/owner can edit past shift records. | `canEditShift()` |
| STF-05 | Break duration cannot exceed total shift duration. | Application-level validation |
| STF-06 | Overtime is calculated as actual hours minus scheduled hours (when positive). | Application-level calculation |

### Events Emitted

| Event | When |
|---|---|
| `SHIFT_STARTED` | Operator clocks in |
| `SHIFT_ENDED` | Operator clocks out, total minutes recorded |

### Integration Points

- **Floor & Service:** Active staff determines zone coverage.
- **Order Management:** Waiter assignment to orders requires active shift.
- **Fiscal & Compliance:** Shift records form part of labor compliance audit trail.

---

## 6. Catalog & Pricing

### Entities

| Entity | Description |
|---|---|
| **Product** | A sellable item with name, price, category, and availability flag. |
| **Category** | A grouping for products (Starters, Mains, Drinks, Desserts). |
| **ModifierGroup** | A set of optional add-ons or variants for a product (e.g., "Size", "Extras"). |
| **Combo / Bundle** | A pre-defined set of products sold at a combined price. |

### Availability Rules

| Rule | Description |
|---|---|
| **Time-based** | Products can be restricted to specific service periods (lunch, dinner). |
| **Stock-based** | Products auto-disable when linked inventory item reaches zero. |
| **Manual** | Staff can manually toggle product availability (86'd items). |

### VAT / Tax Rules

| Rule | Description |
|---|---|
| VAT rate is per product category, configured at restaurant level. | |
| Tax-inclusive pricing: displayed price includes VAT. | |
| Tax calculation: `tax = subtotal - (subtotal / (1 + vatRate))` for inclusive pricing. | |
| Multiple VAT rates on a single order are supported (e.g., food 13%, drinks 23% in PT). | |

### Discount Application Order

1. Item-level discounts applied first (per-item percentage or fixed).
2. Order-level discounts applied to the post-item-discount subtotal.
3. Loyalty points redemption applied after all discounts.
4. Final total cannot be negative (floor at 0).

### Invariants

| ID | Rule |
|---|---|
| CAT-01 | Product price must be non-negative. |
| CAT-02 | VAT rate must be between 0% and 100%. |
| CAT-03 | A product must belong to exactly one category. |
| CAT-04 | Combo price must not exceed the sum of individual item prices. |
| CAT-05 | Modifier prices are additive (can be zero, cannot be negative). |

### Integration Points

- **Order Management:** Products referenced by OrderItems.
- **Inventory:** Stock-based availability driven by inventory levels.
- **Fiscal & Compliance:** VAT rates required for fiscal document generation.

---

## 7. Inventory

### Entities

| Entity | Description |
|---|---|
| **InventoryItem** | A trackable stock unit with current quantity and metadata. |
| **StockLocation** | A storage location (Main Kitchen, Bar Store, Walk-in Fridge). |
| **StockMovement** | A record of quantity change: receipt, consumption, waste, transfer. |

### Stock Movement Types

| Type | Direction | Description |
|---|---|---|
| **Receipt** | in | Goods received from supplier |
| **Consumption** | out | Deducted when kitchen prepares items |
| **Waste** | out | Recorded spoilage, breakage, or expiry |
| **Transfer** | in/out | Movement between locations |
| **Adjustment** | in/out | Manual correction (inventory count) |

### Invariants

| ID | Rule | Enforced by |
|---|---|---|
| INV-01 | Waste quantity must be a positive finite number. | `canRecordWaste()` |
| INV-02 | Waste recording requires a valid item reference. | `canRecordWaste()` |
| INV-03 | Transfer source and destination must be different locations. | `canTransferStock()` |
| INV-04 | Transfer quantity must be positive and finite. | `canTransferStock()` |
| INV-05 | Transfer quantity cannot exceed available stock at source. | `canTransferStock()` |
| INV-06 | Stock level cannot go negative after any deduction. | Application-level validation |
| INV-07 | Low stock threshold triggers alert but does not block operations. | Application-level notification |

### Reorder Point

When `currentStock <= reorderPoint`, the system generates a low-stock alert. This is advisory, not blocking.

### Events Emitted

| Event | When |
|---|---|
| `WASTE_RECORDED` | Waste successfully logged |
| `STOCK_MOVEMENT` | Any stock quantity change (in or out) |

### Integration Points

- **Kitchen Operations:** Item preparation triggers consumption movements.
- **Catalog & Pricing:** Zero-stock items can auto-disable in the menu.
- **Fiscal & Compliance:** Waste records are part of operational audit.

---

## 8. Reservations

### Entities

| Entity | Description |
|---|---|
| **Reservation** | A future booking with date/time, party size, contact info, and status. |
| **Waitlist** | An ordered queue for walk-ins when no tables are available. |

### State Machine

```
confirmed ──► seated ──► completed
     │
     ├──► cancelled
     │
     └──► no_show
```

| From | To | Trigger | Guard |
|---|---|---|---|
| confirmed | seated | Guest arrives and is assigned a table | Reservation time window |
| seated | completed | Guest departs / order paid | - |
| confirmed | cancelled | Guest or staff cancels | Not yet seated |
| confirmed | no_show | Reservation time passes without arrival | Time must be in the past |

### Constraints

| Constraint | Value |
|---|---|
| Minimum party size | 1 |
| Maximum party size | 50 |
| Reservation time | Must be in the future at creation |
| Slot availability | Must be checked before creation |

### Invariants

| ID | Rule | Enforced by |
|---|---|---|
| RES-01 | Reservation date/time must be in the future at creation. | `canCreateReservation()` |
| RES-02 | Party size must be between 1 and 50 (inclusive) and a whole number. | `canCreateReservation()` |
| RES-03 | Requested time slot must be available. | `canCreateReservation()` |
| RES-04 | Cannot cancel a reservation after guest is seated. | `canCancelReservation()` |
| RES-05 | Cannot cancel an already-cancelled or no-show reservation. | `canCancelReservation()` |
| RES-06 | No-show can only be marked for confirmed reservations after the time has passed. | `canMarkNoShow()` |
| RES-07 | Overbooking is prevented by slot availability check (soft constraint, can be overridden by manager). | Application-level |

### Events Emitted

| Event | When |
|---|---|
| `RESERVATION_CREATED` | New reservation saved |

### Integration Points

- **Floor & Service:** Reservation confirmation marks a table as RESERVED.
- **CRM & Loyalty:** Customer contact linked to reservation for history.

---

## 9. CRM & Loyalty

### Entities

| Entity | Description |
|---|---|
| **Customer** | A person with contact details, visit history, and preferences. |
| **Segment** | A rule-based grouping of customers (VIP, Regular, New, At-Risk). |
| **LoyaltyAccount** | A points balance and transaction history for a customer. |
| **Consent** | A record of what data processing the customer has agreed to. |

### Customer Segments

| Segment | Criteria |
|---|---|
| **New** | First visit or first 30 days |
| **Regular** | 3+ visits in last 60 days |
| **VIP** | 10+ visits or top 10% spend |
| **At-Risk** | No visit in 45+ days (was Regular/VIP) |
| **Lapsed** | No visit in 90+ days |

### Loyalty Points Rules

| Rule | Description |
|---|---|
| **Earning** | Points earned per currency unit spent (configurable rate, e.g., 1 point per EUR). |
| **Redemption** | Points redeemed at a fixed conversion rate (e.g., 100 points = 1 EUR). |
| **Expiry** | Points expire after configurable period (default: 12 months of inactivity). |
| **Minimum redemption** | Minimum points balance required to redeem (configurable). |
| **No negative balance** | Redemption cannot exceed available points. |

### Consent & GDPR

| Rule | Description |
|---|---|
| Explicit opt-in required for marketing communications. | |
| Customer can request data export (right of access). | |
| Customer can request data deletion (right to erasure). | |
| Consent records are immutable and timestamped. | |
| Data retention: transactional data kept per fiscal requirements; personal data deleted on request. | |

### Invariants

| ID | Rule |
|---|---|
| CRM-01 | Points balance cannot go negative. |
| CRM-02 | Redemption amount cannot exceed available points. |
| CRM-03 | Marketing consent must be explicit opt-in (not pre-checked). |
| CRM-04 | GDPR deletion request must be honored within 30 days. |
| CRM-05 | Customer segment assignment is system-calculated, not manually set. |

### Integration Points

- **Payments:** Loyalty points earned on payment completion, redeemed during payment.
- **Reservations:** Customer linked to reservation for history.
- **Order Management:** Customer name/reference on orders.

---

## 10. Fiscal & Compliance

### Entities

| Entity | Description |
|---|---|
| **Receipt** | A fiscal document issued to the customer upon payment. |
| **Invoice** | A formal tax document for B2B transactions. |
| **FiscalDocument** | The umbrella entity covering receipts, invoices, and credit notes. |
| **AuditEntry** | An immutable log entry recording a system action. |

### Portugal (PT) - SAF-T & AT Requirements

| Requirement | Description |
|---|---|
| **SAF-T** | Standard Audit File for Tax. Monthly XML export of all transactions. |
| **ATCUD** | Unique document code required on every fiscal document (format: `ATCUD:XXXXX-NNNN`). |
| **Sequential numbering** | Document numbers must be sequential with no gaps within a series. |
| **Certified software** | POS software must be certified by AT (Autoridade Tributaria). |
| **Digital signature** | Each document must carry a hash chain signature for tamper detection. |

### Receipt Requirements

| Field | Required |
|---|---|
| Restaurant NIF (tax ID) | Yes |
| Customer NIF (if requested) | Yes |
| Date and time | Yes |
| Sequential document number | Yes |
| ATCUD code | Yes (PT) |
| Itemized list with quantities and prices | Yes |
| VAT breakdown by rate | Yes |
| Total (gross and net) | Yes |
| Payment method | Yes |
| Digital signature hash | Yes (PT) |

### Audit Trail Rules

| Rule | Description |
|---|---|
| **Immutability** | Audit entries are append-only. No updates or deletes. |
| **Completeness** | Every state change in orders, payments, and voids must be logged. |
| **Actor tracking** | Every entry records who performed the action. |
| **Timestamp** | Every entry records when the action occurred (server time). |
| **Retention** | Minimum 10 years for fiscal records (PT law). |

### Invariants

| ID | Rule |
|---|---|
| FSC-01 | Fiscal documents are immutable after issuance. |
| FSC-02 | Document numbers must be sequential with no gaps. |
| FSC-03 | Every fiscal document must include VAT breakdown. |
| FSC-04 | ATCUD is mandatory for all documents in PT jurisdiction. |
| FSC-05 | Audit trail entries cannot be modified or deleted. |
| FSC-06 | Voided orders must produce a corresponding credit note or cancellation document. |
| FSC-07 | Hash chain: each document's signature depends on the previous document's hash. |

### Events Emitted

Fiscal document creation is triggered by payment events (ORDER_PAID, PAYMENT_REFUNDED) and logged in the audit trail.

### Integration Points

- **Payments:** Payment completion triggers receipt generation.
- **Order Management:** Order data (items, totals, discounts) feeds into the receipt.
- **Catalog & Pricing:** VAT rates per product category used in tax breakdown.

---

## 11. Ubiquitous Language Glossary

The following terms have precise meanings within ChefiApp. All code, documentation, and communication must use these terms consistently.

### Order Management

| Term | Definition |
|---|---|
| **Order** | A collection of items requested by or for a customer, tracked through a lifecycle from creation to payment. |
| **Item** | A single product line in an order, with quantity, unit price, and optional modifiers. |
| **Modifier** | An add-on or variant applied to an item that may alter its price (e.g., "extra cheese +1.50"). |
| **Course** | A serving stage within a meal (starter, main, dessert). Items may be tagged with a course for staggered kitchen firing. |
| **Origin** | The channel through which an order enters the system: `TPV` (central POS), `STAFF` (waiter app), `WEB_PUBLIC` (website), `QR_MESA` (table QR), `DELIVERY`. |
| **Ticket** | The kitchen's representation of order items to prepare, grouped by station. |

### Payments

| Term | Definition |
|---|---|
| **Payment** | A monetary transaction that settles part or all of an order's total. |
| **Split** | Dividing an order's total among multiple payers, by equal parts, by item, or by custom amounts. |
| **Tip** | A voluntary gratuity added by the customer, capped at 100% of subtotal. |
| **Refund** | A reversal of a completed payment, returning funds to the customer. Can be partial or full. |
| **Reconciliation** | The process of matching internal payment records with external provider records to ensure consistency. |

### Floor & Service

| Term | Definition |
|---|---|
| **Table** | A physical seating position identified by a number, assigned to a zone. |
| **Zone** | A named area of the restaurant (e.g., Terrace, Main Hall, Bar Area). |
| **Floor Plan** | The spatial layout of all zones and tables for a restaurant location. |
| **Merge** | Combining two or more tables into a single logical unit for a large party. |
| **Cover** | A single guest seat. Used for per-capita revenue calculations and capacity tracking. |

### Staff & Shifts

| Term | Definition |
|---|---|
| **Shift** | A scheduled work period for a staff member, with start/end times, role, and station. |
| **Break** | A pause during a shift. Must be explicitly started and ended. |
| **Clock In** | The act of starting an active attendance record. Prevented if already clocked in. |
| **Timesheet** | The aggregated record of an operator's worked hours over a period. |
| **Overtime** | Hours worked beyond the scheduled shift duration. Calculated as actual minus scheduled. |

### Catalog & Pricing

| Term | Definition |
|---|---|
| **Product** | A sellable item in the restaurant's menu, with a name, price, category, and availability status. |
| **Category** | A logical grouping for products (Starters, Mains, Drinks, Desserts). |
| **Combo** | A pre-defined bundle of products offered at a combined price, typically lower than individual sum. |
| **Bundle** | Synonym for Combo in some contexts. A set of products sold together. |
| **Modifier Group** | A named collection of modifiers that can be applied to a product (e.g., "Size": Small, Medium, Large). |

### Inventory

| Term | Definition |
|---|---|
| **Stock** | The quantity of an inventory item available at a location. |
| **Movement** | A recorded change in stock quantity, with type (receipt, consumption, waste, transfer, adjustment). |
| **Waste** | Stock removed from inventory due to spoilage, breakage, or expiry. Always a positive quantity out. |
| **Transfer** | Moving stock from one location to another within the same restaurant. |
| **Reorder Point** | The stock level at which a low-stock alert is triggered. Advisory, not blocking. |

### Reservations

| Term | Definition |
|---|---|
| **Reservation** | A future booking for a specific date, time, and party size. |
| **Waitlist** | An ordered queue for walk-in guests when no tables are immediately available. |
| **No-Show** | A confirmed reservation where the guest did not arrive. Can only be marked after the reservation time. |
| **Walk-In** | A guest arriving without a reservation. |
| **Party Size** | The number of guests in a reservation or walk-in group. Must be between 1 and 50. |

### Fiscal & Compliance

| Term | Definition |
|---|---|
| **Receipt** | A fiscal document issued to the customer as proof of purchase and tax record. |
| **Invoice** | A formal tax document, typically for B2B transactions, with full buyer details. |
| **SAF-T** | Standard Audit File for Tax. An XML format mandated by Portuguese tax authority for transaction reporting. |
| **ATCUD** | Unique document identification code required by Portuguese tax authority on every fiscal document. |
| **Fiscal Document** | Any legally required transactional document (receipt, invoice, credit note). |

### CRM & Loyalty

| Term | Definition |
|---|---|
| **Customer** | A person associated with visits, orders, or reservations. May have contact info and loyalty account. |
| **Segment** | A system-calculated grouping of customers based on behavior (New, Regular, VIP, At-Risk, Lapsed). |
| **Loyalty Point** | A unit of value earned through purchases and redeemable for discounts. |
| **Consent** | An explicit, timestamped record of a customer's agreement to specific data processing. |
| **GDPR Request** | A formal request by a customer to access, export, or delete their personal data. |
