# =============================================================================
# CHEFIAPP CORE - Makefile
# =============================================================================
# Comandos úteis para gerenciar o Core Docker
# =============================================================================

.PHONY: up down reset logs ps validate test-rpc migrate-product-mode migrate-onboarding-completed migrate-terminals migrate-staff migrate-restaurant-people migrate-trial-ends-at help

# Default target
help:
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  ChefIApp Core - Docker Commands"
	@echo "═══════════════════════════════════════════════════════════"
	@echo ""
	@echo "  make up                  - Subir Core Docker"
	@echo "  make down                - Parar Core Docker"
	@echo "  make reset               - Reset total (remove volumes)"
	@echo "  make logs                - Ver logs"
	@echo "  make ps                  - Ver status dos containers"
	@echo "  make validate            - Validar RPC e constraints"
	@echo "  make test-rpc            - Testar create_order_atomic"
	@echo "  make migrate-product-mode - Aplicar migration product_mode (gm_restaurants)"
	@echo "  make migrate-cash-registers - Aplicar migration caixa e pagamentos"
	@echo "  make migrate-operational-rpcs - Aplicar RPCs get_operational_metrics e get_shift_history"
	@echo "  make migrate-onboarding-completed - Aplicar coluna onboarding_completed_at (gm_restaurants)"
	@echo "  make migrate-terminals - Aplicar tabela gm_terminals (registro de terminais)"
	@echo "  make migrate-staff - Aplicar tabela gm_staff (staff operacional)"
	@echo "  make migrate-menu-catalog - Aplicar tabelas gm_catalog_* (menu digital /menu-v2)"
	@echo "  make migrate-menu-catalog-seed - Seed opcional do catálogo (dados de exemplo)"
	@echo "  make migrate-restaurant-people - Aplicar tabela gm_restaurant_people (pessoas operacionais / AppStaff)"
	@echo "  make migrate-trial-ends-at - Aplicar coluna trial_ends_at (gm_restaurants; paywall FASE 1)"
	@echo "  make test-global            - Teste global: tabelas + TPV + tarefas (script)"
	@echo ""

# Subir Core
up:
	@echo "🚀 Subindo ChefIApp Core..."
	docker compose -f docker-compose.core.yml up -d
	@echo "✅ Core Docker rodando"
	@echo ""
	@echo "📊 Endpoints:"
	@echo "   Postgres:  localhost:54320"
	@echo "   PostgREST: http://localhost:3000"
	@echo "   Realtime:  ws://localhost:4000"

# Parar Core
down:
	@echo "🛑 Parando ChefIApp Core..."
	docker compose -f docker-compose.core.yml down

# Reset total (remove volumes)
reset:
	@echo "🧹 Resetando Core Docker (remove volumes)..."
	docker compose -f docker-compose.core.yml down -v
	docker compose -f docker-compose.core.yml up -d
	@echo "✅ Core resetado e rodando"

# Ver logs
logs:
	docker compose -f docker-compose.core.yml logs -f

# Ver status
ps:
	docker compose -f docker-compose.core.yml ps

# Validar RPC e constraints
validate:
	@echo "🔍 Validando Core Docker..."
	@echo ""
	@echo "1️⃣ Verificando RPC create_order_atomic..."
	@docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -c "\df create_order_atomic" || \
		(echo "❌ RPC não encontrado" && exit 1)
	@echo "✅ RPC existe"
	@echo ""
	@echo "2️⃣ Verificando constraint idx_one_open_order_per_table..."
	@docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -c "\d+ idx_one_open_order_per_table" || \
		(echo "❌ Constraint não encontrada" && exit 1)
	@echo "✅ Constraint existe"
	@echo ""
	@echo "3️⃣ Verificando tabelas core..."
	@docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -c "\dt gm_*" || \
		(echo "❌ Tabelas não encontradas" && exit 1)
	@echo "✅ Tabelas core existem"
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "✅ VALIDAÇÃO COMPLETA"
	@echo "═══════════════════════════════════════════════════════════"

# Testar RPC
test-rpc:
	@echo "🧪 Testando create_order_atomic..."
	@docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -c " \
		SELECT create_order_atomic( \
			'00000000-0000-0000-0000-000000000100'::UUID, \
			'[{\"product_id\":\"00000000-0000-0000-0000-000000000001\",\"name\":\"Teste\",\"quantity\":1,\"unit_price\":1000}]'::jsonb \
		);" || \
		(echo "❌ RPC falhou" && exit 1)
	@echo "✅ RPC funcionando"

