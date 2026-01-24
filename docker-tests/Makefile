# ==============================================================================
# ChefIApp Massive Test Environment - Makefile
# ==============================================================================
# Usage:
#   make start        - Start core infrastructure
#   make seed         - Seed 100 restaurants
#   make simulate     - Start all simulators
#   make chaos        - Start chaos engineering
#   make all          - Full test run
#   make stop         - Stop everything
#   make clean        - Remove all containers and volumes
# ==============================================================================

.PHONY: all start stop clean seed simulate chaos observe logs report help

# Default target
help:
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  ChefIApp Massive Test Environment"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@echo "  QUICK START:"
	@echo "    make all         - Full test run (start + seed + simulate)"
	@echo ""
	@echo "  INDIVIDUAL COMMANDS:"
	@echo "    make start       - Start core infrastructure (Postgres, API, Realtime)"
	@echo "    make seed        - Seed 100 restaurants with data"
	@echo "    make seed-10     - Seed 10 restaurants (quick test)"
	@echo "    make simulate    - Start order/KDS/task simulators"
	@echo "    make chaos       - Start chaos engineering"
	@echo "    make observe     - Start metrics dashboard"
	@echo ""
	@echo "  MONITORING:"
	@echo "    make logs        - Follow all logs"
	@echo "    make logs-orders - Follow orders simulator"
	@echo "    make logs-kds    - Follow KDS simulator"
	@echo "    make metrics     - Open metrics dashboard"
	@echo ""
	@echo "  CLEANUP:"
	@echo "    make stop        - Stop all containers"
	@echo "    make clean       - Remove containers and volumes"
	@echo "    make reset       - Clean and restart"
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"

# ==============================================================================
# CORE OPERATIONS
# ==============================================================================

# Start core infrastructure
start:
	@echo "🚀 Starting core infrastructure..."
	docker compose up -d postgres rest realtime kong
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 10
	@echo "✅ Core infrastructure running"
	@echo "   API: http://localhost:54398"
	@echo "   Realtime: ws://localhost:4000"

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	docker compose --profile seed --profile simulate --profile chaos --profile observe down
	@echo "✅ All services stopped"

# Clean everything
clean:
	@echo "🧹 Cleaning up..."
	docker compose --profile seed --profile simulate --profile chaos --profile observe down -v
	@echo "✅ Cleanup complete"

# Reset (clean + start)
reset: clean start

# ==============================================================================
# SEEDING
# ==============================================================================

# Seed 100 restaurants
seed:
	@echo "🌱 Seeding 100 restaurants..."
	docker compose --profile seed run --rm seed
	@echo "✅ Seed complete"

# Seed 10 restaurants (quick test)
seed-10:
	@echo "🌱 Seeding 10 restaurants..."
	RESTAURANT_COUNT=10 docker compose --profile seed run --rm seed
	@echo "✅ Seed complete"

# ==============================================================================
# SIMULATION
# ==============================================================================

# Start all simulators
simulate:
	@echo "🔥 Starting simulators..."
	docker compose --profile simulate up -d simulator-orders simulator-kds simulator-tasks
	@echo "✅ Simulators running"
	@echo "   Use 'make logs' to watch output"

# Stop simulators
simulate-stop:
	docker compose --profile simulate stop simulator-orders simulator-kds simulator-tasks

# ==============================================================================
# CHAOS ENGINEERING
# ==============================================================================

# Start chaos
chaos:
	@echo "💥 Starting chaos engineering..."
	docker compose --profile chaos up -d chaos
	@echo "✅ Chaos monkey active"

# Stop chaos
chaos-stop:
	docker compose --profile chaos stop chaos

# ==============================================================================
# OBSERVABILITY
# ==============================================================================

# Start metrics dashboard
observe:
	@echo "📊 Starting metrics service..."
	docker compose --profile observe up -d metrics
	@echo "✅ Metrics dashboard: http://localhost:9090"

# Open metrics in browser
metrics:
	@open http://localhost:9090 || xdg-open http://localhost:9090

# ==============================================================================
# LOGGING
# ==============================================================================

# Follow all logs
logs:
	docker compose --profile seed --profile simulate --profile chaos --profile observe logs -f

# Follow specific logs
logs-orders:
	docker compose logs -f simulator-orders

logs-kds:
	docker compose logs -f simulator-kds

logs-tasks:
	docker compose logs -f simulator-tasks

logs-chaos:
	docker compose logs -f chaos

logs-metrics:
	docker compose logs -f metrics

# ==============================================================================
# FULL TEST RUN
# ==============================================================================

# Complete test sequence
all: start
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  PHASE 1: Seeding Data"
	@echo "═══════════════════════════════════════════════════════════"
	@$(MAKE) seed
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  PHASE 2: Starting Observability"
	@echo "═══════════════════════════════════════════════════════════"
	@$(MAKE) observe
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  PHASE 3: Starting Simulators"
	@echo "═══════════════════════════════════════════════════════════"
	@$(MAKE) simulate
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  ✅ TEST ENVIRONMENT RUNNING"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@echo "  Metrics Dashboard: http://localhost:9090"
	@echo "  API Endpoint:      http://localhost:54321"
	@echo ""
	@echo "  Commands:"
	@echo "    make logs        - Watch all logs"
	@echo "    make chaos       - Add chaos testing"
	@echo "    make stop        - Stop everything"
	@echo ""

# Full test with chaos
all-chaos: all
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  PHASE 4: Starting Chaos Engineering"
	@echo "═══════════════════════════════════════════════════════════"
	@$(MAKE) chaos
	@echo ""
	@echo "  💥 Chaos monkey is active!"
	@echo "  Watch for service restarts and verify data integrity"
	@echo ""

# ==============================================================================
# CHAOS TEST (COMANDO ÚNICO)
# ==============================================================================

# Teste rápido (60s, 10 restaurantes)
chaos-test:
	@echo "🔥 Running quick chaos test..."
	@./run-chaos.sh --quick

# Teste completo (300s, carga máxima)
chaos-test-full:
	@echo "🔥 Running full chaos test..."
	@./run-chaos.sh --full

# Seed 10 restaurantes via SQL
seed-sql:
	@echo "🌱 Seeding 10 restaurants via SQL..."
	@docker compose exec -T postgres psql -U postgres -d chefiapp_test -f /docker-entrypoint-initdb.d/seed-10.sql

# Verificar estado do banco
db-status:
	@echo "📊 Database Status:"
	@docker compose exec -T postgres psql -U postgres -d chefiapp_test -c "\
		SELECT 'Restaurants' as entity, COUNT(*) as count FROM gm_restaurants \
		UNION ALL SELECT 'Products', COUNT(*) FROM gm_products \
		UNION ALL SELECT 'Tables', COUNT(*) FROM gm_tables \
		UNION ALL SELECT 'Staff', COUNT(*) FROM employees \
		UNION ALL SELECT 'Orders', COUNT(*) FROM gm_orders \
		UNION ALL SELECT 'Tasks', COUNT(*) FROM gm_tasks;"

# Limpar dados de teste (manter schema)
db-clear:
	@echo "🧹 Clearing test data..."
	@docker compose exec -T postgres psql -U postgres -d chefiapp_test -c "\
		TRUNCATE gm_order_items, gm_orders, gm_tasks CASCADE;"
	@echo "✅ Test data cleared"

# Shell do Postgres
db-shell:
	@docker compose exec postgres psql -U postgres -d chefiapp_test
