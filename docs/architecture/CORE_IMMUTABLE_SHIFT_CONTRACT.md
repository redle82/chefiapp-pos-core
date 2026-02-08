# CORE_IMMUTABLE_SHIFT_CONTRACT

**Status:** DRAFT
**Authority:** CRITICAL
**Enforcement Level:** HARD (Runtime Block)

## 1. The Operational Reality

In a high-intensity restaurant environment ("The Rush"), the stability of the system is more important than the "freshness" of the code. A background update that changes a database schema or API contract while a waiter has an open order on their screen is catastrophic.

**The Law:** The code version that opens a shift MUST be the code version that closes the shift.

## 2. The Contract Rules

### 2.1. Shift Lock (The Anchor)

- **Trigger:** When `ShiftStatus` transitions to `OPEN`.
- **Action:** The current `RuntimeVersion` (Git SHA or Semantic Version) is recorded in the `Shift` record.
- **Constraint:** The Application (TPV, Waiter App, KDS) **MUST NOT** accept any Over-The-Air (OTA) updates, Service Worker refreshes, or browser reloads that would change the `RuntimeVersion`.

### 2.2. Reload Interception

- **User Action:** User presses "Reload" or "F5".
- **System Response:** If `ShiftStatus` is `OPEN`, the system intercepts the reload request and displays a **Shift Lock Shield**.
- **Message:** "SHIFT IS ACTIVE. RELOAD BLOCKED. Close the shift or request Manager Override."

### 2.3. The Nuclear Exception

- **Scenario:** A critical bug exists that makes the current version unusable. A fix is deployed.
- **Mechanism:** A Manager with `ADMIN` permissions can authorize a **"Nuclear Update"**.
- **Audit:** This action is logged in `supreme_audit_log` with `severity: CRITICAL`.

## 3. Implementation Details

### 3.1. Frontend Information

The `AppShell` or `RuntimeProvider` must subscribe to `ShiftStatus`.

```typescript
// Conceptual Hook
useShiftLock = () => {
  const { status } = useShift();
  useEffect(() => {
    if (status === "OPEN") {
      window.onbeforeunload = (e) => {
        e.preventDefault();
        return "SHIFT ACTIVE: Operational data at risk.";
      };
    }
  }, [status]);
};
```

### 3.2. Service Worker Strategy

The Service Worker `skipWaiting()` MUST be disabled if a Shift is active. The new SW waits in `installed` state until the shift closes.

## 4. Verification

1.  Open Shift.
2.  Press Refresh.
3.  **EXPECT:** Browser warning / Block.
4.  Try to Close Shift.
5.  Press Refresh.
6.  **EXPECT:** Allowed.
