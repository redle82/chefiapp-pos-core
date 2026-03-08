#!/bin/bash
# =============================================================================
# ChefIApp Project Cleanup Script
# Removes build artifacts, caches, and logs to reduce project size
# Safe to run - does not remove source code or configuration
# =============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🧹 ChefIApp Project Cleanup"
echo "=========================="
echo ""

# Show initial size
INITIAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "📊 Initial size: $INITIAL_SIZE"
echo ""

# Function to safely remove directory
safe_rm() {
    if [ -d "$1" ]; then
        echo "  Removing $1..."
        rm -rf "$1"
    fi
}

# Function to safely remove file
safe_rm_file() {
    if [ -f "$1" ]; then
        echo "  Removing $1..."
        rm -f "$1"
    fi
}

# 1. Clean logs
echo "📝 Cleaning logs..."
rm -rf logs/*.log 2>/dev/null || true
echo "  ✓ Logs cleaned"
echo ""

# 2. Clean Android builds
echo "🤖 Cleaning Android builds..."
safe_rm "mobile-app/android/.gradle"
safe_rm "mobile-app/android/app/build"
safe_rm "mobile-app/android/build"
echo "  ✓ Android cleaned"
echo ""

# 3. Clean iOS builds
echo "🍎 Cleaning iOS builds..."
safe_rm "mobile-app/ios/Pods"
safe_rm "mobile-app/ios/build"
echo "  ✓ iOS cleaned"
echo ""

# 4. Clean test artifacts
echo "🧪 Cleaning test artifacts..."
safe_rm "coverage"
safe_rm "playwright-report"
safe_rm "test-results"
echo "  ✓ Test artifacts cleaned"
echo ""

# 5. Clean dist/build folders
echo "📦 Cleaning build outputs..."
safe_rm "dist"
safe_rm "merchant-portal/dist"
safe_rm "integration-gateway/dist"
echo "  ✓ Build outputs cleaned"
echo ""

# Show final size
FINAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "=========================="
echo "📊 Final size: $FINAL_SIZE (was $INITIAL_SIZE)"
echo "✅ Cleanup complete!"
echo ""
echo "💡 To also reinstall node_modules, run:"
echo "   pnpm run clean:all"
