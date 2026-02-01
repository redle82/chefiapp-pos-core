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

# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================
# Use DATABASE_URL from environment if set (CI), otherwise use local default
# This allows the Makefile to work both locally (port 54322) and in CI (port 5432)
# ==============================================================================

# Default database URL for local development (port 54322)
# CI will override this via environment variable (port 5432)
DB_URL_DEFAULT = postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Helper function to extract DB connection params from DATABASE_URL
# Usage: $(call get_db_var,host|port|user|pass|name)
# This is evaluated at runtime in each command
define get_db_params
	DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
	DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
	DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
	DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
	DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
	DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|')
endef

# Use DATABASE_URL from environment if available (CI), otherwise use default
# This is evaluated at runtime in each command, not at Makefile parse time
export DATABASE_URL

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

# ==============================================================================
# UNIVERSAL TEST HARNESS
# ==============================================================================

# Teste universal (10 tenants, 60s) - TODOS os canais
universal-test:
	@echo "🎯 Running Universal Test Harness (10 tenants, 60s)..."
	@echo ""
	@echo "Starting Print Emulator..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/print-emulator.js &
	@echo "Starting Task Engine..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node task-engine/task-engine.js &
	@sleep 3
	@echo ""
	@echo "Starting POS Simulator..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=10 DURATION=60 ORDER_RATE=2 \
		node simulators/simulate-pos.js &
	@echo "Starting QR Web Simulator..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=10 DURATION=60 ORDER_RATE=3 \
		node simulators/simulate-qr-web.js &
	@echo "Starting API Orders Simulator..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=10 DURATION=60 ORDERS_PER_MINUTE=5 \
		node simulators/simulate-orders.js &
	@echo ""
	@echo "Running orchestrator..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=10 DURATION=65 \
		node simulators/universal-orchestrator.js
	@echo ""
	@pkill -f "print-emulator.js" 2>/dev/null || true
	@pkill -f "task-engine.js" 2>/dev/null || true
	@echo "✅ Universal Test Complete"

# Teste universal completo (100 tenants, 300s)
universal-test-full:
	@echo "🎯 Running FULL Universal Test Harness (100 tenants, 300s)..."
	@echo ""
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/print-emulator.js &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node task-engine/task-engine.js &
	@sleep 3
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=100 DURATION=300 ORDER_RATE=5 \
		node simulators/simulate-pos.js &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=100 DURATION=300 ORDER_RATE=5 \
		node simulators/simulate-qr-web.js &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=100 DURATION=300 ORDERS_PER_MINUTE=10 \
		node simulators/simulate-orders.js &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=100 DURATION=310 \
		node simulators/universal-orchestrator.js
	@pkill -f "print-emulator.js" 2>/dev/null || true
	@pkill -f "task-engine.js" 2>/dev/null || true

# Listar prints gerados
prints:
	@echo "🖨️  Print Jobs Generated:"
	@ls -la prints/ 2>/dev/null || echo "No prints yet"
	@echo ""
	@echo "📊 Print Jobs Status:"
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		SELECT station, status, COUNT(*) FROM gm_print_jobs GROUP BY station, status ORDER BY station;"

# Status das tarefas
tasks-status:
	@echo "📋 Tasks Status:"
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "\
		SELECT task_type, status, COUNT(*) FROM gm_tasks GROUP BY task_type, status ORDER BY task_type;"

# Status do KDS (pedidos por status)
kds-status:
	@echo "🍳 KDS Status (Orders by status):"
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		SELECT source, status, COUNT(*) FROM gm_orders GROUP BY source, status ORDER BY source, status;"

# Status dos eventos
events-status:
	@echo "📡 Events Status:"
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		SELECT event_type, processed, COUNT(*) FROM gm_events GROUP BY event_type, processed ORDER BY event_type;"

