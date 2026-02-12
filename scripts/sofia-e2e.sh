#!/usr/bin/env bash
set -euo pipefail

# ================================
# CHEFIAPP — SOFIA E2E RUNBOOK
# ================================

ROOT_DIR="/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core"
cd "$ROOT_DIR"

DOCKER_BIN=""
if command -v docker >/dev/null 2>&1; then
	DOCKER_BIN="docker"
elif [ -x "/Applications/Docker.app/Contents/Resources/bin/docker" ]; then
	# macOS Docker Desktop: VS Code terminal sometimes doesn't inherit PATH after install.
	DOCKER_BIN="/Applications/Docker.app/Contents/Resources/bin/docker"
	# Ensure credential helper and related binaries are found.
	export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
fi

if [ -z "$DOCKER_BIN" ]; then
	echo "❌ docker não encontrado (nem no PATH nem em /Applications/Docker.app)."
	echo "Este runbook usa Docker para subir o Postgres local (docker compose up -d db)."
	echo
	echo "Opções:"
	echo "  1) Instalar/ativar Docker Desktop (recomendado para demo local)"
	echo "  2) Usar um Postgres já instalado e exportar DATABASE_URL manualmente, depois correr migrations/seed:"
	echo "     export DATABASE_URL='postgresql://<user>:<pass>@localhost:<port>/<db>'"
	echo "     psql \"\$DATABASE_URL\" -v ON_ERROR_STOP=1 -f migrations/20251223_01_web_module.sql"
	echo "     ... (resto das migrations)"
	echo "     npm run -s seed:web-module"
	echo "     npm run -s server:web-module"
	exit 1
fi

DOCKER_COMPOSE_CMD=""
if "$DOCKER_BIN" compose version >/dev/null 2>&1; then
	DOCKER_COMPOSE_CMD="$DOCKER_BIN compose"
elif command -v docker-compose >/dev/null 2>&1; then
	DOCKER_COMPOSE_CMD="docker-compose"
else
	echo "❌ 'docker compose' não disponível."
	echo "No macOS, instala/abre o Docker Desktop (inclui o plugin 'docker compose')."
	echo "Alternativa: instalar 'docker-compose' legado (não recomendado)."
	exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
	echo "❌ psql não encontrado no PATH."
	echo "Este runbook precisa do cliente Postgres para migrations/seed." 
	echo
	echo "Opções:"
	echo "  - Homebrew: brew install postgresql@16  (ou libpq)"
	echo "  - Ou instala Postgres.app e garante que o 'psql' fica no PATH"
	exit 1
fi

# 1) Subir Postgres (Docker)
# IMPORTANT: DB_PORT must be exported so docker compose picks it up.
export DB_PORT="${DB_PORT:-5433}"
$DOCKER_COMPOSE_CMD up -d db

# 2) DATABASE_URL
export DATABASE_URL="postgresql://test_user:test_password@localhost:${DB_PORT}/chefiapp_core_test"

# 3) Esperar DB ficar pronta (OBRIGATÓRIO)
echo "Aguardando Postgres em localhost:${DB_PORT}..."
for i in $(seq 1 30); do
	if psql "$DATABASE_URL" -c "select 1" >/dev/null 2>&1; then
		break
	fi
	sleep 1
done

psql "$DATABASE_URL" -c "select current_user, current_database(), inet_server_port();" || {
	echo "❌ Não consegui conectar ao Postgres em ${DATABASE_URL}"
	echo "Dica: verifica se o Docker Desktop está a correr e se a porta ${DB_PORT} está livre."
	exit 1
}

# 4) Migrations (ordem importa)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/20251223_01_web_module.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/20251223_02_web_levels.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/20251223_03_web_idempotency.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/20251223_04_company_tenant.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/20251223_05_merchant_gateway_credentials.sql

# 5) Variáveis do Wizard
export INTERNAL_API_TOKEN="${INTERNAL_API_TOKEN:-dev-token}"
export WEB_MODULE_RESTAURANT_ID="${WEB_MODULE_RESTAURANT_ID:-$(uuidgen | tr '[:upper:]' '[:lower:]')}"
export WEB_MODULE_COMPANY_ID="${WEB_MODULE_COMPANY_ID:-$WEB_MODULE_RESTAURANT_ID}"
export WEB_MODULE_SLUG="${WEB_MODULE_SLUG:-sofia-gastrobar}"
export WEB_MODULE_WEB_LEVEL="${WEB_MODULE_WEB_LEVEL:-PRO}"
export CREDENTIALS_ENCRYPTION_KEY="${CREDENTIALS_ENCRYPTION_KEY:-$(openssl rand -hex 32)}"

# 6) Seed
npm run -s seed:web-module

# Micro-melhoria 1: normalizar IDs pelo slug (slug é único)
export WEB_MODULE_RESTAURANT_ID="$(psql "$DATABASE_URL" -Atc "select restaurant_id from restaurant_web_profiles where slug='${WEB_MODULE_SLUG}' limit 1;")"
export WEB_MODULE_COMPANY_ID="$(psql "$DATABASE_URL" -Atc "select company_id from restaurant_web_profiles where slug='${WEB_MODULE_SLUG}' limit 1;")"
export WEB_MODULE_SLUG="$(psql "$DATABASE_URL" -Atc "select slug from restaurant_web_profiles where slug='${WEB_MODULE_SLUG}' limit 1;")"
echo "WEB_MODULE_RESTAURANT_ID=$WEB_MODULE_RESTAURANT_ID"
echo "WEB_MODULE_COMPANY_ID=$WEB_MODULE_COMPANY_ID"
echo "WEB_MODULE_SLUG=$WEB_MODULE_SLUG"

# Capturar um item_id do seed para o pedido
export MENU_ITEM_ID="$(psql "$DATABASE_URL" -Atc "select id from menu_items where restaurant_id='${WEB_MODULE_RESTAURANT_ID}' and is_active=true order by created_at asc limit 1;")"
echo "MENU_ITEM_ID=$MENU_ITEM_ID"

# Micro-melhoria 2: export automático de contexto
cat > .env.sofia <<EOF
DATABASE_URL=${DATABASE_URL}
WEB_MODULE_RESTAURANT_ID=${WEB_MODULE_RESTAURANT_ID}
WEB_MODULE_COMPANY_ID=${WEB_MODULE_COMPANY_ID}
WEB_MODULE_SLUG=${WEB_MODULE_SLUG}
MENU_ITEM_ID=${MENU_ITEM_ID}
INTERNAL_API_TOKEN=${INTERNAL_API_TOKEN}
WEB_MODULE_PORT=${WEB_MODULE_PORT:-4320}
EOF
echo ".env.sofia gerado"

# 7) Subir server
npm run -s server:web-module
