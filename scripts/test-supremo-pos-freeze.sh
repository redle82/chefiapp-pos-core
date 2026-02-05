#!/usr/bin/env bash
# test-supremo-pos-freeze.sh — Teste Supremo pós-freeze (auditoria automática)
#
# Valida: pré-condições, Docker Core, testes soberanos, sanidade DB (opcional), anti-regressão blacklist.
# Passos 3–7 (frontend, navegação, bootstrap, terminais, TPV→KDS) ficam para manual; o script imprime lembretes.
#
# Uso: ./scripts/test-supremo-pos-freeze.sh [--skip-docker] [--skip-db] [--allow-dirty]
# Execução a partir da raiz do repositório.
#
# Ref: docs/qa/TESTE_SUPREMO_POS_FREEZE.md; docs/ops/LEGACY_CODE_BLACKLIST.md

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SKIP_DOCKER=false
SKIP_DB=false
ALLOW_DIRTY=false
for arg in "$@"; do
  case "$arg" in
    --skip-docker) SKIP_DOCKER=true ;;
    --skip-db)     SKIP_DB=true ;;
    --allow-dirty) ALLOW_DIRTY=true ;;
  esac
done

FAILED=0
COMPOSE_FILE="docker-core/docker-compose.core.yml"
SEARCH_DIR="merchant-portal/src"

ok()  { echo "✔ $1"; }
fail() { echo "✗ $1"; FAILED=1; }

# --- 0. Pré-condições ---
echo ""
echo "=== 0. Pré-condições ==="
if [[ "$ALLOW_DIRTY" == true ]]; then
  ok "Git status (--allow-dirty: ignorado)"
else
  if [[ -n "$(git status --porcelain)" ]]; then
    fail "Git status sujo; commit ou use --allow-dirty"
  else
    ok "Git status limpo"
  fi
fi

# --- 1. Docker Core ---
echo ""
echo "=== 1. Docker Core ==="
if [[ "$SKIP_DOCKER" == true ]]; then
  ok "Docker (--skip-docker: ignorado)"
else
  docker compose -f "$COMPOSE_FILE" up -d --quiet-pull 2>/dev/null || true
  sleep 3
  if ! docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -q "chefiapp-core-postgres.*healthy\|Up"; then
    fail "Postgres não healthy ou não Up"
  else
    ok "Postgres healthy/Up"
  fi
  if ! docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -q "chefiapp-core-postgrest\|postgrest.*Up"; then
    fail "PostgREST não Up"
  else
    ok "PostgREST Up"
  fi
  LOGS=$(docker logs chefiapp-core-postgres 2>&1 | tail -80)
  if echo "$LOGS" | grep -q "FATAL"; then
    fail "Logs Postgres contêm FATAL"
  else
    ok "Logs Postgres sem FATAL"
  fi
fi

# --- 2. Backend / Kernel (testes soberanos) ---
echo ""
echo "=== 2. Backend / Kernel (testes) ==="
if (cd merchant-portal && npm test -- --passWithNoTests 2>&1); then
  ok "Testes soberanos passaram"
else
  fail "Testes falharam (npm test)"
fi

# --- 8. DB sanidade (opcional) ---
echo ""
echo "=== 8. DB sanidade ==="
if [[ "$SKIP_DB" == true ]] || [[ "$SKIP_DOCKER" == true ]]; then
  ok "DB (--skip-db ou --skip-docker: ignorado)"
else
  if docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d chefiapp_core -c "SELECT 1 FROM gm_restaurants LIMIT 1;" >/dev/null 2>&1; then
    ok "gm_restaurants acessível"
  else
    fail "gm_restaurants inacessível ou tabela ausente"
  fi
  if docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d chefiapp_core -c "SELECT 1 FROM gm_orders LIMIT 1;" >/dev/null 2>&1; then
    ok "gm_orders acessível"
  else
    fail "gm_orders inacessível ou tabela ausente"
  fi
  if docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d chefiapp_core -c "SELECT 1 FROM gm_equipment LIMIT 1;" >/dev/null 2>&1; then
    ok "gm_equipment acessível"
  else
    fail "gm_equipment inacessível ou tabela ausente"
  fi
fi

# --- 9. Anti-regressão (blacklist) ---
echo ""
echo "=== 9. Anti-regressão (blacklist) ==="
# navigate("/") ou navigate('/') — redirect ilegítimo para landing
if grep -RE "navigate\s*\(\s*[\"']/[\"']\s*\)" "$SEARCH_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "resolveDestination\|/auth\|/app/dashboard"; then
  fail "Encontrado navigate(\"/\") ou equivalente (blacklist)"
else
  ok "Nenhum navigate(\"/\") fora de contrato"
fi
# Módulos Demo/cinematic proibidos (reintrodução); excluir linhas que são só comentário ( * ou //)
if grep -REn "DemoExplicativo|DemoTourPage|DemoGuiadoPage" "$SEARCH_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -vE ":[0-9]+:[[:space:]]*(\*|//)"; then
  fail "Encontrado DemoExplicativo/DemoTourPage/DemoGuiadoPage (blacklist)"
else
  ok "Nenhum módulo Demo proibido"
fi
# cinematic: import ou from (reintrodução)
if grep -RE "from ['\"].*cinematic|import.*cinematic" "$SEARCH_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null; then
  fail "Encontrado import/from cinematic (blacklist)"
else
  ok "Nenhum import cinematic"
fi

# --- Resumo e passos manuais ---
echo ""
if [[ $FAILED -eq 1 ]]; then
  echo "=== Resultado: FALHOU ==="
  echo "Corrigir os passos assinalados com ✗ antes de prosseguir."
  echo ""
  echo "Passos manuais obrigatórios (após o script passar): 3, 4, 5, 6, 7"
  echo "  3. Frontend: npm run dev; abrir http://localhost:5175; validar logs ([Runtime] Mode, [CoreHealth] Status, sem loop redirect)."
  echo "  4. Navegação: / → /auth ou /app/dashboard; /app/dashboard nunca → /; /app/install nunca → landing; Core OFF/ON."
  echo "  5. Bootstrap: criar restaurante; gm_restaurants populado; nome no header/sidebar; sem banner trial/primeira venda."
  echo "  6. /app/install: instalar 1 TPV + 1 KDS; gm_equipment; device_id; Online; heartbeat; sem redirect landing."
  echo "  7. Operação real: abrir TPV, turno, pedido, KDS, marcar pronto, fechar; gm_orders/gm_order_items/gm_cash_registers; sem mock."
  exit 1
fi

echo "=== Resultado: PASS (automático) ==="
echo ""
echo "Passos manuais obrigatórios: 3, 4, 5, 6, 7"
echo "  3. Frontend: npm run dev; abrir http://localhost:5175; validar logs ([Runtime] Mode, [CoreHealth] Status, sem loop redirect)."
echo "  4. Navegação: / → /auth ou /app/dashboard; /app/dashboard nunca → /; /app/install nunca → landing; Core OFF/ON."
echo "  5. Bootstrap: criar restaurante; gm_restaurants populado; nome no header/sidebar; sem banner trial/primeira venda."
echo "  6. /app/install: instalar 1 TPV + 1 KDS; gm_equipment; device_id; Online; heartbeat; sem redirect landing."
echo "  7. Operação real: abrir TPV, turno, pedido, KDS, marcar pronto, fechar; gm_orders/gm_order_items/gm_cash_registers; sem mock."
echo ""
echo "Se automático + manual OK: declarar «O sistema está operacional, coerente, soberano e livre de legado.»"
echo "Opcional: git tag operational-freeze-v1 && git push --tags"
exit 0
