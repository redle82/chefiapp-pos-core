# ChefIApp POS Core — Makefile para CI e validação local
# NEXT_STEPS: "Integrate fail-fast in CI/CD" — Run make simulate-failfast on each PR

.PHONY: simulate-failfast typecheck build test sovereignty-gate world-up world-down world-chaos

# Fail-fast: typecheck + build (quick checks; CI runs rest after)
simulate-failfast: typecheck build
	@echo "[make] simulate-failfast OK"

typecheck:
	npm run typecheck

build:
	npm run build

# Sovereignty gate (order creation via Core, not Supabase RPC)
sovereignty-gate:
	bash ./scripts/sovereignty-gate.sh

# Full test run (CI uses npm test with args directly)
test:
	npm test -- --ci --testPathIgnorePatterns="e2e|playwright|massive|offline" --testTimeout=15000 --maxWorkers=2

# -----------------------------------------------------------------------------
# ChefIApp OS — CLI do mundo (Docker Core)
# -----------------------------------------------------------------------------
# world-up   — sobe o planeta (Postgres, PostgREST, Realtime, Keycloak, MinIO, etc.)
# world-down — para o mundo
# world-chaos — restart de um serviço (default: postgrest)
# Ver: docs/strategy/CLI_CHEFIAPP_OS.md
# -----------------------------------------------------------------------------
world-up:
	./scripts/chef-world-up.sh

world-down:
	./scripts/chef-world-down.sh

world-chaos:
	./scripts/chef-world-chaos.sh $(SERVICE)
