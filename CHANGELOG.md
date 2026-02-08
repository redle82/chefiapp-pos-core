# Changelog - Operational Nervous System

All notable changes to this project will be documented in this file.

---

## [1.2.0] - 2026-01-24

### 🔧 Final Polish

#### Fixes
- **Pressure Banner:** Added 1s debounce to prevent flickering during transitions
- **Urgency Colors:** KDSTicket now has self-updating timer with dynamic interval
- **Animations:** Pressure banner with smooth fade in/out (300ms)

#### Improvements
- `useKitchenPressure`: Smart debounce (immediate for increase, 1s for decrease)
- `KDSTicket`: AppState awareness for recalculation when returning from background
- Dynamic intervals based on urgency (5s/15s/30s)

### 📁 Modified Files
- `mobile-app/hooks/useKitchenPressure.ts`
- `mobile-app/components/KitchenPressureIndicator.tsx`
- `mobile-app/components/KDSTicket.tsx`

---

## [1.1.0] - 2026-01-24

### 🔧 Stability Fixes

#### Fixes
- **Background Timer:** Timer now recalculates immediately when returning from background
- **Waitlist Persistence:** Robust auto-save with debounce and save on background

#### Improvements
- `OrderTimer`: AppState awareness for immediate recalculation
- `OrderTimer`: Dynamic interval (5s/15s/30s) based on urgency
- `WaitlistBoard`: Immediate save on critical actions (add, seat)
- `WaitlistBoard`: Save with 500ms debounce on minor actions (cancel)
- `WaitlistBoard`: Automatic save when going to background
- `WaitlistBoard`: Save on component unmount

### 📁 Modified Files
- `mobile-app/components/OrderTimer.tsx`
- `mobile-app/components/WaitlistBoard.tsx`

---

## [1.0.1] - 2026-01-24

### 🚀 Observability & Growth

#### Observability (Sentry + Metrics)
- **Sentry Integration:** Error tracking in merchant-portal, customer-portal, mobile-app
- **ErrorBoundary:** Fallback components with automatic error capture
- **Centralized Logger:** Logging service with Sentry integration
- **Metrics Dashboard:** Real-time operational metrics widget
- **useRealtimeMetrics:** Hook for orders/hour, average ticket, revenue

#### Growth & Marketing (SEO + Pixel)
- **Dynamic SEO:** Meta tags (title, description, Open Graph, Twitter Cards)
- **Schema.org:** JSON-LD for Restaurant, Menu, BreadcrumbList
- **Pixel Tracking:** Meta Pixel + Google Analytics integrated
- **Tracked Events:** pageView, viewItem, addToCart, initiateCheckout, purchase

### 📁 Created Files
- `merchant-portal/src/hooks/useRealtimeMetrics.ts`
- `merchant-portal/src/components/Dashboard/OperationalMetricsWidget.tsx`
- `customer-portal/src/lib/logger.ts`
- `customer-portal/src/lib/seo.tsx`
- `customer-portal/src/lib/schema.ts`
- `customer-portal/src/lib/pixel.ts`
- `customer-portal/src/components/ErrorBoundary.tsx`
- `customer-portal/src/components/RestaurantSEO.tsx`
- `docs/ops/OBSERVABILITY_SETUP.md`
- `docs/ops/GROWTH_MARKETING_SETUP.md`

### 📁 Modified Files
- `merchant-portal/src/core/logger/Logger.ts`
- `merchant-portal/src/ui/design-system/ErrorBoundary.tsx`
- `merchant-portal/vite.config.ts`
- `customer-portal/src/main.tsx`
- `customer-portal/src/App.tsx`
- `customer-portal/src/context/CartContext.tsx`
- `customer-portal/vite.config.ts`
- `customer-portal/index.html`

---

## [1.0.0] - 2026-01-24

### 🎉 Launch: Operational Nervous System

Complete transformation of ChefIApp from sales recorder to Operational Nervous System.

---

## [1.0.0] - Week 1: Fast Pay

### ✨ Added
- **FastPayButton**: Quick payment component in 2 taps
- Auto-selection of payment method (cash as default)
- Single confirmation without intermediate modals
- Automatic table closure after payment
- Integration in table map and orders screen

