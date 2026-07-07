#!/usr/bin/env bash
# =============================================================================
# install.sh — ElectrumX TARCOIN bare-metal installation script
# =============================================================================
# Tested on: Ubuntu 22.04 LTS, Ubuntu 24.04 LTS, Debian 12
#
# What this script does:
#   1. Installs system dependencies (Python 3.12, LevelDB, git)
#   2. Creates electrumx system user
#   3. Clones ElectrumX from spesmilo/electrumx
#   4. Applies the TARCOIN coin class patch
#   5. Installs Python dependencies
#   6. Installs ElectrumX systemd service
#   7. Creates directory structure
#
# Run as root:
#   chmod +x scripts/install.sh
#   sudo ./scripts/install.sh
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — edit these before running
# ---------------------------------------------------------------------------
ELECTRUMX_USER="electrumx"
ELECTRUMX_HOME="/opt/electrumx"
ELECTRUMX_DATA="/data/electrumx"
ELECTRUMX_CONFIG="/etc/electrumx"
ELECTRUMX_SSL="/etc/ssl/electrumx"
ELECTRUMX_REPO="https://github.com/spesmilo/electrumx.git"

# ---------------------------------------------------------------------------
# Colour output helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
[[ $EUID -ne 0 ]] && error "This script must be run as root (sudo ./install.sh)"

OS=$(lsb_release -si 2>/dev/null || echo "Unknown")
CODENAME=$(lsb_release -sc 2>/dev/null || echo "unknown")
info "Detected OS: $OS $CODENAME"

# ---------------------------------------------------------------------------
# Step 1: System dependencies
# ---------------------------------------------------------------------------
info "Installing system dependencies..."
apt-get update -qq
apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-venv \
    python3.12-dev \
    python3-pip \
    libleveldb-dev \
    git \
    curl \
    ca-certificates \
    libssl-dev \
    build-essential

success "System dependencies installed"

# ---------------------------------------------------------------------------
# Step 2: Create electrumx system user
# ---------------------------------------------------------------------------
if id "$ELECTRUMX_USER" &>/dev/null; then
    warn "User '$ELECTRUMX_USER' already exists — skipping"
else
    info "Creating system user: $ELECTRUMX_USER"
    useradd --system --create-home --home-dir "$ELECTRUMX_HOME" \
            --shell /bin/false "$ELECTRUMX_USER"
    success "User '$ELECTRUMX_USER' created"
fi

# ---------------------------------------------------------------------------
# Step 3: Create directory structure
# ---------------------------------------------------------------------------
info "Creating directory structure..."
mkdir -p "$ELECTRUMX_DATA" "$ELECTRUMX_CONFIG" "$ELECTRUMX_SSL"
chown -R "$ELECTRUMX_USER:$ELECTRUMX_USER" "$ELECTRUMX_DATA"
chmod 700 "$ELECTRUMX_SSL"
success "Directories created"

# ---------------------------------------------------------------------------
# Step 4: Clone ElectrumX
# ---------------------------------------------------------------------------
if [[ -d "$ELECTRUMX_HOME/electrumx/.git" ]]; then
    warn "ElectrumX already cloned — pulling latest..."
    cd "$ELECTRUMX_HOME/electrumx"
    git pull
else
    info "Cloning ElectrumX from $ELECTRUMX_REPO..."
    git clone "$ELECTRUMX_REPO" "$ELECTRUMX_HOME/electrumx"
fi

success "ElectrumX source ready"

# ---------------------------------------------------------------------------
# Step 5: Apply TARCOIN coin class patch
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCH_FILE="$SCRIPT_DIR/../coins_tarcoin.py"
APPLY_SCRIPT="$SCRIPT_DIR/apply_patch.py"

[[ -f "$PATCH_FILE" ]] || error "coins_tarcoin.py not found at: $PATCH_FILE"
[[ -f "$APPLY_SCRIPT" ]] || error "apply_patch.py not found at: $APPLY_SCRIPT"

