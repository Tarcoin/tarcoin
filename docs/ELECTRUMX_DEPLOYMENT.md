# ElectrumX TARCOIN — Deployment Guide

## Prerequisites

| Item | Requirement |
|---|---|
| OS | Ubuntu 22.04 LTS or 24.04 LTS |
| CPU | 2+ vCPU |
| RAM | 4 GB minimum, 8 GB recommended |
| Disk | 20 GB SSD (grows as chain grows) |
| Domain | `electrum.yourdomain.com` pointing to server IP |
| Ports open | 19333, 50002, 80, 443 |

---

## Option A — Docker (Recommended)

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone the repository

```bash
git clone https://github.com/tarcoin/electrumx-tarcoin.git
cd electrumx-tarcoin
```

### 3. Configure

```bash
cp .env.example .env
nano .env
```

```env
TARCOIN_RPC_USER=tarcoin
TARCOIN_RPC_PASSWORD=<generate with: openssl rand -hex 32>
ELECTRUMX_HOST=electrum.tarcoin.org
ELECTRUMX_CACHE_MB=1000
```

### 4. SSL Certificate

```bash
sudo ./scripts/setup_ssl.sh electrum.tarcoin.org your@email.com
```

### 5. Start

```bash
docker-compose up -d
docker logs -f electrumx-server
```

### 6. Verify

```bash
# ElectrumX responding?
echo '{"jsonrpc":"2.0","id":1,"method":"server.version","params":["test","1.4"]}' \
  | openssl s_client -connect electrum.tarcoin.org:50002 -quiet 2>/dev/null

# tarcoind syncing?
docker exec electrumx-tarcoind tarcoin-cli getblockcount
```

---

## Option B — Bare Metal

### 1. Run the installer

```bash
git clone https://github.com/tarcoin/electrumx-tarcoin.git
cd electrumx-tarcoin
sudo ./scripts/install.sh
```

### 2. Edit credentials

```bash
sudo nano /etc/electrumx/electrumx.env
```

```
DAEMON_URL=http://tarcoin:<password>@127.0.0.1:19332/
ELECTRUMX_HOST=electrum.tarcoin.org
```

### 3. Configure tarcoind

```bash
nano ~/.tarcoin/tarcoin.conf
```

```ini
txindex=1
server=1
rpcuser=tarcoin
rpcpassword=YOUR_SECURE_RPC_PASSWORD
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
```

```bash
sudo systemctl restart tarcoind
```

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

## Sync Progress

When ElectrumX first starts it indexes the chain from block 0. Watch progress:

```bash
# Docker
docker logs -f electrumx-server | grep -E "height|synced|blocks"

# Bare metal
journalctl -fu electrumx-tarcoin | grep -E "height|synced|blocks"
```

Because TARCOIN is currently ~375 blocks, **initial sync completes in minutes**.

Expected log output during sync:
```
INFO:BlockProcessor:Our height: 100/375 daemon: 375 UTXOs 1.2MB
INFO:BlockProcessor:Our height: 200/375 daemon: 375 UTXOs 2.1MB
INFO:BlockProcessor:Our height: 375/375 daemon: 375 UTXOs 3.4MB
INFO:BlockProcessor:caught up to height 375
```

---

## Applying the Coin Class Manually

If you already have an ElectrumX installation:

```bash
# Copy files
cp coins_tarcoin.py /path/to/electrumx/
cp scripts/apply_patch.py /path/to/electrumx/

# Apply
cd /path/to/electrumx
python3 apply_patch.py

# Verify
grep "class TarCoin" electrumx/lib/coins.py
# Expected: class TarCoin(Bitcoin):
```

---

## Firewall Rules

```bash
sudo ufw allow 19333/tcp  comment "TARCOIN P2P"
sudo ufw allow 50002/tcp  comment "ElectrumX SSL"
sudo ufw allow 50004/tcp  comment "ElectrumX WSS"
sudo ufw allow 80/tcp     comment "HTTP (certbot)"
sudo ufw allow 443/tcp    comment "HTTPS"
sudo ufw enable
```

> [!CAUTION]
> Do NOT open port 19332 (tarcoind RPC) or 50001 (Electrum plaintext) externally.

---

## Health Check

```bash
./scripts/healthcheck.sh
```

Expected output:
```
[PASS] tarcoind RPC (block height: 375)
[PASS] ElectrumX TCP port 50001
[PASS] ElectrumX SSL port 50002
[PASS] Electrum protocol (server: ElectrumX 1.x.x)
[PASS] systemd service electrumx-tarcoin
Results: 5 passed / 0 failed
```

---

## Adding Your Server to Electrum Wallet

In Electrum desktop or TARWallet mobile:

1. Settings → Network → Server
2. Disable "Select server automatically"
3. Enter: `electrum.tarcoin.org:50002:s`
   - `:s` suffix = SSL
4. Save and reconnect

---

## Updating ElectrumX

```bash
# Docker
docker-compose pull && docker-compose up -d

# Bare metal
cd /opt/electrumx/electrumx
git pull
python3 apply_patch.py   # Re-apply TARCOIN patch
sudo systemctl restart electrumx-tarcoin
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `Failed to connect to daemon` | tarcoind not running or wrong password | Check `DAEMON_URL` and tarcoind status |
| `txindex is not enabled` | tarcoind missing `-txindex=1` | Add to `tarcoin.conf`, restart with `-reindex` |
| Port 50002 not responding | SSL cert missing | Run `setup_ssl.sh` |
| `class TarCoin not found` | Patch not applied | Run `python3 apply_patch.py` |
| ElectrumX stuck at height 0 | Genesis hash mismatch | Verify `GENESIS_HASH` in `coins_tarcoin.py` |
