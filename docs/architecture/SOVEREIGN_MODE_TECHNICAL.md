# 🏗️ Technical Architecture: Sovereign Mode
**How ChefIApp achieves Local-First reliability with a Cloud-Native stack**

---

## 1. The Core Philosophy: "Local-First, Cloud-Sync"
Unlike traditional "Cloud-Native" POS systems that require a constant socket connection to permit writes, ChefIApp uses an **Optimistic UI + Persistent Queue** pattern.

### The Stack
- **Database (Cloud)**: Supabase (PostgreSQL) - The source of truth for analytics & management.
- **Database (Local)**: `localStorage` / `IndexedDB` (Browser) - The operational state.
- **Sync Engine**: `OfflineQueueService` - The bridge.

---

## 2. Technical Proof: How it Works

### A. The Write Path (Creating an Order)
When a waiter punches an order (`createOrder`):

1.  **Local Commit (0ms latency)**:
    - The order is immediately written to the local State Store (React Context / LocalStorage).
    - The UI updates instantly. The waiter sees "Order Sent".
2.  **Queue Injection**:
    - The mutation payload is serialized and pushed to `OfflineQueueService`.
    - Status: `PENDING_SYNC`.
3.  **Background Sync**:
    - The Worker thread detects the item in the queue.
    - Attempt: POST to Supabase Edge Function / Rest API.
    - **Success**: Mark `SYNCED`.
    - **Failure (Offline)**: Mark `RETRY_QUEUED`. Wait for exponential backoff or `online` event.

### B. The Read Path (Consistency)
- **Problem**: How to prevent selling the same seat twice?
- **Solution**: "Trust Local, Verify Remote".
    - UI renders primarily from Local State (fast).
    - Background "Heartbeat" fetches delta updates from Supabase (`last_updated_ts > local_last_ts`).
    - **Conflict Resolution**: Last Write Wins (LWW) with Server Authority for critical status changes (Payment).

---

## 3. Critical Gaps & Mitigation (The "Trust Filter")

To achieve true sovereignty, we are actively closing these gaps:

### GAP 0: Performance & Security (The Foundation)
*Current Risk*: `fetchOrders()` retrieves full history.
*Fix*:
- [ ] **Pagination**: Only load active shift orders.
- [ ] **RBAC (Backend)**: Do not rely on client-side permission checks. Implement Row Level Security (RLS) in Supabase.
- [ ] **Data Pruning**: Local retention policy (e.g., keep 24h locally, archive rest).

### GAP 1: Multi-Location
*Current*: Single tenant isolation per deploy.
*Target*: Organization-level tenancy with location-aware headers.

### GAP 2: Delivery Integrations
*Current*: Custom Webhooks.
*Target*: Unified Hub for standard delivery protocols (Uber/iFood) handled server-side to avoid client connection dependency for incoming orders.

---

## 4. Proof Plan: The Sofia Gastrobar Pilot
**Objective**: Validate Sovereign Mode in a hostile network environment.

### Protocol
1.  **Setup**: Deploy latest build to iPad 9th Gen.
2.  **Load Test**: Pre-load menu with 50 items.
3.  **The Cut**: **Disconnect Wi-Fi / Remove SIM.**
4.  **Service Simulation**:
    - Open 10 Tables.
    - Create 20 Orders (mixed items).
    - Send to Kitchen (KDS simulated locally).
    - Close 5 Tabs (Cash).
5.  **The Reconnect**:
    - Re-enable Wi-Fi.
    - **Success Metric**:
        - All 20 orders appear in Supabase Dashboard within 60 seconds.
        - Zero duplicate orders.
        - Zero "Spinner/Error" screens during offline phase.

---

## 5. Security & Compliance Note
While we are "Agnostic", we take compliance seriously.
- **Payments**: We hand off sensitive PCI data handling to certified SDKs (Stripe Elements / Terminal SDK). We do not store PAN data locally.
- **Fiscal**: Fiscal signatures (AT/NFC-e) must happen before sync.
    - *Plan*: Local signing module for markets requiring immediate signature (PT/BR), or Deferred signing for tolerant markets.
