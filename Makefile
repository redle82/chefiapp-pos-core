# ChefIApp POS Core — Root Makefile
# Contract gate: run audit + contract-gate (no empty docs, no broken links, no unindexed docs).

.PHONY: contract-gate supreme-e2e supreme-stations supreme-seed

contract-gate:
	./scripts/audit-contracts-referenced.sh && ./scripts/contract-gate.sh

# Supreme E2E + Stress: Docker Core → seed → E2E → load → PASS/FAIL
supreme-e2e:
	bash ./scripts/supreme-e2e.sh

# Open visual stations (Command Center, TPV, KDS, Web Public)
supreme-stations:
	bash ./scripts/supreme-stations.sh

# Seed only (requires Docker Core up)
supreme-seed:
	DATABASE_URL=$${DATABASE_URL:-postgresql://postgres:postgres@localhost:54320/chefiapp_core} npx tsx scripts/supreme-seed.ts