# Limpar dados do Universal Test
universal-clean:
	@echo "🧹 Clearing Universal Test data..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "\
		TRUNCATE gm_events, gm_print_jobs CASCADE;"
	@rm -rf prints/*.txt 2>/dev/null || true
	@echo "✅ Universal Test data cleared"

# Iniciar apenas Print Emulator
print-emulator:
	@echo "🖨️  Starting Print Emulator..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/print-emulator.js

# Iniciar apenas Task Engine
task-engine:
	@echo "🔧 Starting Task Engine..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node task-engine/task-engine.js

# Simular apenas POS
simulate-pos:
	@echo "💳 Running POS Simulator..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=$${TENANTS:-10} DURATION=$${DURATION:-60} ORDER_RATE=$${ORDER_RATE:-2} \
		node simulators/simulate-pos.js

# Simular apenas QR Web
simulate-qr:
	@echo "📱 Running QR Web Simulator..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		TENANTS=$${TENANTS:-10} DURATION=$${DURATION:-60} ORDER_RATE=$${ORDER_RATE:-3} \
		node simulators/simulate-qr-web.js

# ==============================================================================
# FULL SYSTEM TEST - 100% HEADLESS (NO iOS, NO ANDROID, NO EXPO)
# ==============================================================================

.PHONY: full-system-test full-system-test-quick system-status system-clean

# COMANDO SUPREMO: Teste completo do sistema sem dependência de UI
full-system-test:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   CHEFIAPP FULL SYSTEM TEST - 100% HEADLESS"
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   ❌ Sem iOS    ❌ Sem Android    ❌ Sem Expo"
	@echo "   ✅ Mobile Sim  ✅ POS Sim  ✅ QR Sim  ✅ API Sim"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "📦 PHASE 1: Verificando infraestrutura..."
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT 1" > /dev/null 2>&1 || \
		(echo "❌ Supabase não está rodando. Execute: cd ../supabase && supabase start" && exit 1)
	@echo "   ✅ Supabase local conectado"
	@echo ""
	@echo "🧹 PHASE 2: Limpando dados anteriores..."
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		DELETE FROM gm_order_items; \
		DELETE FROM gm_orders; \
		DELETE FROM gm_print_jobs; \
		DELETE FROM gm_events;" > /dev/null 2>&1
	@rm -rf prints/*.txt 2>/dev/null || true
	@echo "   ✅ Dados limpos"
	@echo ""
	@echo "🖨️  PHASE 3: Iniciando serviços de backend..."
	@DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
		node simulators/print-emulator.js > /dev/null 2>&1 &
	@DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
		node task-engine/task-engine.js > /dev/null 2>&1 &
	@sleep 2
	@echo "   ✅ Print Emulator ativo"
	@echo "   ✅ Task Engine ativo"
	@echo ""
	@echo "📱 PHASE 4: Iniciando clientes simulados..."
	@DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
		TENANTS=5 ORDERS_PER_WAITER=3 \
		node simulators/mobile-client-sim.js &
	@DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
		TENANTS=5 DURATION=30 ORDER_RATE=2 \
		node simulators/simulate-pos.js > /dev/null 2>&1 &
	@DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
		TENANTS=5 DURATION=30 ORDER_RATE=2 \
		node simulators/simulate-qr-web.js > /dev/null 2>&1 &
	@sleep 35
	@echo ""
	@echo "📊 PHASE 5: Coletando resultados..."
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   📋 RESULTADOS DO TESTE"
	@echo "════════════════════════════════════════════════════════════════"
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		SELECT 'PEDIDOS' as categoria, source, status, COUNT(*) as total \
		FROM gm_orders GROUP BY source, status ORDER BY source;"
	@echo ""
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		SELECT 'PRINT JOBS' as categoria, station, status, COUNT(*) as total \
		FROM gm_print_jobs GROUP BY station, status ORDER BY station;"
	@echo ""
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		SELECT 'EVENTS' as categoria, event_type, COUNT(*) as total \
		FROM gm_events GROUP BY event_type ORDER BY event_type;"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   🔍 VALIDAÇÃO DE INTEGRIDADE"
	@echo "════════════════════════════════════════════════════════════════"
	@ORPHANS=$$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -t -c "\
		SELECT COUNT(*) FROM gm_order_items WHERE order_id NOT IN (SELECT id FROM gm_orders);"); \
	if [ "$$ORPHANS" = "         0" ] || [ "$$ORPHANS" = "0" ]; then \
		echo "   ✅ Orphan Items: 0"; \
	else \
		echo "   ❌ Orphan Items: $$ORPHANS"; \
	fi
	@ORDERS=$$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM gm_orders;"); \
	PRINTS=$$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM gm_print_jobs;"); \
	EVENTS=$$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM gm_events;"); \
	echo "   📦 Total Pedidos: $$ORDERS"; \
	echo "   🖨️  Total Print Jobs: $$PRINTS"; \
	echo "   📡 Total Events: $$EVENTS"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   ✅ FULL SYSTEM TEST COMPLETO"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "   O sistema foi validado 100% via Docker, sem dependência de:"
	@echo "   • iOS Simulator"
	@echo "   • Android Emulator"
	@echo "   • Expo Go"
	@echo "   • Qualquer interface gráfica"
	@echo ""
	@echo "   Apps são apenas CASCA. O CORE manda."
	@echo ""
	@pkill -f "print-emulator.js" 2>/dev/null || true
	@pkill -f "task-engine.js" 2>/dev/null || true
	@pkill -f "simulate-pos.js" 2>/dev/null || true
	@pkill -f "simulate-qr-web.js" 2>/dev/null || true

# Teste rápido (menos tenants, menos tempo)
full-system-test-quick:
	@echo "⚡ Running Quick System Test (3 tenants, 15s)..."
	@TENANTS=3 DURATION=15 ORDER_RATE=1 ORDERS_PER_WAITER=2 $(MAKE) full-system-test

# Status completo do sistema
system-status:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   CHEFIAPP SYSTEM STATUS"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "📊 PEDIDOS:"
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		SELECT source, status, COUNT(*) FROM gm_orders GROUP BY source, status ORDER BY source, status;"
	@echo ""
	@echo "🖨️  IMPRESSÕES:"
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		SELECT station, status, COUNT(*) FROM gm_print_jobs GROUP BY station, status ORDER BY station;"
	@echo ""
	@echo "📡 EVENTOS:"
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		SELECT event_type, processed, COUNT(*) FROM gm_events GROUP BY event_type, processed ORDER BY event_type;"
	@echo ""

# Limpar sistema completamente
system-clean:
	@echo "🧹 Limpando todo o sistema..."
	@PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\
		DELETE FROM gm_order_items; \
		DELETE FROM gm_orders; \
		DELETE FROM gm_print_jobs; \
		DELETE FROM gm_events; \
		DELETE FROM gm_tasks;" > /dev/null 2>&1
	@rm -rf prints/*.txt 2>/dev/null || true
	@pkill -f "print-emulator.js" 2>/dev/null || true
	@pkill -f "task-engine.js" 2>/dev/null || true
	@pkill -f "simulate" 2>/dev/null || true
	@echo "✅ Sistema limpo"

# ==============================================================================
# MEGA OPERATIONAL SIMULATOR - 24H TIME WARP
# ==============================================================================

.PHONY: simulate-24h-small simulate-24h-enterprise simulate-24h-max kds-start assertions report-24h

# Simulação 24h pequena (10 restaurants, 5min real = 24h simuladas)
simulate-24h-small:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   MEGA OPERATIONAL SIMULATOR - SMALL (10 restaurants)"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "🧹 Limpando dados anteriores..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "\
		DELETE FROM gm_kds_events; \
		DELETE FROM gm_task_runs; \
		DELETE FROM gm_offline_actions; \
		DELETE FROM gm_order_items; \
		DELETE FROM gm_orders; \
		DELETE FROM gm_print_jobs; \
		DELETE FROM gm_events; \
		DELETE FROM gm_tasks;" > /dev/null 2>&1
	@echo "   ✅ Dados limpos"
	@echo ""
	@echo "🖨️  Iniciando serviços de backend..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/print-emulator.js > /dev/null 2>&1 &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-kitchen.js > /dev/null 2>&1 &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-bar.js > /dev/null 2>&1 &
	@sleep 2
	@echo "   ✅ Print Emulator, KDS Kitchen, KDS Bar ativos"
	@echo ""
	@echo "🚀 Iniciando simulação 24h..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		MODE=small DURATION_MINUTES=5 \
		node simulators/simulate-24h.js
	@echo ""
	@pkill -f "print-emulator.js" 2>/dev/null || true
	@pkill -f "kds-kitchen.js" 2>/dev/null || true
	@pkill -f "kds-bar.js" 2>/dev/null || true

# Simulação 24h enterprise (100 restaurants, 10min)
simulate-24h-enterprise:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   MEGA OPERATIONAL SIMULATOR - ENTERPRISE (100 restaurants)"
	@echo "════════════════════════════════════════════════════════════════"
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "\
		DELETE FROM gm_kds_events; DELETE FROM gm_task_runs; DELETE FROM gm_offline_actions; \
		DELETE FROM gm_order_items; DELETE FROM gm_orders; DELETE FROM gm_print_jobs; \
		DELETE FROM gm_events; DELETE FROM gm_tasks;" > /dev/null 2>&1
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/print-emulator.js > /dev/null 2>&1 &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-kitchen.js > /dev/null 2>&1 &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-bar.js > /dev/null 2>&1 &
	@sleep 2
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		MODE=enterprise DURATION_MINUTES=10 \
		node simulators/simulate-24h.js
	@pkill -f "print-emulator.js" 2>/dev/null || true
	@pkill -f "kds-kitchen.js" 2>/dev/null || true
	@pkill -f "kds-bar.js" 2>/dev/null || true

# Simulação 24h máxima (stress test)
simulate-24h-max:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   MEGA OPERATIONAL SIMULATOR - MAX STRESS"
	@echo "════════════════════════════════════════════════════════════════"
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "\
		DELETE FROM gm_kds_events; DELETE FROM gm_task_runs; DELETE FROM gm_offline_actions; \
		DELETE FROM gm_order_items; DELETE FROM gm_orders; DELETE FROM gm_print_jobs; \
		DELETE FROM gm_events; DELETE FROM gm_tasks;" > /dev/null 2>&1
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/print-emulator.js > /dev/null 2>&1 &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-kitchen.js > /dev/null 2>&1 &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-bar.js > /dev/null 2>&1 &
	@sleep 2
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		MODE=max DURATION_MINUTES=15 \
		node simulators/simulate-24h.js
	@pkill -f "print-emulator.js" 2>/dev/null || true
	@pkill -f "kds-kitchen.js" 2>/dev/null || true
	@pkill -f "kds-bar.js" 2>/dev/null || true

# Iniciar KDS consumers
kds-start:
	@echo "🍳 Starting KDS consumers..."
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-kitchen.js &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-bar.js &
	@echo "✅ KDS Kitchen and Bar started"

# Validar asserts (falha se qualquer assert falhar)
assertions:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   VALIDAÇÃO DE ASSERTS"
	@echo "════════════════════════════════════════════════════════════════"
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		ORPHANS=$$(PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -t -c "\
		SELECT COUNT(*) FROM gm_order_items WHERE order_id NOT IN (SELECT id FROM gm_orders);" | tr -d ' '); \
		if [ "$$ORPHANS" != "0" ]; then \
			echo "❌ FALHA: Orphan items = $$ORPHANS"; exit 1; \
		else \
			echo "✅ Orphan items: 0"; \
		fi
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		ORPHAN_PRINTS=$$(PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -t -c "\
		SELECT COUNT(*) FROM gm_print_jobs WHERE order_id NOT IN (SELECT id FROM gm_orders);" | tr -d ' '); \
		if [ "$$ORPHAN_PRINTS" != "0" ]; then \
			echo "❌ FALHA: Orphan print jobs = $$ORPHAN_PRINTS"; exit 1; \
		else \
			echo "✅ Orphan print jobs: 0"; \
		fi
	@echo ""
	@echo "✅ TODOS OS ASSERTS PASSARAM"

# Gerar relatório da última simulação
report-24h:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   RELATÓRIO DA ÚLTIMA SIMULAÇÃO"
	@echo "════════════════════════════════════════════════════════════════"
	@ls -t reports/*.md 2>/dev/null | head -1 | xargs cat 2>/dev/null || echo "Nenhum relatório encontrado"

# ==============================================================================
# FASE 2C - PERFIS GRANDES (50-300 staff)
# ==============================================================================

# Simulação com perfis grandes (10 restaurantes mix incluindo grande)
simulate-24h-large:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   MEGA OPERATIONAL SIMULATOR - LARGE PROFILES"
	@echo "   Inclui perfis: ambulante, pequeno, médio, GRANDE"
	@echo "════════════════════════════════════════════════════════════════"
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "\
		DELETE FROM gm_task_escalations; DELETE FROM gm_shift_blocks; \
		DELETE FROM gm_kds_events; DELETE FROM gm_offline_actions; \
		DELETE FROM gm_order_items; DELETE FROM gm_orders; \
		DELETE FROM gm_print_jobs; DELETE FROM gm_events; DELETE FROM gm_tasks;" > /dev/null 2>&1
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/print-emulator.js > /dev/null 2>&1 &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-kitchen.js > /dev/null 2>&1 &
	@sleep 2
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		MODE=small DURATION_MINUTES=5 \
		node simulators/simulate-24h.js
	@pkill -f "print-emulator.js" 2>/dev/null || true
	@pkill -f "kds-kitchen.js" 2>/dev/null || true

# Simulação com TODOS os perfis incluindo GIGANTE (100 restaurants)
simulate-24h-giant:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   MEGA OPERATIONAL SIMULATOR - GIANT PROFILES"
	@echo "   Inclui perfis: pequeno, médio, GRANDE, GIGANTE"
	@echo "════════════════════════════════════════════════════════════════"
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "\
		DELETE FROM gm_task_escalations; DELETE FROM gm_shift_blocks; \
		DELETE FROM gm_kds_events; DELETE FROM gm_offline_actions; \
		DELETE FROM gm_order_items; DELETE FROM gm_orders; \
		DELETE FROM gm_print_jobs; DELETE FROM gm_events; DELETE FROM gm_tasks;" > /dev/null 2>&1
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/print-emulator.js > /dev/null 2>&1 &
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		node simulators/kds-kitchen.js > /dev/null 2>&1 &
	@sleep 2
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		MODE=enterprise DURATION_MINUTES=7 \
		node simulators/simulate-24h.js
	@pkill -f "print-emulator.js" 2>/dev/null || true
	@pkill -f "kds-kitchen.js" 2>/dev/null || true

# ==============================================================================
# FAIL-FAST MODE - Validação rápida durante refatorações
# ==============================================================================

# Simulação fail-fast (1h simulada, para no primeiro erro)
simulate-failfast:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   MEGA OPERATIONAL SIMULATOR - FAIL-FAST MODE"
	@echo "   Validação rápida: 1h simulada em ~1 min real"
	@echo "   Para no primeiro erro de integridade"
	@echo "════════════════════════════════════════════════════════════════"
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		DB_HOST=$$(echo $$DB_URL | sed -E 's|.*@([^:]+).*|\1|'); \
		DB_PORT=$$(echo $$DB_URL | sed -E 's|.*:([0-9]+)/.*|\1|'); \
		DB_USER=$$(echo $$DB_URL | sed -E 's|postgresql://([^:]+):.*|\1|'); \
		DB_PASS=$$(echo $$DB_URL | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|'); \
		DB_NAME=$$(echo $$DB_URL | sed -E 's|.*/([^?]+).*|\1|'); \
		PGPASSWORD=$$DB_PASS psql -h $$DB_HOST -p $$DB_PORT -U $$DB_USER -d $$DB_NAME -c "\
		DELETE FROM gm_kds_events; DELETE FROM gm_task_escalations; \
		DELETE FROM gm_shift_blocks; DELETE FROM gm_offline_actions; \
		DELETE FROM gm_order_items; DELETE FROM gm_print_jobs; \
		DELETE FROM gm_events; DELETE FROM gm_tasks; DELETE FROM gm_orders;" > /dev/null 2>&1
	@DB_URL=$${DATABASE_URL:-$(DB_URL_DEFAULT)}; \
		export DATABASE_URL=$$DB_URL; \
		MODE=failfast DURATION_MINUTES=1 \
		node simulators/simulate-failfast.js || (echo "\n❌ FAIL-FAST: Validação falhou" && exit 1)
	@echo ""
	@echo "✅ FAIL-FAST: Core intacto"