info "Applying TARCOIN coin class patch..."
cp "$PATCH_FILE" "$ELECTRUMX_HOME/electrumx/coins_tarcoin.py"
cp "$APPLY_SCRIPT" "$ELECTRUMX_HOME/electrumx/apply_patch.py"

cd "$ELECTRUMX_HOME/electrumx"
python3.12 apply_patch.py

success "TARCOIN coin class patch applied"

# ---------------------------------------------------------------------------
# Step 6: Python virtual environment and dependencies
# ---------------------------------------------------------------------------
info "Setting up Python virtual environment..."
python3.12 -m venv "$ELECTRUMX_HOME/venv"
source "$ELECTRUMX_HOME/venv/bin/activate"

pip install --upgrade pip --quiet
pip install --quiet \
    aiohttp \
    aiorpcx \
    attrs \
    pylru \
    plyvel

# Install ElectrumX itself
pip install --quiet -e "$ELECTRUMX_HOME/electrumx"

deactivate
success "Python environment configured"

# Fix ownership
chown -R "$ELECTRUMX_USER:$ELECTRUMX_USER" "$ELECTRUMX_HOME"

# ---------------------------------------------------------------------------
# Step 7: Create symlink for electrumx_server binary
# ---------------------------------------------------------------------------
ln -sf "$ELECTRUMX_HOME/venv/bin/electrumx_server" /usr/local/bin/electrumx_server
success "electrumx_server installed to /usr/local/bin/"

# ---------------------------------------------------------------------------
# Step 8: Install configuration files
# ---------------------------------------------------------------------------
info "Installing configuration files..."

CONF_SOURCE="$SCRIPT_DIR/../config/electrumx_mainnet.conf"
[[ -f "$CONF_SOURCE" ]] && cp "$CONF_SOURCE" "$ELECTRUMX_CONFIG/electrumx.conf"

# Create the secrets env file if it doesn't exist
ENV_FILE="$ELECTRUMX_CONFIG/electrumx.env"
if [[ ! -f "$ENV_FILE" ]]; then
    cat > "$ENV_FILE" <<'EOF'
# ElectrumX secrets — EDIT THIS FILE
# Format: DAEMON_URL=http://rpcuser:rpcpassword@127.0.0.1:19332/
DAEMON_URL=http://tarcoin:CHANGE_THIS_PASSWORD@127.0.0.1:19332/
ELECTRUMX_HOST=electrum.tarcoin.org
EOF
    chmod 600 "$ENV_FILE"
    warn "Created $ENV_FILE — EDIT IT with your RPC password before starting!"
fi

# ---------------------------------------------------------------------------
# Step 9: Install systemd service
# ---------------------------------------------------------------------------
info "Installing systemd service..."
SYSMD_SOURCE="$SCRIPT_DIR/../systemd/electrumx-tarcoin.service"
[[ -f "$SYSMD_SOURCE" ]] && cp "$SYSMD_SOURCE" /etc/systemd/system/
systemctl daemon-reload
success "systemd service installed"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo -e " ${GREEN}ElectrumX TARCOIN installation complete!${NC}"
echo "============================================================"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Edit RPC credentials:"
echo "     nano $ELECTRUMX_CONFIG/electrumx.env"
echo ""
echo "  2. Generate SSL certificate:"
echo "     sudo ./scripts/setup_ssl.sh electrum.tarcoin.org"
echo ""
echo "  3. Make sure tarcoind is running with -txindex=1"
echo ""
echo "  4. Start ElectrumX:"
echo "     sudo systemctl enable --now electrumx-tarcoin"
echo ""
echo "  5. Watch logs:"
echo "     sudo journalctl -fu electrumx-tarcoin"
echo ""
echo "  ElectrumX will now sync from the TARCOIN genesis block."
echo "  This is fast on a new chain (~375 blocks)."
echo ""
