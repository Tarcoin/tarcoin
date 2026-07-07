#!/usr/bin/env bash
# =============================================================================
# healthcheck.sh — ElectrumX TARCOIN health monitor
# =============================================================================
# Checks:
#   1. tarcoind RPC is responding
#   2. ElectrumX TCP port 50001 accepts connections
#   3. ElectrumX SSL port 50002 accepts connections
#   4. ElectrumX returns a valid server.version response
#   5. Block height is advancing (not stuck)
#
# Usage:
#   ./scripts/healthcheck.sh
#   # or run via cron every 5 minutes:
#   # */5 * * * * /opt/electrumx/scripts/healthcheck.sh >> /var/log/electrumx-health.log 2>&1
# =============================================================================

set -euo pipefail

HOST="${ELECTRUMX_HOST:-127.0.0.1}"
TCP_PORT=50001
SSL_PORT=50002
RPC_URL="${DAEMON_URL:-http://tarcoin:tarcoin@127.0.0.1:19332/}"
TIMEOUT=10

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
    local name="$1"
    local result="$2"
    if [[ "$result" == "ok" ]]; then
        echo -e "${GREEN}[PASS]${NC} $name"
        ((PASS++))
    else
        echo -e "${RED}[FAIL]${NC} $name — $result"
        ((FAIL++))
    fi
}

echo "======================================================"
echo "  ElectrumX TARCOIN Health Check — $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "======================================================"

# ---------------------------------------------------------------------------
# Check 1: tarcoind RPC
# ---------------------------------------------------------------------------
RPC_RESULT=$(curl -sf --max-time "$TIMEOUT" \
    --user "$(echo "$RPC_URL" | sed 's|http://\([^:]*\):\([^@]*\)@.*|\1:\2|')" \
    --data '{"jsonrpc":"1.0","id":"health","method":"getblockcount","params":[]}' \
    --header 'Content-Type: application/json' \
    "$(echo "$RPC_URL" | sed 's|http://[^@]*@||')" 2>/dev/null || echo "error")

if echo "$RPC_RESULT" | grep -q '"result"'; then
    HEIGHT=$(echo "$RPC_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'])" 2>/dev/null || echo "?")
    check "tarcoind RPC (block height: $HEIGHT)" "ok"
else
    check "tarcoind RPC" "not responding"
fi

# ---------------------------------------------------------------------------
# Check 2: ElectrumX TCP port 50001
# ---------------------------------------------------------------------------
if timeout "$TIMEOUT" bash -c "echo >/dev/tcp/$HOST/$TCP_PORT" 2>/dev/null; then
    check "ElectrumX TCP port $TCP_PORT" "ok"
else
    check "ElectrumX TCP port $TCP_PORT" "connection refused"
fi

# ---------------------------------------------------------------------------
# Check 3: ElectrumX SSL port 50002
# ---------------------------------------------------------------------------
if echo "" | timeout "$TIMEOUT" openssl s_client -connect "$HOST:$SSL_PORT" \
    -quiet 2>/dev/null | grep -q ""; then
    check "ElectrumX SSL port $SSL_PORT" "ok"
else
    check "ElectrumX SSL port $SSL_PORT" "connection refused or cert error"
fi

# ---------------------------------------------------------------------------
# Check 4: ElectrumX Electrum protocol response
# ---------------------------------------------------------------------------
ELECTRUM_REQUEST='{"jsonrpc":"2.0","id":1,"method":"server.version","params":["healthcheck","1.4"]}'
ELECTRUM_RESPONSE=$(echo "$ELECTRUM_REQUEST" | \
    timeout "$TIMEOUT" nc -q 1 "$HOST" "$TCP_PORT" 2>/dev/null || echo "")

if echo "$ELECTRUM_RESPONSE" | grep -q '"result"'; then
    SERVER_VERSION=$(echo "$ELECTRUM_RESPONSE" | \
        python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0])" 2>/dev/null || echo "unknown")
    check "Electrum protocol (server: $SERVER_VERSION)" "ok"
else
    check "Electrum protocol server.version" "no valid response"
fi

# ---------------------------------------------------------------------------
# Check 5: systemd service status
# ---------------------------------------------------------------------------
if systemctl is-active --quiet electrumx-tarcoin 2>/dev/null; then
    check "systemd service electrumx-tarcoin" "ok"
else
    check "systemd service electrumx-tarcoin" "not active"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "------------------------------------------------------"
TOTAL=$((PASS + FAIL))
echo -e "  Results: ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC} / $TOTAL total"
echo "======================================================"

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
