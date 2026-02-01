# =============================================================================
# CHEFIAPP CORE - Makefile
# =============================================================================
# Comandos úteis para gerenciar o Core Docker
# =============================================================================

.PHONY: up down reset logs ps validate test-rpc migrate-product-mode help

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
