#!/usr/bin/env bash
# T+6h Pilot Phase Checklist
# Interactive checklist for pilot customer rollout (3-5 restaurants)
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
echo -e "${BOLD}  🎯 T+6H PILOT PHASE CHECKLIST${NC}"
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
# Pre-check: Pilot Restaurant Info
# ==============================================================================
echo -e "${BOLD}📋 Pilot Restaurant Configuration${NC}"
echo ""

echo "   Enter pilot restaurant information (3-5 recommended)"
echo ""

PILOT_COUNT=0
declare -a PILOT_NAMES

while true; do
    read -p "   Restaurant name (or press Enter to finish): " PILOT_NAME
    if [[ -z "$PILOT_NAME" ]]; then
        break
    fi
    PILOT_NAMES+=("$PILOT_NAME")
    PILOT_COUNT=$((PILOT_COUNT + 1))
    echo "      Added: ${PILOT_NAME}"
done

echo ""
if [[ $PILOT_COUNT -eq 0 ]]; then
    echo -e "${YELLOW}${WARN} No pilot restaurants configured${NC}"
    echo "   Using generic pilot tracking"
    PILOT_COUNT=1
else
    echo "   ${INFO} Tracking ${PILOT_COUNT} pilot restaurant(s)"
fi
echo ""

