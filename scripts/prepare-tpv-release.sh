#!/usr/bin/env bash
# Prepara uma release do TPV: build do desktop-app e imprime os passos seguintes
# (publicar no GitHub Release e configurar variáveis no portal em produção).
#
# Uso: bash scripts/prepare-tpv-release.sh
# Para Windows: bash scripts/prepare-tpv-release.sh --win (requer ambiente Windows ou CI)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DESKTOP_APP="$REPO_ROOT/desktop-app"
OUT_DIR="$DESKTOP_APP/out"

echo "════════════════════════════════════════════════════════════"
echo "  Prepare TPV release — build do instalador"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ ! -d "$DESKTOP_APP" ]; then
  echo "❌  desktop-app/ não encontrado em $REPO_ROOT"
  exit 1
fi

# Build (Mac por defeito; --win para Windows)
if [[ " $* " =~ " --win " ]]; then
  echo "▶ Build Windows (.exe)..."
  (cd "$DESKTOP_APP" && node scripts/build-electron.mjs --win)
else
  echo "▶ Build macOS (.dmg)..."
  (cd "$DESKTOP_APP" && node scripts/build-electron.mjs)
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Artefactos em: $OUT_DIR"
echo "════════════════════════════════════════════════════════════"
ls -la "$OUT_DIR" 2>/dev/null || true
echo ""

# Extrair versão do package.json do desktop-app
VERSION=$(node -e "console.log(require('$DESKTOP_APP/package.json').version)" 2>/dev/null || echo "0.1.0")

echo "════════════════════════════════════════════════════════════"
echo "  Próximos passos (para o utilizador final poder instalar)"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. Criar uma GitHub Release com tag (ex.: v$VERSION):"
echo "   git tag v$VERSION"
echo "   git push origin v$VERSION"
echo ""
echo "2. Em GitHub → Repo → Releases → Draft new release:"
echo "   - Escolher a tag v$VERSION"
echo "   - Anexar os ficheiros de $OUT_DIR (os .dmg e .exe)"
echo ""
echo "3. Anotar o URL base da release (ex.):"
echo "   https://github.com/<ORG>/<REPO>/releases/download/v$VERSION"
echo ""
echo "4. No Vercel (ou outro deploy do merchant-portal), definir:"
echo "   VITE_DESKTOP_DOWNLOAD_BASE=https://github.com/<ORG>/<REPO>/releases/download/v$VERSION"
DMG_NAME=$(ls "$OUT_DIR"/*.dmg 2>/dev/null | head -1)
if [ -n "$DMG_NAME" ]; then
  echo "   VITE_DESKTOP_DOWNLOAD_MAC_FILE=$(basename "$DMG_NAME")"
fi
EXE_NAME=$(ls "$OUT_DIR"/*.exe 2>/dev/null | head -1)
if [ -n "$EXE_NAME" ]; then
  echo "   VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE=$(basename "$EXE_NAME")"
else
  echo "   VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE=<nome do .exe quando publicar>"
fi
echo "   VITE_DESKTOP_RELEASE_VERSION=$VERSION"
echo ""
echo "5. Fazer redeploy do merchant-portal para o bundle incluir as variáveis."
echo ""
echo "Ver plano completo: docs/ops/PLANO_TPV_RELEASE_EXECUCAO.md"
echo ""
