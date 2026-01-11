# Pilot Feedback Log
**Cohort:** 1 (The First 5)
**Status:** Collecting

## Template

### [Date] - [Restaurant Name] - [Context]
*   **Observer:** (Who watched?)
*   **Friction Point:** (Where did they get stuck?)
*   **Quote:** (What did they say exactly?)
*   **Severity:** 🔴 Blocker / 🟡 Annoyance / 🟢 Suggestion
*   **Action:** (Ticket ID or "Won't Fix")

---

## Logs

### 2025-12-28 - Sofia Gastrobar (Self-Test) - Manual Onboarding
*   **Observer:** Goldmonkey
*   **Friction Point:** The "Config" panel in `App.tsx` was confusing initially, but now hidden behind a toggle.
*   **Quote:** "Why do I see localhost here?"
*   **Severity:** 🟡 Annoyance
*   **Action:** Fixed in `step-4923`.

### 2025-12-28 - Sofia Gastrobar (Self-Test) - UI Visiblity
*   **Observer:** Goldmonkey
*   **Friction Point:** The home page text (labels) was white-on-white, making it completely illegible.
*   **Quote:** "nao se ver nadaesta inlegivel"
*   **Severity:** 🔴 Blocker
*   **Action:** Fixed in `step-5358` (Forced Dark Theme overrides).

### 2025-12-28 - Sofia Gastrobar (Self-Test) - Identity Setup
*   **Observer:** Goldmonkey
*   **Friction Point:** The "Restaurant ID" field is empty by default but required by the backend, causing a `RESTAURANT_ID_REQUIRED` error or 500 when saving.
*   **Quote:** (System Error) "Internal Server Error / RESTAURANT_ID_REQUIRED"
*   **Severity:** 🔴 Blocker
*   **Action:** Manually filled "sofia-gastrobar" into the hidden/advanced Config field to bypass. The Wizard should likely auto-generate this.

### 2025-12-28 - Sofia Gastrobar (Self-Test) - Menu Creation
*   **Observer:** Goldmonkey
*   **Result:** ✅ Success. "Hambúrguer da Casa" created (12.90€).
*   **Proof:** Item appears on public page.
*   **Pulse:** `menu_items: 1` (Confirmed via Pulse Adapter).

### 2025-12-28 - Sofia Gastrobar (Self-Test) - Checkout Flow
*   **Observer:** Goldmonkey
*   **Friction Point:** The "WEB BASIC" preview page allows clicking "Adicionar", but the Cart section remains static `(preview)` and does not calculate totals or allow checkout.
*   **Quote:** "Carrinho (preview)"
*   **Severity:** 🟡 Limitation (Expected for Basic Preview?)
*   **Action:** **DECIDED:** View Only / Menu Digital mode active for Pilot Step 1. Checkout is correctly blocked. No fix needed today.


### 2025-12-28 - Sofia Gastrobar (Self-Test) - Phase K Operations Unlock
*   **Observer:** Goldmonkey (Kernel)
*   **Status:** ✅ TPV & KDS Unlocked.
*   **Method:** Admin Token Injection (`x-chefiapp-token`) required to verify "Sovereign Sofia" identity against `AuthBoundary`.
*   **Result:**
    *   TPV: Accessible, Menu loaded.
    *   Flow: Order Created -> Sent to Kitchen.
    *   KDS: Order Received in "Novos Pedidos".
*   **Verdict:** **The Flow (Internal)** is LIVE. "View Only" (External) remains active.

### [YYYY-MM-DD] - [Client Name] - [Activity]
*   **Observer:**
*   **Friction Point:**
*   **Quote:**
*   **Severity:**
*   **Action:**