# Aplicar migration product_mode (coluna gm_restaurants.product_mode para persistência demo/pilot/live)
migrate-product-mode:
	@echo "📦 Aplicando migration product_mode..."
	@cat schema/migrations/20260128_product_mode.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ product_mode aplicado" || \
		(echo "❌ Migration falhou (confira se o Core está up: make up)" && exit 1)

# Aplicar migration gm_cash_registers + gm_payments (caixa e pagamentos)
migrate-cash-registers:
	@echo "📦 Aplicando migration gm_cash_registers..."
	@cat schema/migrations/20260128_core_payments_and_cash_registers.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ gm_cash_registers aplicado" || \
		(echo "❌ Migration falhou (confira se o Core está up: make up)" && exit 1)

# Aplicar RPCs get_operational_metrics e get_shift_history (dashboard; requer migrate-cash-registers)
migrate-operational-rpcs:
	@echo "📦 Aplicando RPCs operacionais (get_operational_metrics, get_shift_history)..."
	@cat schema/migrations/20260201_rpc_operational_metrics_and_shift_history.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ RPCs operacionais aplicadas" || \
		(echo "❌ Migration falhou (confira se o Core está up e migrate-cash-registers aplicada: make up && make migrate-cash-registers)" && exit 1)

# Aplicar coluna onboarding_completed_at em gm_restaurants (First Product / ativação restaurante)
migrate-onboarding-completed:
	@echo "📦 Aplicando migration onboarding_completed_at (gm_restaurants)..."
	@cat schema/migrations/20260203_gm_restaurants_onboarding_completed_at.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ onboarding_completed_at aplicado" || \
		(echo "❌ Migration falhou (confira se o Core está up: make up)" && exit 1)

# Aplicar tabela gm_terminals (registro de terminais TPV/KDS/AppStaff)
migrate-terminals:
	@echo "📦 Aplicando migration gm_terminals..."
	@cat schema/migrations/20260203_gm_terminals.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ gm_terminals aplicado" || \
		(echo "❌ Migration falhou (confira se o Core está up: make up)" && exit 1)

# Aplicar tabela gm_staff (staff operacional: sala, cozinha, gerente)
migrate-staff:
	@echo "📦 Aplicando migration gm_staff..."
	@cat schema/migrations/20260203_gm_staff.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ gm_staff aplicado" || \
		(echo "❌ Migration falhou (confira se o Core está up: make up)" && exit 1)

# Aplicar tabela shift_logs (registo de turnos; AppStaff LiveRoster)
migrate-shift-logs:
	@echo "📦 Aplicando migration shift_logs..."
	@cat schema/migrations/20260205_shift_logs.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ shift_logs aplicado" || \
		(echo "❌ Migration falhou (confira se o Core está up: make up)" && exit 1)

# Aplicar tabelas do menu digital (gm_catalog_menus, gm_catalog_categories, gm_catalog_items; /menu-v2)
migrate-menu-catalog:
	@echo "📦 Aplicando migration menu catalog (gm_catalog_*)..."
	@cat schema/migrations/20260206_menu_catalog.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ menu catalog aplicado" || \
		(echo "❌ Migration falhou (confira se o Core está up: make up)" && exit 1)

# Seed opcional do catálogo (menu + categorias + itens de exemplo para /menu-v2)
migrate-menu-catalog-seed:
	@echo "📦 Aplicando seed menu catalog..."
	@cat schema/migrations/20260206_menu_catalog_seed.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ menu catalog seed aplicado" || \
		(echo "❌ Seed falhou (aplique antes: make migrate-menu-catalog)" && exit 1)

# Aplicar tabela gm_restaurant_people (pessoas operacionais; código/QR para AppStaff e Config → Empregados)
migrate-restaurant-people:
	@echo "📦 Aplicando migration gm_restaurant_people..."
	@cat schema/migrations/20260207_gm_restaurant_people.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ gm_restaurant_people aplicado" || \
		(echo "❌ Migration falhou (confira se o Core está up: make up)" && exit 1)

# Aplicar coluna trial_ends_at em gm_restaurants (paywall e countdown FASE 1 Vendável PT)
migrate-trial-ends-at:
	@echo "📦 Aplicando migration trial_ends_at (gm_restaurants)..."
	@cat schema/migrations/20260213_trial_ends_at.sql | docker compose -f docker-compose.core.yml exec -T postgres \
		psql -U postgres -d chefiapp_core -f - && echo "✅ trial_ends_at aplicado" || \
		(echo "❌ Migration falhou (confira se o Core está up: make up)" && exit 1)

# Teste global: Core + todas as tabelas + TPV (turno + pedido) + tarefas (MODO_INTERNO)
test-global:
	@./test-global-todas-tabelas.sh
