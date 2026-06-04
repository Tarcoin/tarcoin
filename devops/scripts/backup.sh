#!/usr/bin/env bash
# TARCOIN — Backup Script
# Usage: bash devops/scripts/backup.sh [--restore <file>]
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*" | tee -a /var/log/tarcoin/backup.log; }
ok()   { echo -e "${GREEN}✓${NC} $*" | tee -a /var/log/tarcoin/backup.log; }
warn() { echo -e "${YELLOW}⚠${NC} $*" | tee -a /var/log/tarcoin/backup.log; }
die()  { echo -e "${RED}✗ $*${NC}" >&2; exit 1; }

BACKUP_DIR=/var/backups/tarcoin
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_NAME="tarcoin-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
KEEP_DAYS=7
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# ── Restore mode ───────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--restore" ]]; then
  RESTORE_FILE="${2:-}"
  [[ -f "$RESTORE_FILE" ]] || die "Restore file not found: $RESTORE_FILE"
  log "Restoring from $RESTORE_FILE..."
  RESTORE_DIR=$(mktemp -d)
  tar -xzf "$RESTORE_FILE" -C "$RESTORE_DIR"
  log "Stopping services..."
  cd "$PROJECT_ROOT/docker" && docker compose stop || true
  log "Restoring blockchain data..."
  docker run --rm -v tarcoin-data:/data -v "$RESTORE_DIR":/backup \
    ubuntu:22.04 bash -c "rm -rf /data/* && tar -xzf /backup/blockchain.tar.gz -C /data" || warn "Blockchain restore skipped"
  log "Restoring PostgreSQL..."
  if [[ -f "$RESTORE_DIR/postgres.sql" ]]; then
    docker compose -f "$PROJECT_ROOT/docker/docker-compose.yml" start postgres
    sleep 5
    docker exec tarcoin-postgres psql -U tarcoin -d tarcoin < "$RESTORE_DIR/postgres.sql" || warn "Postgres restore failed"
  fi
  log "Restoring .env files..."
  [[ -f "$RESTORE_DIR/docker.env" ]] && cp "$RESTORE_DIR/docker.env" "$PROJECT_ROOT/docker/.env"
  rm -rf "$RESTORE_DIR"
  cd "$PROJECT_ROOT/docker" && docker compose up -d
  ok "Restore complete! Services restarting..."
  exit 0
fi

# ── Backup mode ────────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_PATH" "$BACKUP_DIR"
START_TIME=$(date +%s)
log "=== TARCOIN Backup — $TIMESTAMP ==="

# Blockchain data
log "Backing up blockchain data volume..."
docker run --rm -v tarcoin-data:/data -v "$BACKUP_PATH":/backup \
  ubuntu:22.04 tar -czf /backup/blockchain.tar.gz -C /data . \
  && ok "Blockchain data backed up" \
  || warn "Blockchain backup skipped (Docker volume may not exist)"

# PostgreSQL
log "Backing up PostgreSQL..."
if docker ps --format '{{.Names}}' | grep -q tarcoin-postgres; then
  docker exec tarcoin-postgres pg_dump -U tarcoin tarcoin > "$BACKUP_PATH/postgres.sql" \
    && ok "PostgreSQL backed up ($(wc -c < "$BACKUP_PATH/postgres.sql" | numfmt --to=iec))" \
    || warn "PostgreSQL backup failed"
else
  warn "PostgreSQL container not running — skipping"
fi

# Redis
log "Backing up Redis..."
if docker ps --format '{{.Names}}' | grep -q tarcoin-redis; then
  docker exec tarcoin-redis redis-cli BGSAVE > /dev/null
  sleep 2
  docker cp tarcoin-redis:/data/dump.rdb "$BACKUP_PATH/redis.rdb" 2>/dev/null \
    && ok "Redis backed up" || warn "Redis backup skipped"
fi

# Config files
log "Backing up config files..."
[[ -f "$PROJECT_ROOT/docker/.env" ]]       && cp "$PROJECT_ROOT/docker/.env" "$BACKUP_PATH/docker.env"
[[ -f "$PROJECT_ROOT/explorer/.env" ]]     && cp "$PROJECT_ROOT/explorer/.env" "$BACKUP_PATH/explorer.env"
[[ -f "$PROJECT_ROOT/api/.env" ]]          && cp "$PROJECT_ROOT/api/.env" "$BACKUP_PATH/api.env"
[[ -f "$PROJECT_ROOT/mining_pool/.env" ]]  && cp "$PROJECT_ROOT/mining_pool/.env" "$BACKUP_PATH/pool.env"
ok "Config files backed up"

# Compress
log "Compressing backup..."
ARCHIVE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
tar -czf "$ARCHIVE" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"
SIZE=$(du -h "$ARCHIVE" | cut -f1)
ok "Backup compressed: $ARCHIVE ($SIZE)"

# Upload to S3
if [[ -n "${AWS_S3_BUCKET:-}" ]] && command -v aws &>/dev/null; then
  log "Uploading to S3 bucket: $AWS_S3_BUCKET..."
  aws s3 cp "$ARCHIVE" "s3://${AWS_S3_BUCKET}/backups/${BACKUP_NAME}.tar.gz" \
    && ok "Uploaded to S3" || warn "S3 upload failed"
fi

# Prune old backups
log "Pruning backups older than $KEEP_DAYS days..."
find "$BACKUP_DIR" -name "tarcoin-backup-*.tar.gz" -mtime "+$KEEP_DAYS" -delete
REMAINING=$(find "$BACKUP_DIR" -name "tarcoin-backup-*.tar.gz" | wc -l)
ok "Kept $REMAINING local backups"

DURATION=$(( $(date +%s) - START_TIME ))
log "=== Backup complete in ${DURATION}s ==="
