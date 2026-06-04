#!/usr/bin/env bash
# =============================================================================
# TARCOIN – Server Setup Script
# Target OS : Ubuntu 22.04 LTS
# Run as    : root (or via sudo)
# Purpose   : Idempotent initial provisioning of a fresh VPS
# Usage     : bash devops/scripts/setup-server.sh
# =============================================================================
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }
section() { echo -e "\n${BOLD}${CYAN}══════ $* ══════${NC}"; }

# ── Guard: must run as root ───────────────────────────────────────────────────
[[ $EUID -eq 0 ]] || die "This script must be run as root. Try: sudo bash $0"

# ── Constants ─────────────────────────────────────────────────────────────────
TARCOIN_USER="tarcoin"
TARCOIN_HOME="/opt/tarcoin"
LOG_DIR="/var/log/tarcoin"
BACKUP_DIR="/backups/tarcoin"
GIT_REPO="git@github.com:tarcoin/tarcoin.git"
NODE_VERSION="20"
DOCKER_COMPOSE_VERSION="2.27.1"
LOG_FILE="${LOG_DIR}/setup.log"

# ── Logging ───────────────────────────────────────────────────────────────────
mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1
info "Setup started at $(date -Iseconds)"

# =============================================================================
# 1. System packages
# =============================================================================
section "System Packages"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl wget git unzip jq \
    ca-certificates gnupg lsb-release \
    ufw fail2ban \
    logrotate \
    sendmail mailutils \
    redis-tools \
    awscli \
    htop iotop ncdu \
    build-essential

success "System packages installed"

# =============================================================================
# 2. Docker Engine + Compose v2
# =============================================================================
section "Docker Engine"

if command -v docker &>/dev/null; then
    DOCKER_VER=$(docker --version | awk '{print $3}' | tr -d ',')
    warn "Docker already installed: ${DOCKER_VER} – skipping"
else
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list

    apt-get update -qq
    apt-get install -y -qq \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin

    systemctl enable --now docker
    success "Docker Engine installed"
fi

# Add tarcoin user to docker group (done after user creation below, but safe to
# run again if user already exists)
if id "${TARCOIN_USER}" &>/dev/null; then
    usermod -aG docker "${TARCOIN_USER}"
fi

# =============================================================================
# 3. Node.js 20 via nvm
# =============================================================================
section "Node.js ${NODE_VERSION} via nvm"

NVM_DIR="/opt/nvm"
if [[ -d "${NVM_DIR}" ]]; then
    warn "nvm already installed at ${NVM_DIR} – skipping"
else
    mkdir -p "${NVM_DIR}"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh \
        | NVM_DIR="${NVM_DIR}" bash
    success "nvm installed"
fi

# Source nvm and install Node 20
export NVM_DIR="${NVM_DIR}"
# shellcheck source=/dev/null
source "${NVM_DIR}/nvm.sh"

if nvm ls "${NODE_VERSION}" &>/dev/null 2>&1; then
    warn "Node.js ${NODE_VERSION} already installed – skipping"
else
    nvm install "${NODE_VERSION}"
    nvm alias default "${NODE_VERSION}"
    success "Node.js ${NODE_VERSION} installed"
fi

# Make node/npm available system-wide
NODE_PATH="$(nvm which ${NODE_VERSION})"
ln -sf "${NODE_PATH}" /usr/local/bin/node
ln -sf "$(dirname "${NODE_PATH}")/npm" /usr/local/bin/npm
ln -sf "$(dirname "${NODE_PATH}")/npx" /usr/local/bin/npx

# Write NVM env to /etc/profile.d so it's available to all users
cat > /etc/profile.d/nvm.sh <<EOF
export NVM_DIR="${NVM_DIR}"
[ -s "\${NVM_DIR}/nvm.sh" ] && source "\${NVM_DIR}/nvm.sh"
EOF
chmod +x /etc/profile.d/nvm.sh
success "Node.js available at $(node --version)"

# =============================================================================
# 4. Certbot
# =============================================================================
section "Certbot"

if command -v certbot &>/dev/null; then
    warn "Certbot already installed: $(certbot --version 2>&1) – skipping"
else
    apt-get install -y -qq certbot python3-certbot-nginx
    success "Certbot installed: $(certbot --version 2>&1)"
fi

# =============================================================================
# 5. System user & working directory
# =============================================================================
section "System User: ${TARCOIN_USER}"

if id "${TARCOIN_USER}" &>/dev/null; then
    warn "User '${TARCOIN_USER}' already exists – skipping creation"
else
    useradd \
        --system \
        --create-home \
        --home-dir "${TARCOIN_HOME}" \
        --shell /bin/bash \
        --comment "TARCOIN blockchain service account" \
        "${TARCOIN_USER}"
    success "User '${TARCOIN_USER}' created"
fi

# Ensure home directory
mkdir -p "${TARCOIN_HOME}"
chown -R "${TARCOIN_USER}:${TARCOIN_USER}" "${TARCOIN_HOME}"

