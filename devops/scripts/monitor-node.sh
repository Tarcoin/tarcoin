#!/usr/bin/env bash
# TARCOIN — Node Monitor Script
# Usage: bash devops/scripts/monitor-node.sh [--daemon]
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()   { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*" | tee -a /var/log/tarcoin/node-metrics.log; }
alert() { echo -e "${RED}🚨 ALERT:${NC} $*" | tee -a /var/log/tarcoin/node-metrics.log; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }

RPC_URL="${RPC_URL:-http://127.0.0.1:19332}"
RPC_USER="${RPC_USER:-tarcoin}"
RPC_PASS="${RPC_PASS:-tarcoin}"
DISCORD_WEBHOOK="${DISCORD_WEBHOOK:-}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
METRICS_LOG=/var/log/tarcoin/node-metrics.log
FAIL_COUNT_FILE=/tmp/tarcoin_fail_count
LAST_HEIGHT_FILE=/tmp/tarcoin_last_height
LAST_HEIGHT_TIME_FILE=/tmp/tarcoin_last_height_time
POLL_INTERVAL=60
MAX_FAILS=3
STUCK_THRESHOLD=1200   # 20 minutes in seconds

mkdir -p /var/log/tarcoin

# ── RPC call helper ───────────────────────────────────────────────────────────
rpc() {
  curl -sf --max-time 10 \
    --user "${RPC_USER}:${RPC_PASS}" \
    "$RPC_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$1\",\"params\":${2:-[]}}" \
    2>/dev/null || echo "{}"
}

# ── Send alert ────────────────────────────────────────────────────────────────
send_alert() {
  local level="$1" msg="$2"
  log "[$level] $msg"
  if [[ -n "$DISCORD_WEBHOOK" ]]; then
    local color=15158332  # red
    [[ "$level" == "WARNING" ]] && color=16776960  # yellow
    [[ "$level" == "INFO"    ]] && color=3447003    # blue
    curl -s -X POST "$DISCORD_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"embeds\":[{\"title\":\"[$level] TARCOIN Node Alert\",\"description\":\"$msg\",\"color\":$color,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}]}" \
      >/dev/null 2>&1 || true
  fi
  if [[ -n "$ALERT_EMAIL" ]] && command -v sendmail &>/dev/null; then
    echo -e "Subject: [TARCOIN $level] $msg\n\n$msg" | sendmail "$ALERT_EMAIL" 2>/dev/null || true
  fi
}

# ── Single check tick ─────────────────────────────────────────────────────────
check_once() {
  FAIL_COUNT=$(cat "$FAIL_COUNT_FILE" 2>/dev/null || echo 0)

  # Check tarcoind RPC
  RESPONSE=$(rpc getblockchaininfo)
  BLOCKS=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',{}).get('blocks',0))" 2>/dev/null || echo "-1")

  if [[ "$BLOCKS" == "-1" ]]; then
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "$FAIL_COUNT" > "$FAIL_COUNT_FILE"
    alert "tarcoind RPC unreachable (attempt $FAIL_COUNT/$MAX_FAILS)"
    if [[ $FAIL_COUNT -ge $MAX_FAILS ]]; then
      send_alert "CRITICAL" "tarcoind unresponsive for ${FAIL_COUNT} consecutive checks — attempting restart"
      cd /opt/tarcoin/docker && docker compose restart tarcoind 2>/dev/null || \
        systemctl restart tarcoind 2>/dev/null || true
      echo 0 > "$FAIL_COUNT_FILE"
    fi
    return
  fi

  # Node is reachable — reset fail counter
  echo 0 > "$FAIL_COUNT_FILE"

  CONNECTIONS=$(echo "$RESPONSE"  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',{}).get('connections',0))" 2>/dev/null || echo 0)
  MEMPOOL_SIZE=$(rpc getmempoolinfo | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',{}).get('size',0))" 2>/dev/null || echo 0)
  DISK_USAGE=$(df /var/lib/docker/volumes 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%' || echo 0)

  # Write JSON metrics
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"blocks\":$BLOCKS,\"connections\":$CONNECTIONS,\"mempool\":$MEMPOOL_SIZE,\"disk_pct\":$DISK_USAGE}" \
    >> "$METRICS_LOG"

  ok "Height=$BLOCKS | Connections=$CONNECTIONS | Mempool=$MEMPOOL_SIZE | Disk=${DISK_USAGE}%"

  # ── Stuck block check ────────────────────────────────────────────────────────
  LAST_HEIGHT=$(cat "$LAST_HEIGHT_FILE" 2>/dev/null || echo 0)
  LAST_TIME=$(cat "$LAST_HEIGHT_TIME_FILE" 2>/dev/null || echo 0)
  NOW=$(date +%s)

  if [[ "$BLOCKS" -gt "$LAST_HEIGHT" ]]; then
    echo "$BLOCKS" > "$LAST_HEIGHT_FILE"
    echo "$NOW" > "$LAST_HEIGHT_TIME_FILE"
  else
    STUCK_FOR=$(( NOW - LAST_TIME ))
    if [[ $STUCK_FOR -gt $STUCK_THRESHOLD ]]; then
      send_alert "WARNING" "Block height stuck at $BLOCKS for $((STUCK_FOR/60)) minutes"
    fi
  fi

  # ── Other alerts ──────────────────────────────────────────────────────────────
  [[ $CONNECTIONS -lt 2 ]] && send_alert "WARNING" "Low peer connections: $CONNECTIONS"
  [[ $DISK_USAGE -gt 90 ]] && send_alert "CRITICAL" "Disk usage critical: ${DISK_USAGE}%"
  [[ $DISK_USAGE -gt 80 ]] && send_alert "WARNING" "Disk usage high: ${DISK_USAGE}%"
}

# ── Daemon mode ───────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--daemon" ]]; then
  log "=== TARCOIN Node Monitor — daemon mode (interval: ${POLL_INTERVAL}s) ==="
  while true; do
    check_once
    sleep "$POLL_INTERVAL"
  done
else
  check_once
fi
