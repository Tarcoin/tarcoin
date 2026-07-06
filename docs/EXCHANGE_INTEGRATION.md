# TARCOIN Exchange Integration Guide

## Quick Reference

| Parameter | Value |
|---|---|
| **Ticker** | TAR |
| **Algorithm** | SHA256d (same as Bitcoin) |
| **Consensus** | Proof of Work |
| **Block Time** | ~10 minutes |
| **Block Reward** | 50,000 TAR (halves every 400,000 blocks) |
| **Max Supply** | 50,000,000,000 TAR |
| **Smallest Unit** | tar (1 TAR = 100,000,000 tar) |
| **Decimals** | 8 |
| **Address Formats** | `tar1...` (bech32/SegWit), `T...` (base58/P2PKH) |
| **Default P2P Port** | 19333 |
| **Default RPC Port** | 19332 |
| **Confirmations (recommended)** | 6 (deposits), 100 (coinbase maturity) |

---

## 1. Node Setup

### System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disk | 50 GB SSD | 100+ GB SSD |
| Network | 10 Mbps | 100 Mbps |
| OS | Ubuntu 22.04 / Windows Server 2022 | Ubuntu 24.04 LTS |

### Installation

```bash
# Build from source
cd tarcoin-core
./autogen.sh
./configure --disable-tests --disable-bench --with-gui=no
make -j$(nproc)
sudo make install
```

### Configuration (`tarcoin.conf`)

```ini
# Network
server=1
daemon=1
txindex=1
listen=1

# RPC — CHANGE THESE VALUES
rpcuser=EXCHANGE_RPC_USER
rpcpassword=EXCHANGE_RPC_PASSWORD_CHANGE_ME
rpcallowip=127.0.0.1
rpcport=19332

# Performance
dbcache=2048
maxmempool=512
maxconnections=125

# ZMQ (optional — for real-time notifications)
zmqpubhashblock=tcp://127.0.0.1:28332
zmqpubhashtx=tcp://127.0.0.1:28333

# Logging
printtoconsole=0
debug=rpc
shrinkdebugfile=1
```

### Start Node

```bash
tarcoind -conf=/path/to/tarcoin.conf
```

### Verify Sync

```bash
tarcoin-cli getblockchaininfo
# Wait until "initialblockdownload": false
```

---

## 2. RPC API Reference

### Authentication

All RPC calls use HTTP Basic Auth with `rpcuser` / `rpcpassword`.

```bash
curl -u "user:pass" -d '{"jsonrpc":"2.0","id":1,"method":"getblockchaininfo","params":[]}' \
  http://127.0.0.1:19332
```

### Essential Methods

#### Wallet Operations

| Method | Parameters | Description |
|---|---|---|
| `getnewaddress` | `[label, "bech32"]` | Generate deposit address (use `"bech32"` for `tar1...` addresses) |
| `validateaddress` | `[address]` | Validate address format |
| `getbalance` | `[minconf]` | Get wallet balance with minimum confirmations |
| `sendtoaddress` | `[address, amount]` | Send TAR to an address |
| `sendmany` | `["", {addr: amount, ...}]` | Batch withdrawals |
| `listunspent` | `[minconf, maxconf, [addresses]]` | List UTXOs for addresses |
| `listtransactions` | `[label, count, skip]` | List wallet transactions |

#### Blockchain Queries

| Method | Parameters | Description |
|---|---|---|
| `getblockcount` | — | Current block height |
| `getblockhash` | `[height]` | Block hash at height |
| `getblock` | `[hash, verbosity]` | Block data (verbosity: 0=hex, 1=JSON, 2=JSON+tx) |
| `getrawtransaction` | `[txid, verbose]` | Transaction data |
| `gettxout` | `[txid, n, mempool]` | UTXO status check |
| `getmempoolinfo` | — | Mempool statistics |

#### Fee Estimation

| Method | Parameters | Description |
|---|---|---|
| `estimatesmartfee` | `[conf_target, mode]` | Estimate fee rate (TAR/kB) |

---

## 3. Deposit Monitoring

### Recommended Flow

```
1. Generate unique deposit address per user:
   getnewaddress "user_123" "bech32"
   → tar1qw508d6qejxtdg4y5r3zarvary0c5xw7k...

2. Poll for new transactions (every 30s):
   listtransactions "*" 100 0 true

3. For each incoming transaction:
   - Record txid, amount, confirmations
   - Mark as "pending" until 6 confirmations
   - Mark as "confirmed" at 6+ confirmations

4. Verify with gettxout:
   gettxout "txid" vout_index true
   → null means UTXO was spent (double-spend check)
```

### ZMQ Real-Time Notifications (Recommended)

Instead of polling, subscribe to ZMQ for instant notification:

```
zmqpubhashblock=tcp://127.0.0.1:28332  # New block hashes
zmqpubhashtx=tcp://127.0.0.1:28333     # New transaction hashes
```

Node.js example:

```javascript
const zmq = require('zeromq');
const sock = new zmq.Subscriber();
sock.connect('tcp://127.0.0.1:28332');
sock.subscribe('hashblock');

for await (const [topic, msg] of sock) {
  if (topic.toString() === 'hashblock') {
    const blockHash = msg.toString('hex');
    console.log('New block:', blockHash);
    // Trigger deposit confirmation check
  }
}
```