### 🎯 Goal
Payment in < 5 seconds (36x faster than before)

### 📁 Files
- `mobile-app/components/FastPayButton.tsx` (new)
- `mobile-app/app/(tabs)/tables.tsx` (modified)
- `mobile-app/app/(tabs)/orders.tsx` (modified)

---

## [1.0.0] - Week 2: Live Map

### ✨ Added
- **Timer per table**: Updated every second
- **Urgency colors**:
  - 🟢 Green: < 15 minutes
  - 🟡 Yellow: 15-30 minutes
  - 🔴 Red: > 30 minutes
- **"Wants to pay" icon** (💰): Appears when order delivered
- **"Waiting for drink" icon** (🍷): Appears for drink orders
- Timer based on last event (not just creation)

### 🎯 Goal
Map stops being visual and becomes operational sensor

### 📁 Files
- `mobile-app/app/(tabs)/tables.tsx` (modified)

---

## [1.0.0] - Week 3: KDS as King

### ✨ Added
- **useKitchenPressure**: Hook to detect kitchen saturation
- **KitchenPressureIndicator**: Visual pressure component
- **Smart menu**: Hides slow dishes when kitchen saturated
- **Automatic prioritization**: Drinks and fast items during peaks
- Pressure banner in menu (yellow/red)

### 🎯 Goal
Kitchen influences dining room decisions in real-time

### 📁 Files
- `mobile-app/hooks/useKitchenPressure.ts` (new)
- `mobile-app/components/KitchenPressureIndicator.tsx` (new)
- `mobile-app/app/(tabs)/index.tsx` (modified)

---

## [1.0.0] - Week 4: Reservations LITE

### ✨ Added
- **WaitlistBoard**: Digital waitlist component
- Add entry by name + time
- Automatic conversion: reservation → table
- Local persistence (AsyncStorage)
- Sorting by time

### 🎯 Goal
Simple waitlist without overengineering

### 📁 Files
- `mobile-app/components/WaitlistBoard.tsx` (new)
- `mobile-app/services/persistence.ts` (modified)
- `mobile-app/app/(tabs)/tables.tsx` (modified)

---

## [1.0.0] - Optimizations

### ⚡ Performance
- Optimized timer: only updates when table occupied
- `useMemo` in menu filter (avoids re-renders)
- `KitchenPressureIndicator` component isolated

### 💾 Persistence
- Waitlist saved automatically
- Loads when opening component
- Survives restarts

---

## [1.0.0] - Documentation

### 📚 Created
- `docs/EXECUCAO_30_DIAS.md` - Complete technical documentation
- `docs/VALIDACAO_RAPIDA.md` - Validation checklist (17 tests)
- `docs/GUIA_RAPIDO_GARCOM.md` - Waiter guide (10 minutes)
- `docs/MANIFESTO_COMERCIAL.md` - Value proposition
- `docs/PLANO_ROLLOUT.md` - Launch strategy
- `docs/RESUMO_EXECUTIVO.md` - Executive overview
- `docs/GITHUB_ISSUES.md` - Structured issues
- `docs/README.md` - General index
- `CHANGELOG.md` - This file

---

## [1.0.0] - Expected Metrics

### Operational
- ⏱️ Payment time: 2-3min → < 5s (**36x faster**)
- 🗺️ Visibility: 0% → 100% (real-time state)
- 🍽️ Kitchen efficiency: +25% during peaks
- 📋 Reservation conversion: +15%

### Financial
- 💰 More tables/night: +2-3 tables
- 🍷 More drink sales: +25% during peaks
- ⚡ Fewer errors: -30%
- 📈 Additional revenue: €500-1000/month per restaurant

---

## 🔮 Future Versions

### [1.1.0] - Planned
- Auto-detection of payment method (history)
- Waitlist persistence in Supabase
- Operational metrics dashboard

### [1.2.0] - Planned
- Machine Learning to predict saturation
- Automatic dish suggestions
- Shift optimization

### [2.0.0] - Future
- Delivery integration (without complexity)
- Predictive analytics
- Complete automation

---

## 📝 Format

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

**Current Version:** 1.0.0  
**Launch Date:** 2026-01-24  
**Status:** ✅ Ready for Validation
