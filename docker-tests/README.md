# ChefIApp Massive Test Environment

Ambiente Docker completo para testes massivos de carga, concorrência e resiliência.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CHEFIAPP TEST ENVIRONMENT                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        CORE INFRASTRUCTURE                              │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐       │ │
│  │   │ Postgres │    │  REST    │    │ Realtime │    │   Kong   │       │ │
│  │   │  :54322  │◄───│  API     │    │  :4000   │    │  :54321  │       │ │
│  │   └──────────┘    └──────────┘    └──────────┘    └──────────┘       │ │
│  │        │                │              │               │              │ │
│  │        └────────────────┴──────────────┴───────────────┘              │ │
│  │                         │                                              │ │
│  └─────────────────────────┼──────────────────────────────────────────────┘ │
│                            │                                                 │
│  ┌─────────────────────────┼──────────────────────────────────────────────┐ │
│  │                    SIMULATORS                                           │ │
│  ├─────────────────────────┼──────────────────────────────────────────────┤ │
│  │                         │                                               │ │
│  │   ┌──────────┐    ┌─────┴────┐    ┌──────────┐                        │ │
│  │   │  Orders  │    │   KDS    │    │  Tasks   │                        │ │
│  │   │ 100/min  │    │  Bump    │    │ 50/min   │                        │ │
│  │   └──────────┘    └──────────┘    └──────────┘                        │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    CHAOS ENGINEERING                                     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │   • Container restarts      • Network delays                            │ │
│  │   • Service pauses          • Data integrity checks                     │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    OBSERVABILITY                                         │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                          │ │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │   │ Metrics Dashboard - http://localhost:9090                        │  │ │
│  │   │                                                                   │  │ │
│  │   │  • Orders/min          • Latency (avg, p95, max)                 │  │ │
│  │   │  • Items pending       • Task completion rate                    │  │ │
│  │   │  • Active restaurants  • Error count                             │  │ │
│  │   └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
cd docker-tests

# Start everything (infrastructure + seed + simulators)
make all

# Or step by step:
make start      # Start infrastructure
make seed       # Seed 100 restaurants
make observe    # Start metrics dashboard
make simulate   # Start load generators
```

## Commands

| Command | Description |
|---------|-------------|
| `make start` | Start core infrastructure |
| `make stop` | Stop all containers |
| `make clean` | Remove containers and volumes |
| `make seed` | Seed 100 restaurants |
| `make seed-10` | Seed 10 restaurants (quick) |
| `make simulate` | Start all simulators |
| `make chaos` | Start chaos engineering |
| `make observe` | Start metrics dashboard |
| `make logs` | Watch all logs |
| `make all` | Full test run |
| `make all-chaos` | Full test with chaos |

## Services

### Core Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| Postgres | 54322 | Database |
| Kong | 54321 | API Gateway |
| REST | 3000 | PostgREST API |
| Realtime | 4000 | WebSocket Realtime |
| Auth | 9999 | GoTrue Auth |

### Simulators

| Simulator | Rate | Description |
|-----------|------|-------------|
| Orders | 100/min | Creates orders with items |
| KDS | 3s delay | Bumps items to ready |
| Tasks | 50/min | Creates and completes tasks |

### Chaos

| Action | Probability | Description |
|--------|-------------|-------------|
| Restart | 30% | Restarts random container |
| Pause | 20% | Pauses container briefly |
| Check | 100% | Verifies data integrity |

## Data Model

```
100 Restaurants
├── 9 Staff each (900 total)
│   ├── 1 Owner
│   ├── 1 Manager
│   ├── 3 Waiters
│   ├── 2 Kitchen
│   └── 2 Cleaning
├── 10 Tables each (1,000 total)
└── 20 Products each (2,000 total)
```

## Metrics

Access real-time metrics at http://localhost:9090

```json
{
  "restaurants": 100,
  "orders": {
    "total": 5000,
    "open": 150,
    "perMinute": 95
  },
  "latency": {
    "avg": 12,
    "p95": 45,
    "max": 120
  }
}
```

## Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Restaurants | 100 | |
| Orders/min | 100+ | |
| Latency avg | < 50ms | |
| Latency P95 | < 200ms | |
| Data integrity | 100% | |

## Troubleshooting

### Containers won't start
```bash
docker compose logs postgres
# Check for port conflicts
lsof -i :54322
```

### Seed fails
```bash
# Check database is ready
docker compose exec postgres pg_isready
```

### Simulators not generating load
```bash
# Check restaurant count
docker compose exec postgres psql -U postgres -d chefiapp_test -c "SELECT COUNT(*) FROM gm_restaurants"
```

## Architecture Decisions

1. **Single Database**: All tenants share one database with `restaurant_id` for isolation
2. **Service Role Key**: Simulators use service_role to bypass RLS
3. **Isolated Network**: All containers on dedicated bridge network
4. **Stateless Simulators**: Can scale horizontally
5. **In-Database Metrics**: `test_metrics` table for persistence
