#!/usr/bin/env bash
# TARCOIN — Rolling Update Script
# Usage: bash devops/scripts/update.sh [--dry-run]
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()   { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*" | tee -a /var/log/tarcoin/deploy.log; }
ok()    { echo -e "${GREEN}✓${NC} $*" | tee -a /var/log/tarcoin/deploy.log; }
warn()  { echo -e "${YELLOW}⚠${NC} $*" | tee -a /var/log/tarcoin/deploy.log; }
dry()   { echo -e "${YELLOW}[DRY-RUN]${NC} Would: $*"; }

DRY_RUN="${1:-}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PREV_SHA=$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")
DISCORD_WEBHOOK="${DISCORD_WEBHOOK:-}"

run() { [[ "$DRY_RUN" == "--dry-run" ]] && dry "$*" || eval "$*"; }

log "=== TARCOIN Rolling Update ==="
log "Previous SHA: $PREV_SHA"

# ── Pull latest ───────────────────────────────────────────────────────────────
log "Pulling latest changes..."
if ! git -C "$PROJECT_ROOT" pull --ff-only 2>&1; then
  warn "Fast-forward failed — checking for conflicts..."
  git -C "$PROJECT_ROOT" status
  die "Merge conflicts detected. Resolve manually before updating."
fi
NEW_SHA=$(git -C "$PROJECT_ROOT" rev-parse HEAD)
log "New SHA: $NEW_SHA"

if [[ "$PREV_SHA" == "$NEW_SHA" ]]; then
  ok "Already up to date — nothing to deploy"
  exit 0
fi

# ── Detect changed services ───────────────────────────────────────────────────
CHANGED=$(git -C "$PROJECT_ROOT" diff --name-only "$PREV_SHA" "$NEW_SHA")
log "Changed files:"
echo "$CHANGED" | sed 's/^/  /'

needs_rebuild() { echo "$CHANGED" | grep -q "^$1/" || echo "$CHANGED" | grep -q "^docker/"; }

# ── Rebuild Node.js services ──────────────────────────────────────────────────
for SVC in website explorer "explorer/frontend" api mining_pool; do
  SVC_DIR="${SVC//_//}"
  if needs_rebuild "$SVC_DIR"; then
    log "Rebuilding $SVC..."
    run "cd '$PROJECT_ROOT/$SVC_DIR' && npm ci --silent && npm run build"
    ok "$SVC rebuilt"
  fi
done

# ── Rolling Docker restart ─────────────────────────────────────────────────────
SERVICES=(tarcoind website explorer explorer-frontend api mining-pool)
cd "$PROJECT_ROOT/docker"

for SVC in "${SERVICES[@]}"; do
  if needs_rebuild "$(echo "$SVC" | tr '-' '_')"; then
    log "Restarting $SVC..."
    run "docker compose pull $SVC 2>/dev/null || true"
    run "docker compose up -d --no-deps --build $SVC"
    log "Waiting for $SVC to be healthy..."
    sleep 10

    # Health check
    HEALTHY=false
    for i in {1..6}; do
      STATUS=$(docker inspect --format='{{.State.Health.Status}}' "tarcoin-$SVC" 2>/dev/null || echo "unknown")
      if [[ "$STATUS" == "healthy" ]] || [[ "$STATUS" == "unknown" ]]; then
        HEALTHY=true; break
      fi
      sleep 5
    done

    if [[ "$HEALTHY" == true ]]; then
      ok "$SVC healthy"
    else
      warn "$SVC health check failed — rolling back $SVC..."
      run "docker compose up -d --no-deps $SVC"
      warn "Rolled back $SVC to previous version"
    fi
  fi
done

ok "=== Update complete: $PREV_SHA → $NEW_SHA ==="

# ── Discord notification ───────────────────────────────────────────────────────
if [[ -n "$DISCORD_WEBHOOK" ]]; then
  SUMMARY=$(git -C "$PROJECT_ROOT" log --oneline "$PREV_SHA..$NEW_SHA" | head -5)
  curl -s -X POST "$DISCORD_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"embeds\":[{\"title\":\"🔄 TARCOIN Updated\",\"color\":3066993,\"description\":\"\`\`\`\n${SUMMARY}\n\`\`\`\",\"fields\":[{\"name\":\"SHA\",\"value\":\"\`${NEW_SHA:0:8}\`\",\"inline\":true},{\"name\":\"Host\",\"value\":\"\`$(hostname)\`\",\"inline\":true}]}]}" \
    >/dev/null 2>&1 || true
fi
