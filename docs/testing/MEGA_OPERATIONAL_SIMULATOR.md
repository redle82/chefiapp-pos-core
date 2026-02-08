# MEGA OPERATIONAL SIMULATOR v2

> 24-hour operation simulation in minutes using Time Warp.
> **PHASE 2A: SLA + Escalation + Hard-Blocking**

---

## Overview

The MEGA OPERATIONAL SIMULATOR allows validating ChefIApp behavior under realistic operational conditions, including:

- **Lunch and dinner peaks**
- **Calm periods**
- **Opening and closing**
- **Shift changes**
- **Operational tasks and compliance**
- **Multiple restaurant profiles**
- **SLA per task with deadline**
- **Automatic escalation (role → manager → owner)**
- **Hard-blocking (shift doesn't close without checklist)**
- **Complete failure audit**

All of this **without UI**, **100% headless**, **reproducible** and **in minutes**.

---

## Available Commands

```bash
# Small simulation (10 restaurants, 5 min real = 24h simulated)
make simulate-24h-small

# Enterprise simulation (100 restaurants, 10 min)
make simulate-24h-enterprise

# Maximum simulation (stress test, 15 min)
make simulate-24h-max

# Validate assertions
make assertions

# View last report
make report-24h
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEGA OPERATIONAL SIMULATOR                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │   TIME WARP      │  ← 24h simulated in 5-15 min              │
│  │   ENGINE         │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              RESTAURANT PROFILES                        │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │     │
│  │  │Ambulante │  │ Pequeno  │  │  Médio   │  ...        │     │
│  │  │ 1-2 pax  │  │ 2-5 pax  │  │ 10-30pax │             │     │
│  │  └──────────┘  └──────────┘  └──────────┘             │     │
│  └────────────────────────────────────────────────────────┘     │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              POLICY PACKS (Compliance)                  │     │
│  │  • OPENING_STANDARD   • CLOSING_STANDARD               │     │
│  │  • CLEANING_STANDARD  • FOOD_SAFETY                    │     │
│  └────────────────────────────────────────────────────────┘     │
│           │                                                      │
│           ▼                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Print         │  │ KDS Kitchen   │  │ KDS Bar       │       │
│  │ Emulator      │  │ Consumer      │  │ Consumer      │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│           │                  │                  │               │
│           └──────────────────┴──────────────────┘               │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │   SUPABASE      │                          │
│                    │   LOCAL         │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Restaurant Profiles

### Ambulante (Food Truck)
- **Staff:** 1-2 people
- **Tables:** 0
- **Menu:** 10 items
- **Peaks:** Lunch 80%, Dinner 90%
- **Policy Packs:** OPENING_BASIC, CLOSING_BASIC

### Pequeno (Family)
- **Staff:** 2-5 people
- **Tables:** 10
- **Menu:** 30 items
- **Stations:** Kitchen, Bar, Cleaning
- **Policy Packs:** OPENING_STANDARD, CLOSING_STANDARD, CLEANING_STANDARD

### Médio (Structured)
- **Staff:** 10-30 people
- **Tables:** 30
- **Menu:** 60 items
- **Stations:** Kitchen, Bar, Cleaning, Manager
- **Policy Packs:** Complete + MISE_EN_PLACE + SHIFT_HANDOVER

---

## Policy Packs

### OPENING_STANDARD
Opening tasks:
- Check chamber temperature (hard blocking)
- Check critical inventory
- Mise en place
- Check cash register (hard blocking)
- Clean dining room
- Check equipment (hard blocking)

### CLOSING_STANDARD
Closing tasks:
- Close cash register (hard blocking)
- Final temperature (hard blocking)
- Clean kitchen
- Clean bar
- Clean dining room
- Turn off equipment
- Check security (hard blocking)

### CLEANING_STANDARD
Continuous tasks:
- Clean table (trigger: table.closed)
- Clean bathrooms (cron: 2h)
- Check trash bins (cron: 2h)
- Clean spill (trigger: incident.spill)

---

## Time Warp

The system uses a time multiplier to simulate 24h in minutes:

| Mode | Real Duration | Simulated Hours | Multiplier |
|------|---------------|-----------------|------------|
| small | 5 min | 24h | 288x |
| enterprise | 10 min | 24h | 144x |
| max | 15 min | 24h | 96x |

---

## Collected Metrics

- Orders per hour (virtual)
- Orders by source (mobile, pos, qr_web)
- Print jobs generated
- Events triggered
- Tasks created/completed/escalated
- KDS events (preparation time)
- Kitchen backlog

---

## Asserts (Success Criteria)

| Assert | Condition |
|--------|-----------|
| Orphan Items | = 0 |
| Orphan Print Jobs | = 0 |
| Lost Events | = 0 |
| Duplicate Orders | = 0 |

---

## Reports

After each simulation, a report is generated in:
- `reports/simulation-{id}.md` (Markdown)
- `reports/simulation-{id}.json` (Complete JSON)

The report includes:
- Simulation configuration
- General metrics
- Hourly distribution
- Assert status
- Peak heatmap

---

## File Structure

```
docker-tests/
├── simulators/
│   ├── simulate-24h.js       # Main engine
│   ├── offline-controller.js # Offline controller
│   ├── kds-kitchen.js        # Kitchen consumer
│   ├── kds-bar.js            # Bar consumer
│   └── ...
├── task-engine/
│   └── policies/
│       ├── opening.json
│       ├── closing.json
│       └── cleaning.json
├── seeds/
│   └── profiles/
│       ├── ambulante.json
│       ├── pequeno.json
│       └── medio.json
├── reports/
│   └── simulation-*.md
└── Makefile
```

---

## Governance System (PHASE 2A)

### SLA per Task

Each task has a deadline calculated automatically:

```
sla_deadline = created_at + sla_minutes
```

Tasks that exceed SLA are automatically escalated.

### Automatic Escalation

| Level | Role | Escalates To |
|-------|------|--------------|
| 0 | kitchen, bar, cleaning | manager |
| 1 | manager | owner |
| 2 | owner | (doesn't escalate) |

Escalation occurs **10 minutes** after SLA is exceeded.

### Hard-Blocking

Tasks marked as `hard_blocking = true`:
- Prevent shift closure
- Require completion or manual override
- Are audited in `gm_shift_blocks`

**Behavior on closure:**
1. System detects pending mandatory tasks
2. Tries to complete "under pressure" (70% chance)
3. If still pending, applies **override**
4. Uncompleted tasks are marked as **FAILED**

### Audit Tables

```sql
-- Escalation log
gm_task_escalations (
  task_id, from_level, to_level,
  from_role, to_role, reason,
  sla_exceeded_by_minutes
)

-- Shift blocks
gm_shift_blocks (
  shift_id, task_id, block_reason,
  was_overridden, override_reason
)
```

---

## Governance Metrics

The report now includes:

| Metric | Description |
|--------|-------------|
| Escalations → Manager | Tasks escalated to manager |
| Escalations → Owner | Tasks escalated to owner |
| Shift Blocks | Attempts to close with pending tasks |
| Overrides | Forced closures |
| Tasks Failed | Uncompleted tasks |

---

## Next Evolutions

- [x] ~~PHASE 2A: SLA + Escalation + Hard-Blocking~~
- [ ] PHASE 2B: Aggressive offline during peaks
- [ ] PHASE 2C: Large profiles (50-300 pax)
- [ ] Enterprise: gm_enterprises + aggregated dashboards
- [ ] Chaos network (latency, packet loss)

---

*Documentation generated for MEGA OPERATIONAL SIMULATOR v2.0*
*PHASE 2A: SLA + Escalation + Hard-Blocking*
