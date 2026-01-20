# 🔧 FIX PLAN (Post-First Sale)

**Priority:** P2 (Execute within 7 days of First Sale)

## 1. UI/UX Harmonization (Phase M)
- [ ] **Public Page CSS**: Apply "ChefIApp Premium" design tokens.
- [ ] **Loading States**: Replace browser alerts/toasts with custom UI notifications.
- [ ] **Feedback**: Add "Confetti" or clear success modal after payment.

## 2. Operational Efficiency (Phase N)
- [ ] **AppStaff Websockets**: Implement robust subscription to avoid manual polling/refresh.
- [ ] **Refund Interface**: Add "Refund" button to TPV Order Detail (Manager Only).
- [ ] **Receipt Printing**: Integrate with thermal printer API (WebUSB or proxy).

## 3. Resilience (Phase O)
- [ ] **Retry Logic**: Harden the Stripe Webhook handler against "Storm" events.
- [ ] **Logging**: Move logs from console to structured logging service (e.g. Sentry/Datadog) when budget allows.

**Immediate Action:** None. Focus on Sales.
