# PHASE G: TRANSITION TO REALITY
**Status**: **OPEN** ✅ (System Operational)
**Target**: v1.1.0+
**Prerequisites**: v1.0.0 "Truth Freeze" ✅

---

## 🎯 OBJECTIVE
Transition the ChefIApp system from **Honest Demo** mode to **Full Operational Reality**.
This phase bridges the gap between:
- **Mock/Preview** (AppStaff, Dashboard)
- **Real Operational** (TPV already live)

---

## 🚪 ENTRY GATE (Must ALL Pass)

### Technical Prerequisites
| Requirement | Description | Status |
| :--- | :--- | :--- |
| **Backend API** | Core API responding at `/api/health` with `{ status: "ok" }` | ✅ |
| **Database** | PostgreSQL up on port 5432 (or configured port) | ✅ |
| **TPV Sync** | At least 1 order synced successfully (Queue → Applied) | ⬜ |
| **Auth Flow** | Google OAuth or Magic Link functional | ⬜ |
| **Webhook** | Stripe webhook endpoint receiving events | ⬜ |

### Operational Prerequisites
| Requirement | Description | Status |
| :--- | :--- | :--- |
| **Restaurant Profile** | At least 1 restaurant fully configured via Setup Wizard | ⬜ |
| **Menu** | At least 5 menu items active | ⬜ |
| **Internal Test** | 1 complete order cycle (Create → Kitchen → Pay → Close) | ⬜ |
| **Terms** | Terms of Service live (`/terms`) | ✅ |
| **Privacy** | Privacy Policy live (`/privacy`) | ✅ |
| **Data Map** | Internal DATA_CLASSIFICATION.md | ✅ |

---

## 🔄 GRADUAL ACTIVATION PLAN

### Stage 1: Internal (Dev Team Only)
**Duration**: 1-2 weeks
**Criteria**:
- [ ] All Entry Gate items pass.
- [ ] TPV used for 10+ real orders internally.
- [ ] No critical bugs in error logs.
- [ ] Offline → Online sync tested 3+ times.

**Remove**:
- `chefiapp_bypass_health` dev bypass (or make it dev-only).
- "MODO DEMO" banner from TPV.

### Stage 2: Beta (Invited Users)
**Duration**: 2-4 weeks
**Criteria**:
- [ ] 3+ external restaurants onboarded.
- [ ] 50+ orders processed.
- [ ] NPS or feedback collected.
- [ ] Dashboard shows REAL metrics (not static).

**Activate**:
- Real-time KPIs on Dashboard.
- AppStaff persistence (remove "Preview" banner).

### Stage 3: Public (General Availability)
**Duration**: Ongoing
**Criteria**:
- [ ] 100+ orders without critical failure.
- [ ] Support channel active.
- [ ] Monitoring dashboards operational.

**Activate**:
- Public marketing.
- Full feature set.

---

## 🛡️ ROLLBACK PLAN

If any stage fails:
1. **Freeze** new onboarding.
2. **Revert** to "Demo Mode" banners.
3. **Notify** affected users honestly.
4. **Investigate** root cause before retry.

---

## 📋 GATE CHECK SCRIPT

```bash
#!/bin/bash
# Phase G Entry Gate Check

echo "🚪 PHASE G — ENTRY GATE CHECK"
echo "=============================="

# 1. Backend Health
curl -s http://localhost:4320/api/health | grep -q '"status":"ok"' \
  && echo "✅ Backend API: UP" \
  || echo "❌ Backend API: DOWN"

# 2. Database
pg_isready -h localhost -p 5432 -q \
  && echo "✅ Database: UP" \
  || echo "❌ Database: DOWN"

# 3. Terms Page
curl -s http://localhost:5175/terms | grep -q "Termos de Serviço" \
  && echo "✅ Terms Page: OK" \
  || echo "❌ Terms Page: MISSING"

echo "=============================="
echo "Review manual items in PHASE_G_GATE.md"
```

---

## 🧊 TRUTH PRINCIPLE

> "We do not ship features that pretend to work."

Phase G is about **removing** the "Preview" and "Demo" labels — **only** when the underlying systems are proven real.

---

*Goldmonkey Empire*
*Sistema Operacional para Restauração*