# Add to docker group
usermod -aG docker "${TARCOIN_USER}"
success "User '${TARCOIN_USER}' added to docker group"

# =============================================================================
# 6. Log directory
# =============================================================================
section "Log Directory"

mkdir -p "${LOG_DIR}"
chown -R "${TARCOIN_USER}:${TARCOIN_USER}" "${LOG_DIR}"
chmod 750 "${LOG_DIR}"
success "Log directory created: ${LOG_DIR}"

# =============================================================================
# 7. Backup directory
# =============================================================================
section "Backup Directory"

mkdir -p "${BACKUP_DIR}"
chown -R "${TARCOIN_USER}:${TARCOIN_USER}" "${BACKUP_DIR}"
chmod 750 "${BACKUP_DIR}"
success "Backup directory created: ${BACKUP_DIR}"

# =============================================================================
# 8. UFW Firewall
# =============================================================================
section "UFW Firewall"

# Install if missing
if ! command -v ufw &>/dev/null; then
    apt-get install -y -qq ufw
fi

ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# SSH – allow first so we don't lock ourselves out
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw allow 19333/tcp comment "TARCOIN P2P"
ufw allow 3333/tcp  comment "Mining Stratum"

ufw --force enable
success "UFW configured:"
ufw status numbered

# =============================================================================
# 9. Fail2ban
# =============================================================================
section "Fail2ban"

if ! systemctl is-active --quiet fail2ban; then
    systemctl enable --now fail2ban
fi

cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
EOF

systemctl restart fail2ban
success "Fail2ban enabled"

# =============================================================================
# 10. Log rotation
# =============================================================================
section "Log Rotation"

cat > /etc/logrotate.d/tarcoin <<EOF
${LOG_DIR}/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 640 ${TARCOIN_USER} ${TARCOIN_USER}
    sharedscripts
    postrotate
        # Signal services to reopen log files if needed
        true
    endscript
}
EOF

success "Log rotation configured for ${LOG_DIR}/*.log"

# =============================================================================
# 11. Clone git repository
# =============================================================================
section "Git Repository"

if [[ -d "${TARCOIN_HOME}/.git" ]]; then
    warn "Repository already cloned at ${TARCOIN_HOME} – pulling latest"
    sudo -u "${TARCOIN_USER}" git -C "${TARCOIN_HOME}" pull --ff-only || \
        warn "Could not pull – check SSH keys or run manually"
else
    if [[ -f /root/.ssh/id_rsa || -f /root/.ssh/id_ed25519 ]]; then
        sudo -u "${TARCOIN_USER}" git clone "${GIT_REPO}" "${TARCOIN_HOME}" || \
            warn "Clone failed – ensure SSH deploy key is installed. Skipping."
    else
        warn "No SSH key found. Skipping git clone."
        warn "Add a deploy key and run: git clone ${GIT_REPO} ${TARCOIN_HOME}"
    fi
fi

# =============================================================================
# 12. Systemd service for Docker Compose
# =============================================================================
section "Systemd Docker Compose Service"

cat > /etc/systemd/system/tarcoin.service <<EOF
[Unit]
Description=TARCOIN Docker Compose Stack
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${TARCOIN_HOME}/docker
ExecStart=/usr/bin/docker compose up -d --remove-orphans
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300
User=${TARCOIN_USER}
Group=${TARCOIN_USER}
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tarcoin.service
success "Systemd service 'tarcoin' registered (not started)"

# =============================================================================
# 13. Swap (for memory-constrained VPS)
# =============================================================================
section "Swap"

if swapon --show | grep -q .; then
    warn "Swap already configured – skipping"
else
    SWAP_SIZE="4G"
    fallocate -l "${SWAP_SIZE}" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    success "Swap created: ${SWAP_SIZE}"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${BOLD}${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  TARCOIN Server Setup Complete!${NC}"
echo -e "${BOLD}${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}System user:${NC}    ${TARCOIN_USER}"
echo -e "  ${CYAN}Working dir:${NC}    ${TARCOIN_HOME}"
echo -e "  ${CYAN}Log dir:${NC}        ${LOG_DIR}"
echo -e "  ${CYAN}Backup dir:${NC}     ${BACKUP_DIR}"
echo -e "  ${CYAN}Docker:${NC}         $(docker --version)"
echo -e "  ${CYAN}Node.js:${NC}        $(node --version)"
echo -e "  ${CYAN}Certbot:${NC}        $(certbot --version 2>&1)"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "  1. SSH as ${TARCOIN_USER}: ssh ${TARCOIN_USER}@\$(hostname -I | awk '{print \$1}')"
echo -e "  2. Run: bash devops/scripts/init-env.sh"
echo -e "  3. Run: sudo bash devops/scripts/ssl-setup.sh --env production"
echo -e "  4. Run: bash devops/scripts/deploy.sh --env production --service all"
echo ""
info "Setup log saved to: ${LOG_FILE}"
