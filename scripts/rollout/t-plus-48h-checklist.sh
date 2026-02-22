#!/usr/bin/env bash
# T+48h Stabilization Review Checklist
# Final review and rollout completion report
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
echo -e "${BOLD}  🏁 T+48H STABILIZATION REVIEW${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REVIEW_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
echo "   Review started: ${REVIEW_TIME}"
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
# Section 1: Overall Rollout Health
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}1️⃣  Overall Rollout Health (48h Window)${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "Average error rate < 1% over 48 hours?" \
    "Sentry Issues → 48h timeframe"

ask_check "Error rate trend stable or decreasing?" \
    "No upward trend in errors"

ask_check "Browser-block enforcement: Zero bypasses in 48h?" \
    "CRITICAL: Maintained 100% for entire period"

ask_check "No unresolved critical errors?" \
    "All critical issues fixed or have mitigation"

ask_check "User adoption rate meets expectations?" \
    "Check active users vs. target"

# ==============================================================================
# Section 2: Performance Review
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}2️⃣  Performance Review${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Review 48h aggregate performance metrics"
echo ""

ask_check "LCP p75 maintained < 2.5s consistently?" \
    "Vercel Analytics → Core Web Vitals trend"

ask_check "No performance degradation vs. baseline?" \
    "Compare to pre-deployment metrics"

ask_check "API response times stable or improved?" \
    "Sentry Performance → Backend transactions"

ask_check "Infrastructure resources within normal range?" \
    "CPU, memory, DB connections all healthy"

# ==============================================================================
# Section 3: Business Impact
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}3️⃣  Business Impact${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "Order volume maintained or increased?" \
    "Compare to 48h before deployment"

ask_check "Payment success rate >= 95% sustained?" \
    "No drop in payment completions"

ask_check "No reported revenue loss from system issues?" \
    "Financial metrics stable"

ask_check "Customer satisfaction maintained or improved?" \
    "Review feedback and support sentiment"

# ==============================================================================
# Section 4: Incident Summary
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}4️⃣  Incident Summary${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Total incidents during rollout (0 if none): " INCIDENT_COUNT

if [[ "$INCIDENT_COUNT" =~ ^[0-9]+$ ]]; then
    echo ""
    if [[ $INCIDENT_COUNT -eq 0 ]]; then
        echo -e "   ${GREEN}${CHECK} Zero incidents - clean rollout!${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "   ${YELLOW}${INFO} ${INCIDENT_COUNT} incident(s) occurred${NC}"
        echo ""
        echo "Document each incident:"
        echo ""
        for ((i=1; i<=INCIDENT_COUNT; i++)); do
            echo -e "${BOLD}Incident ${i}:${NC}"
            read -p "  Description: " INC_DESC
            read -p "  Severity (low/medium/high/critical): " INC_SEV
            read -p "  Resolution status (resolved/monitoring/pending): " INC_STATUS
            echo ""
        done

        if [[ $INCIDENT_COUNT -le 2 ]]; then
            PASSED=$((PASSED + 1))
        else
            FAILED=$((FAILED + 1))
        fi
    fi
else
    echo -e "   ${YELLOW}${WARN} Invalid input, marking as skipped${NC}"
    SKIPPED=$((SKIPPED + 1))
fi
echo ""

# ==============================================================================
# Section 5: Lessons Learned
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}5️⃣  Lessons Learned${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Document key learnings from rollout:"
echo ""

read -p "What went well? (enter description): " WENT_WELL
echo "   ✅ ${WENT_WELL}"
echo ""

read -p "What could be improved? (enter description): " IMPROVE
echo "   📝 ${IMPROVE}"
echo ""

read -p "Process changes for next rollout? (enter description): " PROCESS
echo "   🔄 ${PROCESS}"
echo ""

PASSED=$((PASSED + 1))

# ==============================================================================
# Section 6: Documentation & Closeout
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}6️⃣  Documentation & Closeout${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "All deployment logs archived?" \
    "Save logs for future reference"

ask_check "Monitoring dashboards configured for ongoing use?" \
    "Sentry, Vercel Analytics operational"

ask_check "Support team returned to normal operations?" \
    "No longer in standby mode"

ask_check "Post-deployment report documented?" \
    "Summary for stakeholders"

ask_check "Any hotfixes applied during rollout documented?" \
    "Track all changes made post-deployment"

# ==============================================================================
# Final Report Generation
# ==============================================================================
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  📋 GENERATING T+48H REPORT${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REPORT_FILE="/tmp/t-plus-48h-report-$(date +%Y%m%d-%H%M%S).txt"

cat > "$REPORT_FILE" <<EOF
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         T+48H STABILIZATION REVIEW REPORT                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Review Date: ${REVIEW_TIME}

━━━ SUMMARY ━━━

Checks Passed:  ${PASSED}
Checks Failed:  ${FAILED}
Checks Skipped: ${SKIPPED}

━━━ INCIDENTS ━━━

Total Incidents: ${INCIDENT_COUNT:-0}

━━━ LESSONS LEARNED ━━━

What Went Well:
${WENT_WELL:-Not provided}

Areas for Improvement:
${IMPROVE:-Not provided}

Process Changes:
${PROCESS:-Not provided}

━━━ RECOMMENDATIONS ━━━

EOF

TOTAL=$((PASSED + FAILED + SKIPPED))

if [[ $TOTAL -gt 0 ]]; then
    FAIL_RATE=$(( (FAILED * 100) / TOTAL ))
else
    FAIL_RATE=0
fi

# Add recommendation to report
if [[ $FAILED -eq 0 ]]; then
    cat >> "$REPORT_FILE" <<EOF
✅ ROLLOUT SUCCESSFUL

The deployment has been stable for 48 hours with no critical issues.
All metrics within acceptable thresholds. Rollout complete.

Next Actions:
- Return to normal development cycle
- Apply learnings to future rollouts
- Continue routine monitoring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report generated by: scripts/rollout/t-plus-48h-checklist.sh
EOF
    ROLLOUT_STATUS="SUCCESS"
elif [[ $FAIL_RATE -lt 10 ]]; then
    cat >> "$REPORT_FILE" <<EOF
⚠️  ROLLOUT STABLE WITH MINOR ISSUES

Minor issues detected (${FAIL_RATE}% failure rate), but overall stable.
Continue monitoring and address remaining issues.

Next Actions:
- Track open issues to resolution
- Continue standard monitoring
- Document resolutions for future reference

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report generated by: scripts/rollout/t-plus-48h-checklist.sh
EOF
    ROLLOUT_STATUS="STABLE_WITH_ISSUES"
else
    cat >> "$REPORT_FILE" <<EOF
❌ ROLLOUT REQUIRES ATTENTION

Significant issues detected (${FAIL_RATE}% failure rate).
Extended monitoring and corrective actions required.

Next Actions:
- Address all failed checks immediately
- Plan corrective deployment if needed
- Schedule follow-up review in 24h

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report generated by: scripts/rollout/t-plus-48h-checklist.sh
EOF
    ROLLOUT_STATUS="REQUIRES_ATTENTION"
fi

echo "   Report saved to: ${REPORT_FILE}"
echo ""

# Display report
cat "$REPORT_FILE"

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  🎯 FINAL STATUS${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

case "$ROLLOUT_STATUS" in
    "SUCCESS")
        echo -e "${GREEN}${BOLD}✅ ROLLOUT COMPLETE - SUCCESS${NC}"
        echo ""
        echo "The production rollout has been successfully completed."
        echo "All systems stable and operating within parameters."
        echo ""
        echo -e "${BOLD}Congratulations to the team! 🎉${NC}"
        echo ""
        exit 0
        ;;
    "STABLE_WITH_ISSUES")
        echo -e "${YELLOW}${BOLD}⚠️  ROLLOUT COMPLETE - STABLE WITH ISSUES${NC}"
        echo ""
        echo "The rollout is operational but has minor issues to address."
        echo "Continue monitoring and resolve outstanding items."
        echo ""
        exit 0
        ;;
    "REQUIRES_ATTENTION")
        echo -e "${RED}${BOLD}❌ ROLLOUT REQUIRES ATTENTION${NC}"
        echo ""
        echo "Significant issues detected during rollout period."
        echo "Extended monitoring and corrective actions required."
        echo ""
        echo -e "${BOLD}Action required:${NC}"
        echo "  1. Review all failed checks"
        echo "  2. Plan corrective measures"
        echo "  3. Schedule follow-up review"
        echo ""
        exit 1
        ;;
esac
