#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# SAFE-SWITCH: muda de branch SEM perder trabalho
# Uso:  pnpm switch <branch>
#       pnpm switch -b <nova-branch>
#
# Antes de fazer checkout, detecta alterações locais e faz
# um commit WIP automático na branch actual.
# ──────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ $# -eq 0 ]; then
  echo -e "${RED}Uso: pnpm switch <branch> [-b nova-branch]${NC}"
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)

# 1. Verifica se há alterações não commitadas
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
  echo ""
  echo -e "${YELLOW}⚠  Alterações detectadas em '$CURRENT_BRANCH'${NC}"
  echo -e "${YELLOW}   Auto-salvando como WIP...${NC}"

  git add -A
  git commit -m "wip: auto-save antes de switch para $* [$CURRENT_BRANCH @ $TIMESTAMP]" --no-verify

  echo -e "${GREEN}✓  Salvo em $(git rev-parse --short HEAD)${NC}"
  echo ""
fi

# 2. Faz o checkout
git switch "$@"

NEW_BRANCH=$(git branch --show-current)
echo ""
echo -e "${GREEN}✓  Agora em: $NEW_BRANCH${NC}"
echo ""
