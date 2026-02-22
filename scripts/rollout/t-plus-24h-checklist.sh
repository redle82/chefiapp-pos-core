#!/usr/bin/env bash
# T+24h Full Rollout Checklist
# Continuous monitoring checklist for full rollout phase
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

CHECK="✅"
CROSS="❌"
WARN="⚠️ "
INFO="ℹ️ "

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  🚀 T+24H FULL ROLLOUT CHECKLIST${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CHECKLIST_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
echo "   Checklist started: ${CHECKLIST_TIME}"
echo ""

PASSED=0
FAILED=0
SKIPPED=0

# ==============================================================================
# Helper Functions
# ==============================================================================

ask_check() {
    local question="$1"
    local detail="${2:-}"

    echo -e "${BOLD}${question}${NC}"
    if [[ -n "$detail" ]]; then
        echo "   ${INFO} ${detail}"
    fi

    while true; do
        read -p "   [y/n/s (skip)]: " -n 1 -r
        echo ""
        case $REPLY in
            [Yy])
                echo -e "   ${GREEN}${CHECK} Confirmed${NC}"
                PASSED=$((PASSED + 1))
                echo ""
                return 0
                ;;
            [Nn])
                echo -e "   ${RED}${CROSS} Failed${NC}"
                FAILED=$((FAILED + 1))
                echo ""
                return 1
                ;;
            [Ss])
                echo -e "   ${YELLOW}⊘ Skipped${NC}"
                SKIPPED=$((SKIPPED + 1))
                echo ""
                return 2
                ;;
            *)
                echo "   Invalid input. Use y (yes), n (no), or s (skip)"
                ;;
        esac
    done
}

# ==============================================================================
# Section 1: User Adoption Metrics
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}1️⃣  User Adoption & Access${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "Majority of restaurants using new version?" \
    "Check active sessions in analytics"

ask_check "No reports of users blocked from accessing system?" \
    "Review support tickets for access issues"

ask_check "PWA installation rate stable or increasing?" \
    "Check PWA metrics in analytics"

# ==============================================================================
# Section 2: Error Monitoring (24h Window)
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}2️⃣  Error Monitoring (Last 24 Hours)${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Review Sentry for 24-hour aggregated metrics"
echo ""

ask_check "Total error rate < 1% over last 24 hours?" \
    "Sentry Issues → Filter by 24h timeframe"

ask_check "No new critical/unhandled errors introduced?" \
    "Check 'First Seen' filter for new error types"

ask_check "Error volume trend stable or decreasing?" \
    "Compare hourly error counts (not spiking)"

ask_check "Browser-block bypass count = 0 for entire period?" \
    "CRITICAL: Zero browser access to /op/* routes"

ask_check "All known issues from pilot phase resolved or stable?" \
    "Review issues from T+6h checklist"

# ==============================================================================
# Section 3: Performance Metrics
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}3️⃣  Performance Metrics${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Check Vercel Analytics & Sentry Performance"
echo ""

ask_check "LCP (Largest Contentful Paint) p75 < 2.5s?" \
    "Vercel Analytics → Core Web Vitals"

ask_check "FID (First Input Delay) p75 < 100ms?" \
    "Good responsiveness threshold"

ask_check "CLS (Cumulative Layout Shift) < 0.1?" \
    "Stable page layout"

ask_check "No performance regressions vs. previous version?" \
    "Compare metrics to pre-deployment baseline"

ask_check "API response times p95 < 2s?" \
    "Sentry Performance → Backend transactions"

# ==============================================================================
# Section 4: Business Metrics
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}4️⃣  Business Metrics${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "Order volume maintained or increased?" \
    "Check against historical 24h average"

ask_check "Payment success rate >= 95%?" \
    "Payment gateway metrics"

ask_check "Order completion rate stable?" \
    "Orders created → orders completed ratio"

ask_check "No reported revenue loss due to system issues?" \
    "Check support tickets for payment/order complaints"

# ==============================================================================
# Section 5: Support & User Feedback
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}5️⃣  Support & User Feedback${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Review support tickets and direct feedback"
echo ""

read -p "Number of critical support tickets (last 24h): " CRITICAL_TICKETS

if [[ "$CRITICAL_TICKETS" =~ ^[0-9]+$ ]]; then
    echo ""
    if [[ $CRITICAL_TICKETS -eq 0 ]]; then
        echo -e "   ${GREEN}${CHECK} No critical issues reported${NC}"
        PASSED=$((PASSED + 1))
    elif [[ $CRITICAL_TICKETS -le 3 ]]; then
        echo -e "   ${YELLOW}${WARN} ${CRITICAL_TICKETS} critical ticket(s) - review required${NC}"
        echo ""
        for ((i=1; i<=CRITICAL_TICKETS; i++)); do
            read -p "   Ticket ${i} summary: " TICKET_DESC
            echo "      - ${TICKET_DESC}"
        done
        echo ""
        read -p "   Are these issues resolved or in progress? (yes/no): " RESOLVED
        if [[ "$RESOLVED" =~ ^[Yy][Ee][Ss]$ ]]; then
            PASSED=$((PASSED + 1))
        else
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "   ${RED}${CROSS} ${CRITICAL_TICKETS} critical tickets - high volume${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "   ${YELLOW}${WARN} Invalid input, marking as skipped${NC}"
    SKIPPED=$((SKIPPED + 1))
fi
echo ""

ask_check "Support team handled all critical issues within SLA?" \
    "Check average response/resolution time"

ask_check "No escalations to emergency contacts?" \
    "Serious issues requiring immediate intervention"

# ==============================================================================
# Section 6: Infrastructure Stability
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}6️⃣  Infrastructure Stability${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Check Vercel & Supabase health (24h trends)"
echo ""

ask_check "Vercel: No outages or degraded service?" \
    "Check status.vercel.com and deployment logs"

ask_check "Vercel: Build success rate 100%?" \
    "All deployments successful"

ask_check "Supabase: Database CPU average < 70%?" \
    "Sustained performance over 24h"

ask_check "Supabase: No database incidents or slowdowns?" \
    "Check Supabase status and logs"

ask_check "Supabase: Connection pool healthy (<80% avg)?" \
    "No connection exhaustion"

ask_check "CDN/Assets: No delivery issues reported?" \
    "Static assets loading correctly globally"

# ==============================================================================
# Section 7: Security & Compliance
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}7️⃣  Security & Compliance${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "No security incidents reported?" \
    "Unauthorized access, data breaches, etc."

ask_check "Browser block enforcement maintained 100%?" \
    "CRITICAL: Zero desktop browser access to ops modules"

ask_check "Authentication/authorization working correctly?" \
    "No login issues or permission errors"

ask_check "Fiscal compliance maintained (if applicable)?" \
    "Legal boundary checks passing"

# ==============================================================================
# Decision Point
# ==============================================================================
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  📊 T+24H FULL ROLLOUT SUMMARY${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))
echo "   Checks passed:  ${GREEN}${PASSED}${NC} / ${TOTAL}"
echo "   Checks failed:  ${RED}${FAILED}${NC} / ${TOTAL}"
echo "   Checks skipped: ${YELLOW}${SKIPPED}${NC} / ${TOTAL}"
echo ""

