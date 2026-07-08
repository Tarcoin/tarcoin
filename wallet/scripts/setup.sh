#!/usr/bin/env bash
# =============================================================================
# setup.sh — Clone BlueWallet and apply all TARCOIN modifications
# =============================================================================
# Run once on a fresh machine or CI environment.
#
# Requirements:
#   - Node.js 18+ (https://nodejs.org)
#   - Git
#   - For iOS: macOS + Xcode 15+
#   - For Android: JDK 17 + Android Studio
#
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
# =============================================================================

set -euo pipefail

BLUEWALLET_REPO="https://github.com/BlueWallet/BlueWallet.git"
BLUEWALLET_TAG="v7.0.0"        # Pinned version — update after testing
TARGET_DIR="./TARWallet"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WALLET_ROOT="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
command -v node >/dev/null || error "Node.js not found. Install from https://nodejs.org"
command -v git  >/dev/null || error "Git not found."
command -v npm  >/dev/null || error "npm not found."

NODE_VER=$(node --version | tr -d 'v')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
[[ "$NODE_MAJOR" -lt 18 ]] && error "Node.js 18+ required. Found: $NODE_VER"

info "Node.js: $(node --version)"
info "npm:     $(npm --version)"

# ---------------------------------------------------------------------------
# Step 1: Clone BlueWallet
# ---------------------------------------------------------------------------
if [[ -d "$TARGET_DIR/.git" ]]; then
    warn "Directory $TARGET_DIR already exists — skipping clone"
else
    info "Cloning BlueWallet $BLUEWALLET_TAG..."
    git clone --depth 1 --branch "$BLUEWALLET_TAG" "$BLUEWALLET_REPO" "$TARGET_DIR"
    success "BlueWallet cloned to $TARGET_DIR"
fi

cd "$TARGET_DIR"

# ---------------------------------------------------------------------------
# Step 2: Copy TARCOIN source files
# ---------------------------------------------------------------------------
info "Copying TARCOIN configuration files..."

# Network params and wallet models
mkdir -p blue_modules/tarcoin
cp "$WALLET_ROOT/src/config/network.js"           blue_modules/tarcoin/network.js
cp "$WALLET_ROOT/src/config/electrum.js"          blue_modules/tarcoin/electrum.js
cp "$WALLET_ROOT/src/config/app.js"               blue_modules/tarcoin/app.js
cp "$WALLET_ROOT/src/models/walletConstants.js"   blue_modules/tarcoin/walletConstants.js

# Overwrite default application launcher icons with custom TARCOIN logo
info "Replacing default launcher icons with custom TARCOIN logo..."
cp -R "$WALLET_ROOT/assets/android/"* android/app/src/main/res/
cp -R "$WALLET_ROOT/assets/ios/"* ios/BlueWallet/Images.xcassets/AppIcon.appiconset/

success "TARCOIN source files and brand assets copied successfully"


# ---------------------------------------------------------------------------
# Step 3: Apply patches
# ---------------------------------------------------------------------------
info "Applying TARCOIN patches..."
PATCH_DIR="$WALLET_ROOT/patches"

for patch in "$PATCH_DIR"/*.patch; do
    info "  Applying: $(basename "$patch")"
    git apply "$patch" --ignore-whitespace || warn "  Patch $(basename "$patch") had conflicts — check manually"
done

success "Patches applied"

# ---------------------------------------------------------------------------
# Step 4: Update package.json
# ---------------------------------------------------------------------------
info "Updating package.json..."
# Use Node to safely edit JSON
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.name = 'TARWallet';
pkg.displayName = 'TARCOIN Wallet';
pkg.version = '1.0.0';
pkg.description = 'Official TARCOIN (TAR) mobile wallet';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json updated');
"
success "package.json updated"

# ---------------------------------------------------------------------------
# Step 5: Update Android strings
# ---------------------------------------------------------------------------
info "Updating Android app name..."
ANDROID_STRINGS="android/app/src/main/res/values/strings.xml"
if [[ -f "$ANDROID_STRINGS" ]]; then
    sed -i 's/BlueWallet/TARCOIN Wallet/g' "$ANDROID_STRINGS"
    success "Android strings.xml updated"
else
    warn "Android strings.xml not found — skipping"
fi

# ---------------------------------------------------------------------------
# Step 6: Update iOS Info.plist
# ---------------------------------------------------------------------------
info "Updating iOS app name..."
IOS_PLIST="ios/BlueWallet/Info.plist"
if [[ -f "$IOS_PLIST" ]]; then
    # Update CFBundleDisplayName
    sed -i 's/<string>BlueWallet<\/string>/<string>TARCOIN Wallet<\/string>/g' "$IOS_PLIST"
    success "iOS Info.plist updated"
else
    warn "iOS Info.plist not found — skipping (normal on non-macOS)"
fi

# ---------------------------------------------------------------------------
# Step 7: Install Node dependencies
# ---------------------------------------------------------------------------
info "Configuring Git to rewrite SSH repository URLs to HTTPS..."
git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
git config --global url."https://github.com/".insteadOf "git@github.com:"

info "Installing Node.js dependencies (this may take a few minutes)..."
npm install --legacy-peer-deps
success "Dependencies installed"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo -e " ${GREEN}TARCOIN Wallet setup complete!${NC}"
echo "============================================================"
echo ""
echo "  Directory: $TARGET_DIR"
echo ""
echo "  Next steps:"
echo ""
echo "  Android:"
echo "    cd $TARGET_DIR"
echo "    ./scripts/build_android.sh"
echo ""
echo "  iOS (macOS only):"
echo "    cd $TARGET_DIR"
echo "    ./scripts/build_ios.sh"
echo ""
echo "  Development server:"
echo "    cd $TARGET_DIR && npx react-native start"
echo ""
