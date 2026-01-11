# Forensic Static Audit: Risk Assessment
**Date:** 2025-12-27
**Type:** Static Analysis (grep/rg)

## 🚨 S0: Critical Security Risks
| Risk | Location | Evidence | Recommended Fix |
| :--- | :--- | :--- | :--- |
| **Hardcoded Stripe Key** | `StripePaymentModal.tsx` | `loadStripe(... || 'pk_test_...')` | Remove fallback string entirely. |

## 🚫 S1: Blocking UX (Alerts)
| Risk | Location | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- |
| **Blocking Alert** | `ReceivingDashboard.tsx` | "Realidade Commitada!" blocks thread. | Replace with Toast/Banner. |
| **Blocking Alert** | `CartDrawer.tsx` | "Pedido enviado!" blocks thread. | Replace with Drawer auto-close + Toast. |
| **Blocking Alert** | `TPVReadyPage.tsx` | "Upgrade flow em breve!" user trap. | Replace with Tooltip/Disabled state. |
| **Blocking Alert** | `StaffPage.tsx` | "Erro ao criar convite." blocks thread. | Replace with Inline Error. |

## ⚠️ S1: Resilience Gaps (No Timeouts)
| Risk | Location | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- |
| **Unsafe Fetch** | `PublicPages.tsx` | Public menu load hangs indefinitely if API down. | Add `AbortController` (10s). |
| **Unsafe Fetch** | `useOfflineReconciler.ts` | Sync loop hangs if network half-open. | Add `AbortController` (30s) to background sync. |
| **Unsafe Fetch** | `PublishPage.tsx` | Publishing hangs UI. | Add `AbortController`. |

## ⚠️ S2: Render Risks
| Risk | Location | Note |
| :--- | :--- | :--- |
| **AnimatePresence "wait"** | `main.tsx` | Wraps Routes. If transition crashes, App is blank. | Monitor. Ensure children unmount safe. |