# Calculate failure rate
if [[ $TOTAL -gt 0 ]]; then
    FAIL_RATE=$(( (FAILED * 100) / TOTAL ))
else
    FAIL_RATE=0
fi

# GO/NO-GO Decision
echo -e "${BOLD}━━━ ROLLOUT STATUS ━━━${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✅ STABLE - Full rollout successful${NC}"
    echo ""
    echo "All systems operating normally after 24 hours."
    echo ""
    echo -e "${BOLD}Next steps:${NC}"
    echo "  1. Continue monitoring for next 24h (T+48h)"
    echo "  2. Reduce support standby to normal operations"
    echo "  3. Prepare T+48h stabilization review"
    echo "  4. Document any lessons learned"
    echo ""
    echo "Run T+48h checklist at: T+48h"
    echo "  $ bash scripts/rollout/t-plus-48h-checklist.sh"
    echo ""
    echo -e "${GREEN}${BOLD}🎉 24-hour milestone reached successfully!${NC}"
    echo ""
    exit 0
elif [[ $FAIL_RATE -lt 10 ]]; then
    echo -e "${YELLOW}${BOLD}⚠️  STABLE WITH ISSUES - Active monitoring required${NC}"
    echo ""
    echo "Minor issues detected (${FAIL_RATE}% failure rate)."
    echo ""
    echo "Review failed checks and continue monitoring."
    echo ""
    read -p "Continue to stabilization phase? (yes/no): " -r DECISION
    if [[ "$DECISION" =~ ^[Yy][Ee][Ss]$ ]]; then
        echo ""
        echo -e "${YELLOW}Proceeding with active monitoring...${NC}"
        echo ""
        echo -e "${BOLD}Action items:${NC}"
        echo "  1. Track all open issues to resolution"
        echo "  2. Monitor hourly until T+48h"
        echo "  3. Prepare hotfix if issues escalate"
        echo ""
        exit 0
    else
        echo ""
        echo -e "${YELLOW}Extending monitoring window${NC}"
        echo ""
        echo -e "${BOLD}Recommended actions:${NC}"
        echo "  1. Address failed checks"
        echo "  2. Continue monitoring"
        echo "  3. Re-run checklist in 6-12 hours"
        echo ""
        exit 1
    fi
else
    echo -e "${RED}${BOLD}❌ UNSTABLE - INCIDENT RESPONSE REQUIRED${NC}"
    echo ""
    echo "Failure rate: ${FAIL_RATE}% (threshold: 10%)"
    echo ""
    echo -e "${BOLD}${RED}⚠️  Rollout experiencing significant issues${NC}"
    echo ""
    echo -e "${BOLD}Immediate actions:${NC}"
    echo "  1. Activate incident response team"
    echo "  2. Review all failed checks above"
    echo "  3. Consider rollback if critical issues"
    echo "  4. Investigate root causes immediately"
    echo ""
    echo -e "${BOLD}Rollback command:${NC}"
    echo "  $ vercel rollback"
    echo ""
    echo "Contact engineering lead for emergency response."
    echo ""
    exit 1
fi
