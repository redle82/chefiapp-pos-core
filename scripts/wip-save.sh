#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# WIP-SAVE: Checkpoint rápido de todo o trabalho local
# Uso:  pnpm save          → commit WIP com timestamp
#       pnpm save "nota"   → commit WIP com mensagem personalizada
#       pnpm unsave        → desfaz o último WIP (mantém alterações no disco)
# ──────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

MODE="${1:-save}"

case "$MODE" in
  --undo|undo)
    # Desfaz o último commit WIP, mantendo as alterações no disco
    LAST_MSG=$(git log -1 --format="%s" 2>/dev/null || echo "")
    if [[ "$LAST_MSG" != wip:* ]]; then
      echo -e "${RED}✗ O último commit não é um WIP:${NC} $LAST_MSG"
      echo "  Nada a desfazer."
      exit 1
    fi
    git reset --soft HEAD~1
    echo -e "${GREEN}✓ WIP desfeito — alterações de volta ao staging${NC}"
    exit 0
    ;;
  *)
    # Verifica se há algo para salvar
    if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
      echo -e "${CYAN}∅ Nada para salvar — working tree limpo${NC}"
      exit 0
    fi

    # Monta mensagem
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    BRANCH=$(git branch --show-current)
    if [ -n "${1:-}" ]; then
      MSG="wip: $1 [$BRANCH @ $TIMESTAMP]"
    else
      MSG="wip: checkpoint [$BRANCH @ $TIMESTAMP]"
    fi

    # Adiciona TUDO (tracked + untracked) e commita
    git add -A
    git commit -m "$MSG" --no-verify

    # Resumo
    FILES_CHANGED=$(git diff --stat HEAD~1 HEAD | tail -1)
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ WIP SALVO${NC}"
    echo -e "  ${CYAN}Commit:${NC}  $(git rev-parse --short HEAD)"
    echo -e "  ${CYAN}Branch:${NC}  $BRANCH"
    echo -e "  ${CYAN}Quando:${NC}  $TIMESTAMP"
    echo -e "  ${CYAN}Stats:${NC}   $FILES_CHANGED"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${YELLOW}Para desfazer:${NC}  pnpm unsave"
    echo -e "  ${YELLOW}Para continuar:${NC} edita e faz 'pnpm save' novamente"
    echo ""
    ;;
esac