### Confirmation Thresholds

| Amount | Recommended Confirmations |
|---|---|
| < 10,000 TAR | 3 |
| 10,000 - 1,000,000 TAR | 6 |
| > 1,000,000 TAR | 12 |

---

## 4. Withdrawal Processing

### Single Withdrawal

```bash
tarcoin-cli sendtoaddress "tar1q..." 1000.00 "withdrawal" "" true
# Returns: txid
```

### Batch Withdrawals (Recommended)

```bash
tarcoin-cli sendmany "" '{"tar1q...": 500, "Tabc...": 1000}' 6 "batch_withdrawal"
# Returns: txid
```

### Fee Management

```bash
# Estimate fee for 6-block confirmation target
tarcoin-cli estimatesmartfee 6
# Returns: {"feerate": 0.00001, "blocks": 6}

# Set wallet-wide transaction fee (TAR/kB)
tarcoin-cli settxfee 0.00001
```

### Hot/Cold Wallet Architecture

```
  Deposit          Hot Wallet         Cold Wallet
  Addresses  --->  (online)     --->  (offline)
                   ~5% of funds       ~95% funds
                       |
                       v
                   Withdrawal
                   Processing
```

---

## 5. Security Best Practices

### Node Security

- Run `tarcoind` as a non-root dedicated user
- Firewall: only expose RPC to localhost (`rpcallowip=127.0.0.1`)
- Use strong RPC credentials (32+ random characters)
- Enable `txindex=1` for full transaction lookups
- Monitor disk space — the chain grows over time

### Wallet Security

- Encrypt wallet file: `tarcoin-cli encryptwallet "passphrase"`
- Regular backup: `tarcoin-cli backupwallet "/secure/path/wallet.dat"`
- Cold storage for majority of funds
- Multi-signature setup for high-value operations

### Monitoring

```bash
# Check node is synced and connected
tarcoin-cli getblockchaininfo
tarcoin-cli getnetworkinfo
tarcoin-cli getpeerinfo

# Check wallet balance
tarcoin-cli getbalance
tarcoin-cli getwalletinfo
```

---

## 6. API Compatibility Matrix

TARCOIN is a Bitcoin fork. The following Bitcoin Core RPC methods are fully compatible:

| Category | Compatible Methods |
|---|---|
| **Blockchain** | `getbestblockhash`, `getblock`, `getblockchaininfo`, `getblockcount`, `getblockhash`, `getblockheader`, `getchaintxstats`, `getdifficulty`, `getmempoolinfo`, `getrawmempool`, `gettxout`, `gettxoutsetinfo` |
| **Mining** | `getblocktemplate`, `getmininginfo`, `getnetworkhashps`, `submitblock`, `prioritisetransaction` |
| **Network** | `getnetworkinfo`, `getpeerinfo`, `getconnectioncount`, `addnode`, `disconnectnode` |
| **Wallet** | `getnewaddress`, `getbalance`, `sendtoaddress`, `sendmany`, `listtransactions`, `listunspent`, `gettransaction`, `validateaddress`, `estimatesmartfee`, `signrawtransactionwithwallet` |
| **Raw Tx** | `createrawtransaction`, `decoderawtransaction`, `sendrawtransaction`, `getrawtransaction`, `signrawtransactionwithkey` |
| **PSBT** | `createpsbt`, `decodepsbt`, `finalizepsbt`, `combinepsbt`, `walletprocesspsbt` |
| **Utility** | `getmemoryinfo`, `uptime`, `logging`, `help`, `stop` |

### Key Differences from Bitcoin

| Feature | Bitcoin | TARCOIN |
|---|---|---|
| Address prefix (bech32) | `bc1` | `tar1` |
| Address prefix (base58) | `1` / `3` | `T` |
| P2P port | 8333 | 19333 |
| RPC port | 8332 | 19332 |
| Max supply | 21M BTC | 50B TAR |
| Block reward | 3.125 BTC | 50,000 TAR |
| Halving interval | 210,000 blocks | 400,000 blocks |
| Smallest unit name | satoshi | tar |
| Network magic | `f9beb4d9` | `fabfb5da` |

---

## 7. REST API (Optional)

TARCOIN also provides a REST API for public endpoints:

| Endpoint | Description |
|---|---|
| `GET /api/v1/blockchain/info` | Chain info |
| `GET /api/v1/blockchain/block/{hash}` | Block by hash |
| `GET /api/v1/blockchain/block/height/{h}` | Block by height |
| `GET /api/v1/blockchain/supply` | Supply data |
| `GET /api/v1/transactions/{txid}` | Transaction lookup |
| `POST /api/v1/transactions/send` | Broadcast raw tx |
| `GET /api/v1/wallet/validate/{addr}` | Address validation |
| `GET /api/v1/wallet/estimate-fee` | Fee estimation |
| `GET /health` | Node connectivity check |

Base URL: `https://api.tarcoin.org`

---

## 8. Support and Contact

- **Technical issues**: Open an issue on the TARCOIN GitHub repository
- **Website**: https://tarcoin.org
- **Explorer**: https://explorer.tarcoin.org
