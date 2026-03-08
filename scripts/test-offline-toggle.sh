#!/bin/bash
# =============================================================================
# test-offline-toggle.sh — ChefIApp Offline Testing Helper
# =============================================================================
# Toggles network connectivity for testing offline scenarios
#
# USAGE:
#   chmod +x scripts/test-offline-toggle.sh
#   ./scripts/test-offline-toggle.sh [on|off|status]
#
# OPTIONS:
#   on      - Enable network (restore connectivity)
#   off     - Disable network (simulate offline)
#   status  - Show current network status
#
# NOTES:
#   - Requires sudo for network control
#   - Affects the entire machine (use with caution)
#   - For simulator-specific, use Network Link Conditioner
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Network interface (usually en0 for Wi-Fi on Mac)
INTERFACE="en0"

usage() {
    echo "Usage: $0 [on|off|status|ios-off|ios-on]"
    echo ""
    echo "Commands:"
    echo "  on        Enable network connectivity"
    echo "  off       Disable network connectivity (requires sudo)"
    echo "  status    Show current network status"
    echo "  ios-off   Disable network for iOS Simulator only"
    echo "  ios-on    Enable network for iOS Simulator"
    echo ""
    echo "For fine-grained control, use Network Link Conditioner in Xcode."
}

check_status() {
    echo "📡 Network Status"
    echo "=================="

    # Check Wi-Fi status
    wifi_status=$(networksetup -getairportpower $INTERFACE 2>/dev/null | awk '{print $NF}')
    if [ "$wifi_status" = "On" ]; then
        echo -e "Wi-Fi: ${GREEN}ON${NC}"
    else
        echo -e "Wi-Fi: ${RED}OFF${NC}"
    fi

    # Check internet connectivity
    if ping -c 1 -W 1 8.8.8.8 > /dev/null 2>&1; then
        echo -e "Internet: ${GREEN}CONNECTED${NC}"
    else
        echo -e "Internet: ${RED}DISCONNECTED${NC}"
    fi

    # Check if dev server is accessible
    if curl -s --max-time 2 http://localhost:5173 > /dev/null 2>&1; then
        echo -e "Dev Server: ${GREEN}RUNNING${NC}"
    else
        echo -e "Dev Server: ${YELLOW}NOT RUNNING${NC}"
    fi

    # Check Supabase
    if curl -s --max-time 2 https://yjcgoehucaafzykvrdpg.supabase.co > /dev/null 2>&1; then
        echo -e "Supabase: ${GREEN}REACHABLE${NC}"
    else
        echo -e "Supabase: ${RED}UNREACHABLE${NC}"
    fi
}

network_off() {
    echo -e "${YELLOW}⚠️  Disabling network...${NC}"
    echo ""
    echo "This will disable Wi-Fi on your machine."
    echo "To re-enable, run: $0 on"
    echo ""
    read -p "Continue? (y/n): " confirm

    if [ "$confirm" != "y" ]; then
        echo "Cancelled."
        exit 0
    fi

    sudo networksetup -setairportpower $INTERFACE off
    echo -e "${RED}📴 Network DISABLED${NC}"
    echo ""
    echo "Test offline scenarios now."
    echo "Run '$0 on' to restore connectivity."
}

network_on() {
    echo -e "${GREEN}📶 Enabling network...${NC}"
    sudo networksetup -setairportpower $INTERFACE on

    echo "Waiting for connection..."
    sleep 3

    check_status
}

ios_offline() {
    echo "📱 iOS Simulator Offline Mode"
    echo "=============================="
    echo ""
    echo "For iOS Simulator network control, use one of:"
    echo ""
    echo "1. Network Link Conditioner (recommended):"
    echo "   - Open Xcode > Open Developer Tool > Accessibility Inspector"
    echo "   - Or install from: Xcode > Settings > Components"
    echo ""
    echo "2. Use Airplane Mode in Simulator:"
    echo "   - Hardware > Toggle Airplane Mode (not available in Simulator)"
    echo ""
    echo "3. Programmatic approach (in app):"
    echo "   - Use NowEngine.ts DEV_FORCE_OFFLINE flag"
    echo ""
    echo "4. Disconnect Mac from network:"
    echo "   - Run: $0 off"
    echo ""

    # Check if we can set a flag
    echo "Setting DEV_FORCE_OFFLINE in local storage..."
    echo ""
    echo "Open the app and run in console:"
    echo "  localStorage.setItem('DEV_FORCE_OFFLINE', 'true')"
}

# -----------------------------------------------------------------------------
# Alternative: Block specific domains with /etc/hosts
# -----------------------------------------------------------------------------
block_supabase() {
    echo "🚫 Blocking Supabase (simulates backend offline)..."

    HOSTS_ENTRY="127.0.0.1 yjcgoehucaafzykvrdpg.supabase.co"

    if grep -q "yjcgoehucaafzykvrdpg.supabase.co" /etc/hosts; then
        echo "Already blocked."
    else
        echo "$HOSTS_ENTRY" | sudo tee -a /etc/hosts > /dev/null
        sudo dscacheutil -flushcache
        echo "Supabase blocked."
    fi
}

unblock_supabase() {
    echo "✅ Unblocking Supabase..."

    sudo sed -i '' '/yjcgoehucaafzykvrdpg.supabase.co/d' /etc/hosts
    sudo dscacheutil -flushcache
    echo "Supabase unblocked."
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
case "$1" in
    on)
        network_on
        ;;
    off)
        network_off
        ;;
    status)
        check_status
        ;;
    ios-off|ios-on)
        ios_offline
        ;;
    block-backend)
        block_supabase
        ;;
    unblock-backend)
        unblock_supabase
        ;;
    *)
        usage
        exit 1
        ;;
esac
