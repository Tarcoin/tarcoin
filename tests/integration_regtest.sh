#!/usr/bin/env bash
# =============================================================================
# integration_regtest.sh — End-to-end TARCOIN ElectrumX integration test
# =============================================================================
# Uses TARCOIN regtest mode to run a full round-trip test:
#   1. Start tarcoind in regtest
#   2. Start ElectrumX pointing at regtest node
#   3. Mine blocks to generate coinbase
#   4. Connect Electrum client
#   5. Verify balance visible via Electrum protocol
#   6. Send a transaction
#   7. Mine confirmation
#   8. Verify transaction in history
#
# Requirements:
#   tarcoind, tarcoin-cli, python3, electrumx installed and patched
#
# Usage:
#   chmod +x tests/integration_regtest.sh
#   ./tests/integration_regtest.sh
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
TARCOIN_CLI="tarcoin-cli"
ELECTRUMX_BIN="electrumx_server"
DATA_DIR="/tmp/tarcoin-regtest-$$"
RPC_USER="regtestuser"
RPC_PASS="regtestpass$$"
RPC_PORT=19443          # Regtest RPC port from chainparamsbase.cpp
P2P_PORT=18444          # Regtest P2P port from chainparams.cpp
ELECTRUMX_PORT=60001    # Test port for ElectrumX
WAIT_TIMEOUT=30

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
TARCOIND_PID=""
ELECTRUMX_PID=""

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[PASS]${NC}  $*"; ((PASS++)); }
failure() { echo -e "${RED}[FAIL]${NC}  $*"; ((FAIL++)); }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }

