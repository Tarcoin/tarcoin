#!/usr/bin/env bash
# TARCOIN — Discord Alert Helper
# Source this file in other scripts: source devops/monitoring/discord-alerts.sh

DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-${DISCORD_WEBHOOK:-}}"
DISCORD_COOLDOWN_DIR="/tmp/tarcoin_discord_cooldown"
DISCORD_COOLDOWN_SECS=300  # 5 minutes

mkdir -p "$DISCORD_COOLDOWN_DIR"

# send_alert LEVEL SERVICE MESSAGE
# LEVEL: INFO | WARNING | CRITICAL
send_alert() {
  local level="${1:-INFO}"
  local service="${2:-unknown}"
  local message="${3:-}"
  local hostname; hostname=$(hostname -s)
  local env="${TARCOIN_ENV:-production}"

  # Cooldown check — don't spam same alert within 5 minutes
  local cooldown_key; cooldown_key=$(echo "${level}${service}${message}" | md5sum | cut -d' ' -f1)
  local cooldown_file="$DISCORD_COOLDOWN_DIR/$cooldown_key"
  if [[ -f "$cooldown_file" ]]; then
    local last_sent; last_sent=$(cat "$cooldown_file")
    local now; now=$(date +%s)
    if (( now - last_sent < DISCORD_COOLDOWN_SECS )); then
      return 0  # still in cooldown
    fi
  fi
  date +%s > "$cooldown_file"

  # Color by level
  local color
  case "$level" in
    INFO)     color=3447003  ;;   # blue
    WARNING)  color=16776960 ;;   # yellow
    CRITICAL) color=15158332 ;;   # red
    *)        color=9807270  ;;   # grey
  esac

  # Icon
  local icon
  case "$level" in
    INFO)     icon="ℹ️" ;;
    WARNING)  icon="⚠️" ;;
    CRITICAL) icon="🚨" ;;
    *)        icon="📢" ;;
  esac

  [[ -z "$DISCORD_WEBHOOK_URL" ]] && return 0

  local payload
  payload=$(cat <<EOF
{
  "embeds": [{
    "title": "$icon TARCOIN [$level] — $service",
    "description": "$message",
    "color": $color,
    "fields": [
      {"name": "Environment", "value": "$env", "inline": true},
      {"name": "Host", "value": "\`$hostname\`", "inline": true},
      {"name": "Service", "value": "\`$service\`", "inline": true}
    ],
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "footer": {"text": "TARCOIN DevOps"}
  }]
}
EOF
)

  curl -sf -X POST "$DISCORD_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "$payload" \
    >/dev/null 2>&1 || true
}

# Convenience wrappers
info()     { send_alert "INFO"     "${1:-}" "${2:-}"; }
warning()  { send_alert "WARNING"  "${1:-}" "${2:-}"; }
critical() { send_alert "CRITICAL" "${1:-}" "${2:-}"; }
