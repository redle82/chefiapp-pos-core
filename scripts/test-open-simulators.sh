#!/bin/bash
# =============================================================================
# test-open-simulators.sh — ChefIApp Universal Test Setup
# =============================================================================
# Opens all required simulators and emulators for the Universal Test
#
# USAGE:
#   chmod +x scripts/test-open-simulators.sh
#   ./scripts/test-open-simulators.sh
#
# REQUIREMENTS:
#   - Xcode with iOS Simulators installed
#   - Android Studio with Emulators configured
#   - Chrome/Safari for web testing
# =============================================================================

set -e

echo "🔥 ChefIApp Universal Test — Simulator Setup"
echo "============================================="
echo ""

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
IOS_DEVICE_1="iPhone 15 Pro"
IOS_DEVICE_2="iPhone 14"
IOS_DEVICE_3="iPad Pro (12.9-inch) (6th generation)"

ANDROID_EMULATOR_1="Pixel_7_API_34"
ANDROID_EMULATOR_2="Pixel_6a_API_33"

WEB_URL_TPV="http://localhost:5173/tpv"
WEB_URL_KDS="http://localhost:5173/kds"
WEB_URL_CUSTOMER="http://localhost:5173/order"
WEB_URL_DASHBOARD="http://localhost:5173/admin"

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
check_xcode() {
    if ! command -v xcrun &> /dev/null; then
        echo "❌ Xcode command line tools not found"
        echo "   Run: xcode-select --install"
        exit 1
    fi
    echo "✅ Xcode found"
}

check_android() {
    if ! command -v emulator &> /dev/null; then
        echo "⚠️  Android emulator not in PATH"
        echo "   Add to ~/.zshrc: export PATH=\$PATH:\$ANDROID_HOME/emulator"
        return 1
    fi
    echo "✅ Android emulator found"
    return 0
}

list_ios_devices() {
    echo ""
    echo "📱 Available iOS Simulators:"
    xcrun simctl list devices available | grep -E "iPhone|iPad" | head -10
}

list_android_devices() {
    echo ""
    echo "🤖 Available Android Emulators:"
    if command -v emulator &> /dev/null; then
        emulator -list-avds 2>/dev/null || echo "   (none configured)"
    fi
}

boot_ios_simulator() {
    local device_name="$1"
    echo "📱 Booting iOS: $device_name..."

    # Get device UDID
    local udid=$(xcrun simctl list devices | grep "$device_name" | grep -oE "[A-F0-9-]{36}" | head -1)

    if [ -z "$udid" ]; then
        echo "   ⚠️  Device '$device_name' not found, skipping..."
        return 1
    fi

    # Boot if not already booted
    xcrun simctl boot "$udid" 2>/dev/null || true

    # Open Simulator app
    open -a Simulator --args -CurrentDeviceUDID "$udid" &

    echo "   ✅ $device_name booted"
    return 0
}

boot_android_emulator() {
    local avd_name="$1"
    echo "🤖 Booting Android: $avd_name..."

    if ! command -v emulator &> /dev/null; then
        echo "   ⚠️  Android emulator not available, skipping..."
        return 1
    fi

    # Check if AVD exists
    if ! emulator -list-avds 2>/dev/null | grep -q "$avd_name"; then
        echo "   ⚠️  AVD '$avd_name' not found, skipping..."
        return 1
    fi

    # Boot in background
    nohup emulator -avd "$avd_name" -no-snapshot-load > /dev/null 2>&1 &

    echo "   ✅ $avd_name starting..."
    return 0
}

open_web_tabs() {
    echo ""
    echo "🌐 Opening web tabs..."

    # Check if dev server is running
    if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "   ⚠️  Dev server not running on localhost:5173"
        echo "   Run: cd merchant-portal && npm run dev"
        return 1
    fi

    # Open tabs in default browser
    open "$WEB_URL_TPV" &
    sleep 0.5
    open "$WEB_URL_KDS" &
    sleep 0.5
    open "$WEB_URL_CUSTOMER" &
    sleep 0.5
    open "$WEB_URL_DASHBOARD" &

    echo "   ✅ Web tabs opened"
    return 0
}

# -----------------------------------------------------------------------------
# Main Execution
# -----------------------------------------------------------------------------
main() {
    echo "🔍 Checking requirements..."
    check_xcode
    check_android || true

    list_ios_devices
    list_android_devices

    echo ""
    echo "🚀 Starting simulators..."
    echo ""

    # Boot iOS Simulators
    boot_ios_simulator "$IOS_DEVICE_1" || true
    boot_ios_simulator "$IOS_DEVICE_2" || true
    # boot_ios_simulator "$IOS_DEVICE_3" || true  # Uncomment for iPad

    # Boot Android Emulators
    boot_android_emulator "$ANDROID_EMULATOR_1" || true
    # boot_android_emulator "$ANDROID_EMULATOR_2" || true  # Uncomment for second

    # Wait for simulators to boot
    echo ""
    echo "⏳ Waiting 10s for simulators to initialize..."
    sleep 10

    # Open web tabs
    open_web_tabs || true

    echo ""
    echo "============================================="
    echo "✅ Test environment ready!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Install Expo Go on simulators (if using Expo)"
    echo "   2. Run: cd mobile-app && npx expo start"
    echo "   3. Scan QR code on each simulator"
    echo "   4. Login with test accounts"
    echo "   5. Begin Universal Test checklist"
    echo ""
    echo "📝 Checklist: docs/testing/UNIVERSAL_TEST_CHECKLIST.md"
    echo "============================================="
}

main "$@"
