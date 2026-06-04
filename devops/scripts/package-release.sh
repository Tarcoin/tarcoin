#!/usr/bin/env bash
# TARCOIN — Package CLI Tools for Download
# Run after building blockchain_core to create the tarcoin-cli-tools.zip
# Usage: bash devops/scripts/package-release.sh

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log() { echo -e "${CYAN}[package]${NC} $*"; }
ok()  { echo -e "${GREEN}✓${NC} $*"; }

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/blockchain_core/tarcoin-core/build/bin"
DOWNLOADS_DIR="$PROJECT_ROOT/website/public/downloads"
VERSION="v1.0.0"
TMPDIR_WORK=$(mktemp -d)

mkdir -p "$DOWNLOADS_DIR"

log "=== TARCOIN Release Packager $VERSION ==="

# ── Check binaries exist ──────────────────────────────────────────────────────
if [[ ! -d "$BUILD_DIR" ]]; then
  echo -e "${RED}✗ Build directory not found: $BUILD_DIR${NC}"
  echo "  Run: cd blockchain_core/tarcoin-core && cmake -B build && cmake --build build -j\$(nproc)"
  exit 1
fi

# ── CLI Tools package ─────────────────────────────────────────────────────────
log "Packaging CLI tools..."
CLI_DIR="$TMPDIR_WORK/tarcoin-cli-tools-${VERSION}-linux64"
mkdir -p "$CLI_DIR"

for BIN in tarcoind tarcoin-cli tarcoin-tx; do
  if [[ -f "$BUILD_DIR/$BIN" ]]; then
    cp "$BUILD_DIR/$BIN" "$CLI_DIR/"
    ok "Added: $BIN"
  else
    echo -e "${RED}  Missing: $BUILD_DIR/$BIN${NC}"
  fi
done

# Copy README
cat > "$CLI_DIR/README.txt" << 'EOF'
TARCOIN CLI Tools v1.0.0
========================

Binaries included:
  tarcoind      - Full node daemon
  tarcoin-cli   - Command-line RPC interface
  tarcoin-tx    - Transaction utility

Quick Start:
  ./tarcoind -printtoconsole          Start the node
  ./tarcoin-cli getblockchaininfo     Query the node
  ./tarcoin-cli getblockcount         Get current block height

Network:
  Mainnet P2P:  19333
  Mainnet RPC:  19332
  Genesis:      000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0

For full documentation: https://tarcoin.org/docs
EOF

cd "$TMPDIR_WORK"
zip -r "$DOWNLOADS_DIR/tarcoin-cli-tools.zip" "tarcoin-cli-tools-${VERSION}-linux64/"
ok "Created: tarcoin-cli-tools.zip"

# ── Linux wallet package ──────────────────────────────────────────────────────
log "Packaging Linux wallet..."
LINUX_DIR="$TMPDIR_WORK/tarcoin-${VERSION}-linux64"
mkdir -p "$LINUX_DIR"
for BIN in tarcoind tarcoin-cli tarcoin-tx; do
  [[ -f "$BUILD_DIR/$BIN" ]] && cp "$BUILD_DIR/$BIN" "$LINUX_DIR/"
done
cp "$CLI_DIR/README.txt" "$LINUX_DIR/"
cd "$TMPDIR_WORK"
tar -czf "$DOWNLOADS_DIR/tarcoin-wallet-linux.tar.gz" "tarcoin-${VERSION}-linux64/"
ok "Created: tarcoin-wallet-linux.tar.gz"

# ── Generate SHA256 checksums ─────────────────────────────────────────────────
log "Generating SHA256 checksums..."
cd "$DOWNLOADS_DIR"
sha256sum tarcoin-*.zip tarcoin-*.tar.gz > SHA256SUMS 2>/dev/null || true
ok "Created: SHA256SUMS"

cat SHA256SUMS

# ── Cleanup ───────────────────────────────────────────────────────────────────
rm -rf "$TMPDIR_WORK"

log "Done! Files in: $DOWNLOADS_DIR"
ls -lh "$DOWNLOADS_DIR"
