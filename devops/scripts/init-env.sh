#!/usr/bin/env bash
# TARCOIN — Environment Initialization Script
# Run this before first docker compose up
# Usage: bash devops/scripts/init-env.sh
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
log()    { echo -e "${CYAN}[init]${NC} $*"; }
ok()     { echo -e "${GREEN}✓${NC} $*"; }
warn()   { echo -e "${YELLOW}⚠${NC} $*"; }
prompt() { echo -e "${BOLD}$*${NC}"; }

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

gen_password() { LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*' < /dev/urandom | head -c 32; }

log "=== TARCOIN Environment Initialization ==="
echo ""

# ── docker/.env ───────────────────────────────────────────────────────────────
DOCKER_ENV="$PROJECT_ROOT/docker/.env"
if [[ ! -f "$DOCKER_ENV" ]]; then
  cp "$PROJECT_ROOT/docker/.env.example" "$DOCKER_ENV"
  log "Created docker/.env from template"
fi

# Generate secure passwords
POSTGRES_PASS=$(gen_password)
GRAFANA_PASS=$(gen_password)
RPC_PASS=$(gen_password)

# Prompt for required values
echo ""
prompt "Enter your TARCOIN pool wallet address (starts with tar1 or T):"
read -r POOL_WALLET
if [[ ! "$POOL_WALLET" =~ ^(tar1|T)[a-zA-Z0-9]{10,} ]]; then
  warn "Address looks invalid — proceeding anyway. Update docker/.env if needed."
fi

prompt "Enter your domain name [tarcoin.org]:"
read -r DOMAIN
DOMAIN="${DOMAIN:-tarcoin.org}"

prompt "Enter Discord webhook URL for alerts (leave blank to skip):"
read -r DISCORD_WEBHOOK

# Write to docker/.env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASS}|" "$DOCKER_ENV"
sed -i "s|^GRAFANA_PASSWORD=.*|GRAFANA_PASSWORD=${GRAFANA_PASS}|" "$DOCKER_ENV"
sed -i "s|^RPC_PASSWORD=.*|RPC_PASSWORD=${RPC_PASS}|" "$DOCKER_ENV"
sed -i "s|^POOL_WALLET=.*|POOL_WALLET=${POOL_WALLET}|" "$DOCKER_ENV"
sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN}|" "$DOCKER_ENV"
sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://api.${DOMAIN}|" "$DOCKER_ENV"
sed -i "s|^NEXT_PUBLIC_EXPLORER_URL=.*|NEXT_PUBLIC_EXPLORER_URL=https://explorer.${DOMAIN}|" "$DOCKER_ENV"
sed -i "s|^NEXT_PUBLIC_POOL_URL=.*|NEXT_PUBLIC_POOL_URL=https://pool.${DOMAIN}|" "$DOCKER_ENV"
[[ -n "$DISCORD_WEBHOOK" ]] && echo "DISCORD_WEBHOOK=${DISCORD_WEBHOOK}" >> "$DOCKER_ENV"
ok "docker/.env configured"

# ── Service .env files ─────────────────────────────────────────────────────────
for DIR in explorer api mining_pool; do
  ENV_FILE="$PROJECT_ROOT/$DIR/.env"
  EXAMPLE="$PROJECT_ROOT/$DIR/.env.example"
  if [[ ! -f "$ENV_FILE" ]] && [[ -f "$EXAMPLE" ]]; then
    cp "$EXAMPLE" "$ENV_FILE"
    sed -i "s|^RPC_PASS=.*|RPC_PASS=${RPC_PASS}|" "$ENV_FILE" 2>/dev/null || true
    sed -i "s|^RPC_PASSWORD=.*|RPC_PASSWORD=${RPC_PASS}|" "$ENV_FILE" 2>/dev/null || true
    ok "$DIR/.env created"
  else
    ok "$DIR/.env already exists — skipped"
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  Environment Initialized!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "  Generated passwords:"
echo "  PostgreSQL: ${POSTGRES_PASS}"
echo "  Grafana:    ${GRAFANA_PASS}"
echo "  RPC:        ${RPC_PASS}"
echo ""
echo "  ⚠ Save these passwords — they won't be shown again"
echo "  📁 Full config: $DOCKER_ENV"
echo ""
echo "  Next steps:"
echo "  1. bash devops/scripts/ssl-setup.sh   (or --staging for dev)"
echo "  2. cd docker && docker compose up -d"
echo ""
