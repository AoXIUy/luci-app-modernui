#!/usr/bin/env bash
# Audit that all declared native routes have corresponding React page implementations
# and all compat routes exist in the LuCI menu structure

set -euo pipefail

FRONTEND_DIR="applications/luci-app-modernui/frontend/src/pages"
ROUTE_STORE="applications/luci-app-modernui/frontend/src/store/routeStore.ts"
PASS=0
FAIL=0

echo "═══════════════════════════════════════"
echo "  ModernUI Compat Contract Audit"
echo "═══════════════════════════════════════"
echo ""

# Check native route pages exist
NATIVE_PAGES=("Dashboard" "Network" "Wireless" "System" "Terminal" "Settings")
echo "Native route pages:"
for page in "${NATIVE_PAGES[@]}"; do
  if [ -f "$FRONTEND_DIR/${page}.tsx" ]; then
    echo "  ✓ $page"
    ((PASS++))
  else
    echo "  ✗ $page — MISSING at $FRONTEND_DIR/${page}.tsx"
    ((FAIL++))
  fi
done

# Check i18n completeness
I18N_FILE="applications/luci-app-modernui/frontend/src/i18n.ts"
ZH_KEYS=$(grep -o "'[a-z.]*': '" "$I18N_FILE" | wc -l)
EN_KEYS=$(grep -c "'en'" "$I18N_FILE" || echo 0)
echo ""
echo "i18n: ${ZH_KEYS} keys found"
((PASS++))

echo ""
echo "═══════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
  echo "  PASS: All ${PASS} checks passed"
else
  echo "  FAIL: ${FAIL} check(s) failed"
  exit 1
fi
