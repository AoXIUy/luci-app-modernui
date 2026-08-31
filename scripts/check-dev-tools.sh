#!/usr/bin/env bash
# Check required development tools are installed

set -euo pipefail

PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  if command -v "$cmd" &>/dev/null; then
    echo "  ✓ $name ($("$cmd" --version 2>&1 | head -1))"
    ((PASS++))
  else
    echo "  ✗ $name — NOT FOUND"
    ((FAIL++))
  fi
}

echo "═══════════════════════════════════════"
echo "  ModernUI Dev Tools Check"
echo "═══════════════════════════════════════"
echo ""
echo "Required:"
check "Node.js" node
check "npm" npm
check "git" git
check "make" make

echo ""
echo "Optional (improve DX):"
check "jq" jq
check "curl" curl
check "gh (GitHub CLI)" gh
check "ucode" ucode

echo ""
echo "═══════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
  echo "  All required tools present! (${PASS} checks passed)"
else
  echo "  FAIL: ${FAIL} required tool(s) missing"
  exit 1
fi
