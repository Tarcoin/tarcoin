# ElectrumX — TARCOIN (TAR)

Official ElectrumX server integration for the TARCOIN network.

Allows lightweight Electrum wallets to connect to the TARCOIN blockchain
without downloading the full chain (SPV — Simplified Payment Verification).

---

## Network Parameters

All values verified from TARCOIN Core source code (`src/kernel/chainparams.cpp`).

| Parameter | Mainnet | Testnet |
|---|---|---|
| Genesis Hash | `0000e37ee7aa8a88...fbd9939e` | — |
| P2P Port | `19333` | `29333` |
| RPC Port | `19332` | `29332` |
| Magic Bytes | `74 61 72 63` (`tarc`) | `fc c1 b7 dc` |
| Bech32 HRP | `tar` | `ttar` |
| P2PKH prefix | `65` → `T…` | `111` → `m/n…` |
| P2SH prefix | `127` → `t…` | `196` |
| WIF prefix | `128` | `239` |
| BIP32 xpub | `0488B21E` | `043587CF` |
| BIP32 xprv | `0488ADE4` | `04358394` |
| BIP44 coin type | `5050` | — |
| ElectrumX TCP | `50001` | `60001` |
| ElectrumX SSL | `50002` | `60002` |

---

## Architecture

```
Electrum Wallet (mobile / desktop)
          │  Electrum Protocol (TCP/SSL port 50002)
          ▼
  ElectrumX Server   ←── this repository
          │  JSON-RPC (port 19332, internal only)
          ▼
    tarcoind (full node)
          │  P2P (port 19333)
          ▼
   TARCOIN Network
```

ElectrumX does not validate consensus itself. It fully trusts `tarcoind`
for all consensus decisions (block validation, UTXO state, mempool).

---

## Quick Start — Docker (Recommended)

### Prerequisites
- Docker 24+ and Docker Compose v2
- A domain pointing to your server (e.g. `electrum.tarcoin.org`)
- Ports `19333`, `50001`, `50002` open in your firewall

### 1. Clone this repository

```bash
git clone https://github.com/tarcoin/electrumx-tarcoin.git
cd electrumx-tarcoin
```

### 2. Configure environment

```bash
cp .env.example .env
nano .env
```

Set your RPC password and domain:
```
TARCOIN_RPC_USER=tarcoin
TARCOIN_RPC_PASSWORD=your_long_random_password_here
ELECTRUMX_HOST=electrum.tarcoin.org
```

### 3. Generate SSL certificate

```bash
sudo ./scripts/setup_ssl.sh electrum.tarcoin.org your@email.com
```

### 4. Start the stack

```bash
docker-compose up -d
```

This starts three containers:
- `electrumx-tarcoind` — TARCOIN full node
- `electrumx-server` — ElectrumX (patched for TARCOIN)
- `electrumx-nginx` — SSL/TLS reverse proxy

### 5. Watch sync progress

```bash
# tarcoind sync
docker logs -f electrumx-tarcoind

# ElectrumX sync (starts after tarcoind is ready)
docker logs -f electrumx-server
```

### 6. Verify

```bash
# Test TCP connection
echo '{"jsonrpc":"2.0","id":1,"method":"server.version","params":["test","1.4"]}' | \
  nc electrum.tarcoin.org 50001

# Test SSL connection
echo '{"jsonrpc":"2.0","id":1,"method":"server.version","params":["test","1.4"]}' | \
  openssl s_client -connect electrum.tarcoin.org:50002 -quiet 2>/dev/null
```

Expected response:
```json
{"jsonrpc": "2.0", "result": ["ElectrumX 1.x.x", "1.4"], "id": 1}
```

---

## Quick Start — Bare Metal (Ubuntu/Debian)

### 1. Clone and install

```bash
git clone https://github.com/tarcoin/electrumx-tarcoin.git
cd electrumx-tarcoin
sudo ./scripts/install.sh
```

### 2. Configure credentials

```bash
sudo nano /etc/electrumx/electrumx.env
# Set: DAEMON_URL=http://tarcoin:YOUR_PASSWORD@127.0.0.1:19332/
# Set: ELECTRUMX_HOST=electrum.tarcoin.org
```

### 3. Configure tarcoind

Add to your `~/.tarcoin/tarcoin.conf`:
```
txindex=1
rpcuser=tarcoin
rpcpassword=YOUR_PASSWORD
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
server=1
```

Restart tarcoind:
```bash
sudo systemctl restart tarcoind
```

> ⚠️ **Critical:** `txindex=1` is required. If adding to an existing node,
> run `tarcoind -reindex` once (takes time proportional to chain length).
> TARCOIN is currently ~375 blocks so this will be fast.

### 4. SSL certificate