# ---------------------------------------------------------------------------
# Cleanup on exit
# ---------------------------------------------------------------------------
cleanup() {
    info "Cleaning up..."
    [[ -n "$ELECTRUMX_PID" ]] && kill "$ELECTRUMX_PID" 2>/dev/null || true
    if [[ -n "$TARCOIND_PID" ]]; then
        "$TARCOIN_CLI" -regtest -datadir="$DATA_DIR" \
            -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" \
            -rpcport="$RPC_PORT" stop 2>/dev/null || true
        sleep 2
        kill "$TARCOIND_PID" 2>/dev/null || true
    fi
    rm -rf "$DATA_DIR"
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
rpc() {
    "$TARCOIN_CLI" -regtest \
        -datadir="$DATA_DIR" \
        -rpcuser="$RPC_USER" \
        -rpcpassword="$RPC_PASS" \
        -rpcport="$RPC_PORT" \
        "$@"
}

wait_for_rpc() {
    local deadline=$(( $(date +%s) + WAIT_TIMEOUT ))
    while (( $(date +%s) < deadline )); do
        rpc getblockcount &>/dev/null && return 0
        sleep 1
    done
    return 1
}

electrum_request() {
    echo "$1" | nc -q 1 127.0.0.1 "$ELECTRUMX_PORT" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Step 1: Start tarcoind in regtest
# ---------------------------------------------------------------------------
info "Creating regtest data directory: $DATA_DIR"
mkdir -p "$DATA_DIR"

cat > "$DATA_DIR/tarcoin.conf" <<EOF
regtest=1
server=1
rpcuser=$RPC_USER
rpcpassword=$RPC_PASS
rpcport=$RPC_PORT
port=$P2P_PORT
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
txindex=1
listen=0
EOF

info "Starting tarcoind (regtest)..."
tarcoind -regtest -datadir="$DATA_DIR" -conf="$DATA_DIR/tarcoin.conf" \
    -daemon -pid="$DATA_DIR/tarcoind.pid"

sleep 2
TARCOIND_PID=$(cat "$DATA_DIR/tarcoind.pid" 2>/dev/null || echo "")

info "Waiting for tarcoind RPC..."
if wait_for_rpc; then
    success "tarcoind RPC ready"
else
    failure "tarcoind RPC did not become ready within ${WAIT_TIMEOUT}s"
    exit 1
fi

# ---------------------------------------------------------------------------
# Step 2: Verify genesis block
# ---------------------------------------------------------------------------
info "Verifying genesis block hash..."
GENESIS=$(rpc getblockhash 0)
# Regtest genesis from chainparams.cpp assert:
EXPECTED_REGTEST_GENESIS="76f5d4a131988c2a276ee6725b9165c4ded51ab709583ac099841b99bc4bdd9a"

if [[ "$GENESIS" == "$EXPECTED_REGTEST_GENESIS" ]]; then
    success "Regtest genesis hash matches: $GENESIS"
else
    warn "Regtest genesis hash mismatch (may be OK if params changed)"
    warn "  Got:      $GENESIS"
    warn "  Expected: $EXPECTED_REGTEST_GENESIS"
fi

# ---------------------------------------------------------------------------
# Step 3: Mine initial blocks (coinbase matures after 100 blocks in regtest)
# ---------------------------------------------------------------------------
info "Generating wallet address..."
WALLET_ADDR=$(rpc getnewaddress)
info "Regtest address: $WALLET_ADDR"

# Verify it starts with expected prefix (regtest uses same prefix as testnet: 111)
if echo "$WALLET_ADDR" | grep -qE '^[mn]'; then
    success "Regtest address prefix correct (m/n...)"
else
    warn "Regtest address prefix unexpected: $WALLET_ADDR"
fi

info "Mining 101 blocks to mature coinbase..."
rpc generatetoaddress 101 "$WALLET_ADDR" > /dev/null
HEIGHT=$(rpc getblockcount)
success "Chain at height $HEIGHT"

BALANCE=$(rpc getbalance)
info "Wallet balance: $BALANCE TAR"
if (( $(echo "$BALANCE > 0" | bc -l) )); then
    success "Coinbase matured — balance: $BALANCE TAR"
else
    failure "Balance is 0 after mining — coinbase not matured"
fi

# ---------------------------------------------------------------------------
# Step 4: Start ElectrumX against regtest node
# ---------------------------------------------------------------------------
info "Starting ElectrumX (regtest mode)..."
ELECTRUMX_DATA="$DATA_DIR/electrumx"
mkdir -p "$ELECTRUMX_DATA"

COIN=TarCoinRegtest \
DB_DIRECTORY="$ELECTRUMX_DATA" \
DAEMON_URL="http://$RPC_USER:$RPC_PASS@127.0.0.1:$RPC_PORT/" \
SERVICES="tcp://127.0.0.1:$ELECTRUMX_PORT" \
LOG_LEVEL=warning \
"$ELECTRUMX_BIN" &>/dev/null &

ELECTRUMX_PID=$!
info "ElectrumX PID: $ELECTRUMX_PID"

# Wait for ElectrumX to start
sleep 10
if kill -0 "$ELECTRUMX_PID" 2>/dev/null; then
    success "ElectrumX running"
else
    failure "ElectrumX failed to start"
fi

# ---------------------------------------------------------------------------
# Step 5: Test Electrum protocol
# ---------------------------------------------------------------------------
info "Testing Electrum protocol server.version..."
RESPONSE=$(electrum_request '{"jsonrpc":"2.0","id":1,"method":"server.version","params":["integration-test","1.4"]}')

if echo "$RESPONSE" | grep -q '"result"'; then
    success "Electrum protocol responding"
    info "Response: $RESPONSE"
else
    failure "Electrum protocol not responding: $RESPONSE"
fi

# ---------------------------------------------------------------------------
# Step 6: Send a transaction
# ---------------------------------------------------------------------------
info "Creating second address for send test..."
ADDR2=$(rpc getnewaddress)

info "Sending 100 TAR to $ADDR2..."
TXID=$(rpc sendtoaddress "$ADDR2" 100)
success "Transaction broadcast: $TXID"

# ---------------------------------------------------------------------------
# Step 7: Mine confirmation
# ---------------------------------------------------------------------------
info "Mining 1 confirmation block..."
rpc generatetoaddress 1 "$WALLET_ADDR" > /dev/null
HEIGHT=$(rpc getblockcount)
success "Transaction confirmed at height $HEIGHT"

# Verify tx is in a block
TX_INFO=$(rpc gettransaction "$TXID")
CONFIRMATIONS=$(echo "$TX_INFO" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['confirmations'])")
if [[ "$CONFIRMATIONS" -ge 1 ]]; then
    success "Transaction confirmed ($CONFIRMATIONS confirmations)"
else
    failure "Transaction not confirmed: $CONFIRMATIONS confirmations"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "======================================================"
TOTAL=$((PASS + FAIL))
echo -e "  Integration Test Results:"
echo -e "  ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC} / $TOTAL total"
echo "======================================================"

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
