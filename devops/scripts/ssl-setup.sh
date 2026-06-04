#!/usr/bin/env bash
# TARCOIN — SSL Certificate Setup
# Usage: bash devops/scripts/ssl-setup.sh [--staging]
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
die()  { echo -e "${RED}✗ $*${NC}" >&2; exit 1; }

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SSL_DIR="$PROJECT_ROOT/docker/nginx/ssl"
STAGING="${1:-}"
DOMAINS=(tarcoin.org www.tarcoin.org explorer.tarcoin.org api.tarcoin.org pool.tarcoin.org)
EMAIL="${CERTBOT_EMAIL:-admin@tarcoin.org}"

mkdir -p "$SSL_DIR"

# ── Self-signed fallback (for dev/staging) ────────────────────────────────────
generate_self_signed() {
  log "Generating self-signed certificates for development..."
  for DOMAIN in "${DOMAINS[@]}"; do
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "$SSL_DIR/${DOMAIN}.key" \
      -out "$SSL_DIR/${DOMAIN}.crt" \
      -subj "/C=US/ST=Dev/L=Dev/O=TARCOIN/CN=${DOMAIN}" 2>/dev/null
    ok "Self-signed cert: $DOMAIN"
  done
  # Create combined cert for nginx
  cat "$SSL_DIR/tarcoin.org.crt" > "$SSL_DIR/combined.crt"
  ok "Self-signed certs ready in $SSL_DIR"
}

if [[ "$STAGING" == "--staging" ]] || [[ "$STAGING" == "--self-signed" ]]; then
  generate_self_signed
  exit 0
fi

# ── Production — Let's Encrypt ────────────────────────────────────────────────
command -v certbot &>/dev/null || die "Certbot not installed. Run: sudo apt install certbot"

log "=== TARCOIN SSL Setup — Let's Encrypt ==="
log "Domains: ${DOMAINS[*]}"
log "Email: $EMAIL"

# Stop nginx to free port 80
log "Stopping nginx temporarily..."
cd "$PROJECT_ROOT/docker"
docker compose stop nginx 2>/dev/null || true
sleep 2

# Get certificates
DOMAIN_FLAGS=""
for D in "${DOMAINS[@]}"; do DOMAIN_FLAGS="$DOMAIN_FLAGS -d $D"; done

log "Requesting certificates..."
certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  $DOMAIN_FLAGS \
  && ok "Certificates obtained!" \
  || { warn "Certbot failed — falling back to self-signed"; generate_self_signed; docker compose start nginx; exit 0; }

# Copy certs to docker/nginx/ssl/
log "Copying certificates..."
for DOMAIN in "${DOMAINS[@]}"; do
  CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
  if [[ -d "$CERT_DIR" ]]; then
    cp "$CERT_DIR/fullchain.pem" "$SSL_DIR/${DOMAIN}.crt"
    cp "$CERT_DIR/privkey.pem"   "$SSL_DIR/${DOMAIN}.key"
    ok "Cert copied: $DOMAIN"
  fi
done
# Main domain serves www too
[[ -f "$SSL_DIR/tarcoin.org.crt" ]] && cp "$SSL_DIR/tarcoin.org.crt" "$SSL_DIR/www.tarcoin.org.crt"
[[ -f "$SSL_DIR/tarcoin.org.key" ]] && cp "$SSL_DIR/tarcoin.org.key" "$SSL_DIR/www.tarcoin.org.key"

# Set up auto-renewal cron
log "Setting up auto-renewal cron job..."
CRON_CMD="0 3 * * * certbot renew --quiet && cd $PROJECT_ROOT/docker && docker compose restart nginx >> /var/log/tarcoin/certbot-renew.log 2>&1"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -
ok "Auto-renewal cron configured (daily 3am)"

# Start nginx back
docker compose start nginx
sleep 3

# Print expiry dates
log "Certificate expiry dates:"
for DOMAIN in tarcoin.org explorer.tarcoin.org api.tarcoin.org pool.tarcoin.org; do
  CERT="$SSL_DIR/${DOMAIN}.crt"
  if [[ -f "$CERT" ]]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "$CERT" | cut -d= -f2)
    echo "  $DOMAIN → $EXPIRY"
  fi
done
ok "=== SSL setup complete ==="