# ==============================================================================
# Section 1: Pilot Deployment Status
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}1️⃣  Pilot Deployment Status${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "All pilot restaurants notified about rollout?" \
    "Ensure direct communication channel is open"

ask_check "Support team on standby for pilot issues?" \
    "Immediate response capability for pilot feedback"

ask_check "Pilot restaurants have emergency contact info?" \
    "Phone/WhatsApp for immediate escalation"

# ==============================================================================
# Section 2: Pilot Restaurant Testing
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}2️⃣  Pilot Restaurant Testing (Per Restaurant)${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [[ ${#PILOT_NAMES[@]} -gt 0 ]]; then
    for restaurant in "${PILOT_NAMES[@]}"; do
        echo -e "${BOLD}Testing: ${restaurant}${NC}"
        echo ""

        ask_check "${restaurant}: Apps installed on all devices?" \
            "TPV, KDS, AppStaff all operational"

        ask_check "${restaurant}: Staff trained on new version?" \
            "Basic orientation completed"

        ask_check "${restaurant}: Test order processed successfully?" \
            "Full order flow: creation → payment → completion"

        ask_check "${restaurant}: No critical issues reported?" \
            "Staff feedback is positive or neutral"

        echo ""
    done
else
    ask_check "Pilot restaurant 1: All systems operational?"
    ask_check "Pilot restaurant 2: All systems operational?"
    ask_check "Pilot restaurant 3: All systems operational?"
fi

# ==============================================================================
# Section 3: Aggregate Metrics (Last 6 Hours)
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}3️⃣  Aggregate Metrics (T+0h → T+6h)${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Check Sentry for 6-hour window"
echo ""

ask_check "Total error rate < 1% over last 6 hours?" \
    "Sentry Issues → Filter by time range"

ask_check "No new critical error types introduced?" \
    "Review 'First Seen' column for new issues"

ask_check "Browser-block bypass count still = 0?" \
    "CRITICAL: Search for /op/ route access from browsers"

ask_check "Performance p95 < 2.5s consistently?" \
    "Sentry Performance → Transaction summary"

# ==============================================================================
# Section 4: User Feedback
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}4️⃣  User Feedback & Issues${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Document any issues reported by pilot users"
echo ""

read -p "Number of issues reported (enter number): " ISSUE_COUNT

if [[ "$ISSUE_COUNT" =~ ^[0-9]+$ ]]; then
    echo ""
    if [[ $ISSUE_COUNT -eq 0 ]]; then
        echo -e "   ${GREEN}${CHECK} No issues reported${NC}"
        PASSED=$((PASSED + 1))
    elif [[ $ISSUE_COUNT -le 2 ]]; then
        echo -e "   ${GREEN}${CHECK} ${ISSUE_COUNT} minor issue(s) - acceptable${NC}"
        echo ""
        for ((i=1; i<=ISSUE_COUNT; i++)); do
            read -p "   Issue ${i} description: " ISSUE_DESC
            echo "      - ${ISSUE_DESC}"
        done
        PASSED=$((PASSED + 1))
    elif [[ $ISSUE_COUNT -le 5 ]]; then
        echo -e "   ${YELLOW}${WARN} ${ISSUE_COUNT} issues - requires review${NC}"
        echo ""
        for ((i=1; i<=ISSUE_COUNT; i++)); do
            read -p "   Issue ${i} description: " ISSUE_DESC
            echo "      - ${ISSUE_DESC}"
        done
        FAILED=$((FAILED + 1))
    else
        echo -e "   ${RED}${CROSS} ${ISSUE_COUNT} issues - high volume${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "   ${YELLOW}${WARN} Invalid input, marking as skipped${NC}"
    SKIPPED=$((SKIPPED + 1))
fi
echo ""

# ==============================================================================
# Section 5: Operational Metrics
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}5️⃣  Operational Metrics${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "Order processing time normal (no delays reported)?" \
    "Compare to pre-deployment baseline"

ask_check "Payment success rate >= 95%?" \
    "Check payment gateway metrics"

ask_check "No order sync issues between TPV/KDS/AppStaff?" \
    "Orders appear correctly across all modules"

ask_check "Staff productivity maintained or improved?" \
    "Subjective assessment from pilot feedback"

# ==============================================================================
# Section 6: Infrastructure Health
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}6️⃣  Infrastructure Health${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Check Vercel & Supabase dashboards"
echo ""

ask_check "Vercel: No deployment warnings or errors?" \
    "Check Deployments tab"

ask_check "Vercel: Bandwidth usage within expected range?" \
    "Analytics → Usage"

ask_check "Supabase: Database CPU < 80%?" \
    "Check Database > Metrics"

ask_check "Supabase: Connection pool still healthy?" \
    "Should remain < 90% utilization"

ask_check "Supabase: No database errors or deadlocks?" \
    "Check Logs for errors"

# ==============================================================================
# Decision Point
# ==============================================================================
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  📊 T+6H PILOT PHASE SUMMARY${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))
echo "   Checks passed:  ${GREEN}${PASSED}${NC} / ${TOTAL}"
echo "   Checks failed:  ${RED}${FAILED}${NC} / ${TOTAL}"
echo "   Checks skipped: ${YELLOW}${SKIPPED}${NC} / ${TOTAL}"
echo ""

if [[ ${#PILOT_NAMES[@]} -gt 0 ]]; then
    echo "   Pilot restaurants: ${PILOT_COUNT}"
    for restaurant in "${PILOT_NAMES[@]}"; do
        echo "      • ${restaurant}"
    done
    echo ""
fi

# Calculate failure rate
if [[ $TOTAL -gt 0 ]]; then
    FAIL_RATE=$(( (FAILED * 100) / TOTAL ))
else
    FAIL_RATE=0
fi

# GO/NO-GO Decision
echo -e "${BOLD}━━━ GO/NO-GO DECISION ━━━${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✅ GO - Approved for Full Rollout${NC}"
    echo ""
    echo "Pilot phase successful. All systems nominal."
    echo ""
    echo -e "${BOLD}Next steps:${NC}"
    echo "  1. Expand rollout to all restaurants"
    echo "  2. Continue monitoring for next 18 hours (T+24h)"
    echo "  3. Maintain support availability"
    echo "  4. Plan T+24h review meeting"
    echo ""
    echo "Documentation: docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md"
    echo ""
    echo -e "${GREEN}${BOLD}🎉 Pilot phase completed successfully!${NC}"
    echo ""
    exit 0
elif [[ $FAIL_RATE -lt 15 ]]; then
    echo -e "${YELLOW}${BOLD}⚠️  CONDITIONAL GO - Review and decide${NC}"
    echo ""
    echo "Pilot phase has minor issues (${FAIL_RATE}% failure rate)."
    echo ""
    echo "Review failed checks above carefully."
    echo ""
    read -p "Proceed to full rollout despite issues? (yes/no): " -r DECISION
    if [[ "$DECISION" =~ ^[Yy][Ee][Ss]$ ]]; then
        echo ""
        echo -e "${YELLOW}Proceeding to full rollout with caution...${NC}"
        echo ""
        echo -e "${BOLD}Action items:${NC}"
        echo "  1. Document all known issues"
        echo "  2. Monitor closely during T+6h → T+24h"
        echo "  3. Prepare hotfix if needed"
        echo ""
        exit 0
    else
        echo ""
        echo -e "${YELLOW}Full rollout paused by operator${NC}"
        echo ""
        echo -e "${BOLD}Recommended actions:${NC}"
        echo "  1. Address failed checks"
        echo "  2. Extend pilot phase"
        echo "  3. Re-run checklist after fixes"
        echo ""
        exit 1
    fi
else
    echo -e "${RED}${BOLD}❌ NO-GO - PAUSE ROLLOUT${NC}"
    echo ""
    echo "Failure rate: ${FAIL_RATE}% (threshold: 15%)"
    echo ""
    echo -e "${BOLD}${RED}⚠️  DO NOT proceed to full rollout${NC}"
    echo ""
    echo -e "${BOLD}Immediate actions:${NC}"
    echo "  1. Review all failed checks above"
    echo "  2. Investigate root causes"
    echo "  3. Consider rollback if critical issues"
    echo "  4. Fix issues before expanding rollout"
    echo ""
    echo -e "${BOLD}Rollback command:${NC}"
    echo "  $ vercel rollback"
    echo ""
    echo "Contact support team for incident response."
    echo ""
    exit 1
fi
