#!/usr/bin/env bash
# Sentry Alert Configuration Script
# Automates creation of critical alert rules via Sentry API
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
echo -e "${BOLD}  🔔 SENTRY ALERT CONFIGURATION${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ==============================================================================
# Load Sentry Configuration
# ==============================================================================
echo "1️⃣  Loading Sentry configuration..."
echo ""

SENTRY_CONFIG_FILE=".sentry/config.json"

if [[ ! -f "$SENTRY_CONFIG_FILE" ]]; then
    echo -e "${RED}${CROSS} Sentry config not found: ${SENTRY_CONFIG_FILE}${NC}"
    echo ""
    echo "Run Sentry setup first:"
    echo "  $ bash scripts/monitoring/setup-sentry.sh"
    echo ""
    exit 1
fi

SENTRY_ORG=$(jq -r '.org' "$SENTRY_CONFIG_FILE")
SENTRY_PROJECT=$(jq -r '.project' "$SENTRY_CONFIG_FILE")

echo "   Organization: ${SENTRY_ORG}"
echo "   Project:      ${SENTRY_PROJECT}"
echo ""

# Check for auth token
if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
    echo -e "${YELLOW}${WARN} SENTRY_AUTH_TOKEN not set in environment${NC}"
    echo ""
    read -sp "Enter Sentry Auth Token: " SENTRY_AUTH_TOKEN
    echo ""
    echo ""
fi

# ==============================================================================
# Test API Connection
# ==============================================================================
echo "2️⃣  Testing Sentry API connection..."
echo ""

API_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" \
    "https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/")

if [[ "$API_TEST" == "200" ]]; then
    echo -e "   ${GREEN}${CHECK} Connected to Sentry API${NC}"
    echo ""
else
    echo -e "   ${RED}${CROSS} Failed to connect to Sentry API (HTTP ${API_TEST})${NC}"
    echo ""
    echo "Check auth token and project configuration."
    exit 1
fi

# ==============================================================================
# Helper Function: Create Alert Rule
# ==============================================================================
create_alert_rule() {
    local rule_name="$1"
    local rule_json="$2"

    echo "   Creating: ${rule_name}"

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "$rule_json" \
        "https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/rules/")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [[ "$HTTP_CODE" == "201" ]] || [[ "$HTTP_CODE" == "200" ]]; then
        RULE_ID=$(echo "$BODY" | jq -r '.id // "unknown"')
        echo -e "      ${GREEN}${CHECK} Created (ID: ${RULE_ID})${NC}"
        return 0
    elif [[ "$HTTP_CODE" == "409" ]]; then
        echo -e "      ${YELLOW}${WARN} Already exists${NC}"
        return 0
    else
        echo -e "      ${RED}${CROSS} Failed (HTTP ${HTTP_CODE})${NC}"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        return 1
    fi
}

# ==============================================================================
# Alert 1: High Error Rate
# ==============================================================================
echo ""
echo -e "${BOLD}3️⃣  Creating Alert Rules${NC}"
echo ""
echo -e "${BOLD}Alert 1: High Error Rate${NC}"

ALERT_1_JSON='{
  "name": "High Error Rate (> 5% in 1 hour)",
  "actionMatch": "all",
  "filterMatch": "all",
  "conditions": [
    {
      "id": "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
      "interval": "1h",
      "value": 50,
      "comparisonType": "percent"
    }
  ],
  "filters": [
    {
      "id": "sentry.rules.filters.level.LevelFilter",
      "match": "gte",
      "level": "40"
    }
  ],
  "actions": [
    {
      "id": "sentry.mail.actions.NotifyEmailAction",
      "targetType": "IssueOwners"
    }
  ],
  "frequency": 30
}'

create_alert_rule "High Error Rate" "$ALERT_1_JSON"
echo ""

# ==============================================================================
# Alert 2: New Unhandled Error
# ==============================================================================
echo -e "${BOLD}Alert 2: New Unhandled Error${NC}"

ALERT_2_JSON='{
  "name": "New Unhandled Error (First Seen)",
  "actionMatch": "all",
  "filterMatch": "all",
  "conditions": [
    {
      "id": "sentry.rules.conditions.first_seen_event.FirstSeenEventCondition"
    }
  ],
  "filters": [
    {
      "id": "sentry.rules.filters.level.LevelFilter",
      "match": "eq",
      "level": "50"
    }
  ],
  "actions": [
    {
      "id": "sentry.mail.actions.NotifyEmailAction",
      "targetType": "IssueOwners"
    }
  ],
  "frequency": 5
}'

create_alert_rule "New Unhandled Error" "$ALERT_2_JSON"
echo ""

# ==============================================================================
# Alert 3: Performance Degradation
# ==============================================================================
echo -e "${BOLD}Alert 3: Performance Degradation${NC}"

ALERT_3_JSON='{
  "name": "Performance Degradation (p95 > 3s)",
  "actionMatch": "all",
  "filterMatch": "all",
  "conditions": [
    {
      "id": "sentry.rules.conditions.event_attribute.EventAttributeCondition",
      "attribute": "transaction.duration",
      "match": "gt",
      "value": "3000"
    }
  ],
  "filters": [],
  "actions": [
    {
      "id": "sentry.mail.actions.NotifyEmailAction",
      "targetType": "IssueOwners"
    }
  ],
  "frequency": 30
}'

create_alert_rule "Performance Degradation" "$ALERT_3_JSON"
echo ""

# ==============================================================================
# Alert 4: Browser Block Bypass (Custom Tag)
# ==============================================================================
echo -e "${BOLD}Alert 4: Browser Block Bypass${NC}"

ALERT_4_JSON='{
  "name": "Browser Block Bypass Detected",
  "actionMatch": "all",
  "filterMatch": "all",
  "conditions": [
    {
      "id": "sentry.rules.conditions.event_attribute.EventAttributeCondition",
      "attribute": "message",
      "match": "co",
      "value": "browser-block-bypass"
    }
  ],
  "filters": [],
  "actions": [
    {
      "id": "sentry.mail.actions.NotifyEmailAction",
      "targetType": "IssueOwners"
    }
  ],
  "frequency": 5
}'

create_alert_rule "Browser Block Bypass" "$ALERT_4_JSON"
echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  ✅ ALERT CONFIGURATION COMPLETE${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Alert rules configured in Sentry project: ${SENTRY_PROJECT}"
echo ""

echo -e "${BOLD}Configured Alerts:${NC}"
echo "  1. ⚠️  High Error Rate (> 5% in 1h) → Email"
echo "  2. 🆕 New Unhandled Error (First Seen) → Email"
echo "  3. 🐌 Performance Degradation (p95 > 3s) → Email"
echo "  4. 🚨 Browser Block Bypass → Immediate Email"
echo ""

echo -e "${BOLD}View alerts:${NC}"
echo "  https://sentry.io/organizations/${SENTRY_ORG}/alerts/rules/"
echo ""

echo -e "${BOLD}Next steps:${NC}"
echo "  1. Configure Slack integration for real-time notifications"
echo "  2. Add PagerDuty for critical alerts (if needed)"
echo "  3. Test alerts by triggering conditions in staging"
echo "  4. Adjust notification frequency based on volume"
echo ""

echo -e "${BOLD}Slack integration:${NC}"
echo "  https://sentry.io/organizations/${SENTRY_ORG}/integrations/"
echo ""

echo -e "${GREEN}${CHECK} Alert configuration complete!${NC}"
echo ""
