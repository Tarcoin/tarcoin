#!/usr/bin/env bash
# =============================================================================
# setup_ssl.sh — Generate Let's Encrypt TLS certificate for ElectrumX
# =============================================================================
# Usage:
#   sudo ./scripts/setup_ssl.sh electrum.tarcoin.org your@email.com
#
# What this does:
#   1. Installs certbot (if not present)
#   2. Obtains a free Let's Encrypt certificate for your domain
#   3. Copies the certificate to /etc/ssl/electrumx/
#   4. Installs an auto-renewal cron job
#   5. Reloads ElectrumX after renewal
#
# Requirements:
#   - Your domain (e.g. electrum.tarcoin.org) must point to this server's IP
#   - Port 80 must be open for the ACME challenge
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------
DOMAIN="${1:-}"
EMAIL="${2:-admin@tarcoin.org}"
SSL_DIR="/etc/ssl/electrumx"
CERTBOT_DIR="/etc/letsencrypt/live/$DOMAIN"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && error "Run as root: sudo ./scripts/setup_ssl.sh <domain> <email>"
[[ -z "$DOMAIN" ]] && error "Usage: $0 <domain> [email]"

info "Domain:  $DOMAIN"
info "Email:   $EMAIL"
info "SSL dir: $SSL_DIR"

# ---------------------------------------------------------------------------
# Step 1: Install certbot
# ---------------------------------------------------------------------------
if ! command -v certbot &>/dev/null; then
    info "Installing certbot..."
    apt-get update -qq
    apt-get install -y certbot
    success "certbot installed"
else
    success "certbot already installed"
fi

# ---------------------------------------------------------------------------
# Step 2: Obtain certificate (standalone mode)
# Port 80 must be free during this step.
# If nginx is running, stop it temporarily.
# ---------------------------------------------------------------------------
info "Obtaining Let's Encrypt certificate for $DOMAIN..."

# Stop nginx if running (temporarily — certbot needs port 80)
if systemctl is-active --quiet nginx 2>/dev/null; then
    info "Stopping nginx temporarily for ACME challenge..."
    systemctl stop nginx
    NGINX_WAS_RUNNING=true
else
    NGINX_WAS_RUNNING=false
fi

certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domain "$DOMAIN" \
    --preferred-challenges http

if [[ "$NGINX_WAS_RUNNING" == "true" ]]; then
    systemctl start nginx
    success "nginx restarted"
fi

success "Certificate obtained for $DOMAIN"

# ---------------------------------------------------------------------------
# Step 3: Copy certificate to ElectrumX SSL directory
# ---------------------------------------------------------------------------
info "Copying certificate to $SSL_DIR..."
mkdir -p "$SSL_DIR"
chmod 700 "$SSL_DIR"

cp "$CERTBOT_DIR/fullchain.pem" "$SSL_DIR/server.crt"
cp "$CERTBOT_DIR/privkey.pem"   "$SSL_DIR/server.key"

chmod 600 "$SSL_DIR/server.key"
chmod 644 "$SSL_DIR/server.crt"

# Make readable by electrumx user
chown electrumx:electrumx "$SSL_DIR/server.crt" "$SSL_DIR/server.key" 2>/dev/null || true

success "Certificate installed to $SSL_DIR"

# ---------------------------------------------------------------------------
# Step 4: Auto-renewal hook — copies renewed cert and reloads ElectrumX
# ---------------------------------------------------------------------------
info "Installing renewal deploy hook..."
HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
mkdir -p "$HOOK_DIR"

cat > "$HOOK_DIR/electrumx-tarcoin.sh" <<HOOK
#!/usr/bin/env bash
# Auto-renewal hook for ElectrumX TARCOIN
# Runs automatically after certbot renews the certificate

SSL_DIR="$SSL_DIR"
CERTBOT_DIR="$CERTBOT_DIR"

cp "\$CERTBOT_DIR/fullchain.pem" "\$SSL_DIR/server.crt"
cp "\$CERTBOT_DIR/privkey.pem"   "\$SSL_DIR/server.key"
chmod 600 "\$SSL_DIR/server.key"
chown electrumx:electrumx "\$SSL_DIR/server.crt" "\$SSL_DIR/server.key" 2>/dev/null || true

# Restart ElectrumX to pick up new certificate
systemctl restart electrumx-tarcoin || true
echo "ElectrumX TARCOIN: SSL certificate renewed and service restarted"
HOOK

chmod +x "$HOOK_DIR/electrumx-tarcoin.sh"
success "Renewal hook installed"

# ---------------------------------------------------------------------------
# Step 5: Add certbot renewal to cron (runs twice daily — Let's Encrypt standard)
# ---------------------------------------------------------------------------
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet") | crontab -
    success "certbot renewal cron job installed (runs twice daily)"
fi

# ---------------------------------------------------------------------------
# Verify
# ---------------------------------------------------------------------------
info "Verifying certificate..."
openssl x509 -in "$SSL_DIR/server.crt" -noout -subject -dates

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo -e " ${GREEN}SSL certificate setup complete!${NC}"
echo "============================================================"
echo ""
echo "  Certificate: $SSL_DIR/server.crt"
echo "  Private key: $SSL_DIR/server.key"
echo "  Auto-renews: twice daily via cron"
echo ""
echo "  Restart ElectrumX to use the new certificate:"
echo "    sudo systemctl restart electrumx-tarcoin"
echo ""
echo "  Test your server with:"
echo "    openssl s_client -connect $DOMAIN:50002"
echo ""