```bash
sudo ./scripts/setup_ssl.sh electrum.tarcoin.org your@email.com
```

### 5. Start ElectrumX

```bash
sudo systemctl enable --now electrumx-tarcoin
sudo journalctl -fu electrumx-tarcoin
```

---

## Applying the TARCOIN Coin Class Manually

If you already have an ElectrumX installation and want to add TARCOIN support:

```bash
# 1. Copy the patch files into your ElectrumX directory
cp coins_tarcoin.py /path/to/electrumx/
cp scripts/apply_patch.py /path/to/electrumx/

# 2. Apply the patch
cd /path/to/electrumx
python3 apply_patch.py

# 3. Verify it worked
grep "class TarCoin" electrumx/lib/coins.py
```

Or manually open `electrumx/lib/coins.py`, find the line:
```python
class BitcoinTestnet(Bitcoin):
```
And paste the contents of `coins_tarcoin.py` immediately before it.

---

## Coin Class Reference

Location in ElectrumX: `electrumx/lib/coins.py`

```python
class TarCoin(Bitcoin):
    NAME          = "TarCoin"
    SHORTNAME     = "TAR"
    NET           = "mainnet"
    GENESIS_HASH  = '0000e37ee7aa8a88d1254ee3fe7c497c8fdaff36b29747eb64d8da68fbd9939e'
    P2PKH_VERBYTE = bytes([65])       # T... addresses
    P2SH_VERBYTES = [bytes([127])]    # t... addresses
    WIF_BYTE      = bytes([128])
    XPUB_VERBYTES = bytes.fromhex('0488B21E')   # xpub...
    XPRV_VERBYTES = bytes.fromhex('0488ADE4')   # xprv...
    BECH32_HRP    = 'tar'             # tar1q... addresses
    RPC_PORT      = 19332
    PEERS         = []
```

---

## BIP44 Derivation Paths

TARCOIN coin type: **5050** (SLIP-0044 PR: [satoshilabs/slips#2030](https://github.com/satoshilabs/slips/pull/2030))

| BIP | Path | Address type |
|---|---|---|
| BIP44 | `m/44'/5050'/0'/0/0` | Legacy `T…` |
| BIP49 | `m/49'/5050'/0'/0/0` | P2SH-SegWit `t…` |
| BIP84 | `m/84'/5050'/0'/0/0` | Native SegWit `tar1q…` |
| BIP86 | `m/86'/5050'/0'/0/0` | Taproot `tar1p…` |

> **Note:** Native SegWit (`tar1q…`) and Taproot (`tar1p…`) addresses activate
> at block 481,824 on TARCOIN mainnet. Until then, use legacy `T…` addresses.

---

## Ports Reference

| Port | Protocol | Purpose | Exposure |
|---|---|---|---|
| `19332` | JSON-RPC | tarcoind RPC | Internal only |
| `19333` | TCP | TARCOIN P2P | Public |
| `50001` | TCP | Electrum plaintext | LAN / behind proxy |
| `50002` | SSL/TLS | Electrum TLS | **Public** |
| `50004` | WSS | ElectrumX WebSocket TLS | **Public** |

---

## Firewall Rules (UFW)

```bash
# TARCOIN P2P — required for network peers
sudo ufw allow 19333/tcp comment "TARCOIN P2P"

# ElectrumX — Electrum clients
sudo ufw allow 50002/tcp comment "ElectrumX SSL"
sudo ufw allow 50004/tcp comment "ElectrumX WSS"

# HTTP/HTTPS — for SSL certificate renewal
sudo ufw allow 80/tcp  comment "HTTP (certbot)"
sudo ufw allow 443/tcp comment "HTTPS"

# DO NOT expose these externally:
# 19332 (tarcoind RPC) — internal only
# 50001 (ElectrumX plaintext) — use SSL instead
```

---

## Health Check

```bash
./scripts/healthcheck.sh
```

---

## Connecting an Electrum Wallet

In any Electrum-compatible wallet (Electrum desktop, mobile wallet):

1. Go to **Tools → Network → Server**
2. Disable "Select server automatically"
3. Enter: `electrum.tarcoin.org:50002:s`
   - The `:s` suffix means SSL
4. Save and reconnect

---

## SegWit Activation Note

TARCOIN inherits Bitcoin's SegWit activation height of **481,824**.
The chain is currently at ~375 blocks, so SegWit is not yet active.

| Feature | Status |
|---|---|
| Legacy addresses `T…` | ✅ Active now |
| P2SH addresses `t…` | ✅ Active now |
| Native SegWit `tar1q…` | ⏳ Activates at block 481,824 |
| Taproot `tar1p…` | ⏳ Activates at block 481,824 |

---

## License

MIT License — same as ElectrumX upstream.

TARCOIN-specific additions copyright © TARCOIN Project.
