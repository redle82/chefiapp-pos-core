#!/bin/bash
set -e

echo "🚀 Starting Release Protocol v1.0 Check..."
echo "============================================"

# 1. Verify Law
echo "📜 Verifying Codex presence..."
if [ -f "SYSTEM_TRUTH_CODEX.md" ]; then
    echo "✅ SYSTEM_TRUTH_CODEX.md found."
else
    echo "❌ CRITICAL: Codex missing. Release ABORTED."
    exit 1
fi

# 2. Verify Truth (The Freeze)
echo "🔒 Running Truth Lock Suite..."
if npm run test:truth; then
    echo "✅ Truth Suite PASSED."
else
    echo "❌ Truth Suite FAILED. Release ABORTED."
    exit 1
fi

# 3. Check for CHANGELOG
echo "📝 Checking Changelog..."
if [ -f "CHANGELOG.md" ]; then
    echo "✅ CHANGELOG.md found."
else
    echo "❌ CHANGELOG.md missing. Release ABORTED."
    exit 1
fi

echo "============================================"
echo "🧊 TRUTH FREEZE CERTIFIED"
echo "✅ System is ready for tagging v1.0.0"
echo "👉 Command: git tag -a v1.0.0 -m \"Truth Layer Release\""
echo "============================================"
exit 0
