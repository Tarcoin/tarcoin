# TARCOIN Ecosystem — Architecture Overview

## System Architecture

```
                        ┌─────────────────────────────────┐
                        │          INTERNET                │
                        └─────────────┬───────────────────┘
                                      │
                        ┌─────────────▼───────────────────┐
                        │     HAProxy (Load Balancer)      │
                        │   Ports: 50001 / 50002 / 50004   │
                        └──────┬──────────┬────────┬───────┘
                               │          │        │
              ┌────────────────▼┐  ┌──────▼─┐  ┌──▼──────────────┐
              │  ElectrumX-1    │  │ElectrumX│  │  ElectrumX-3    │
              │  (primary)      │  │   -2    │  │  (replica)      │
              └────────┬────────┘  └────┬───┘  └───────┬─────────┘
                       │               │               │
                       └───────────────┴───────────────┘
                                       │ JSON-RPC :19332 (internal)
                        ┌──────────────▼──────────────────┐
                        │       tarcoind (full node)        │
                        │   txindex=1  |  -server=1         │
                        └──────────────┬──────────────────┘
                                       │ P2P :19333
                        ┌──────────────▼──────────────────┐
                        │         TARCOIN Network           │
                        │     (miners, peers, nodes)        │
                        └─────────────────────────────────┘

Mobile / Desktop Wallet
        │
        │ Electrum Protocol (SSL :50002)
        ▼
   HAProxy → ElectrumX → tarcoind → TARCOIN Network
```

---

## Components

### tarcoind (Full Node)

| Property | Value |
|---|---|
| Base | TARCOIN Core (Bitcoin Core v31.x fork) |
| P2P Port | `19333` |
| RPC Port | `19332` (internal only — never expose) |
| Required flags | `-txindex=1 -server=1` |
| Consensus | SHA256d PoW + DarkGravityWave v3 |
| Genesis | `0000e37ee7aa8a88...fbd9939e` |

### ElectrumX Server

| Property | Value |
|---|---|
| Source | [spesmilo/electrumx](https://github.com/spesmilo/electrumx) |
| Patch | `coins_tarcoin.py` injected via `apply_patch.py` |
| TCP Port | `50001` (internal only) |
| SSL Port | `50002` (public-facing) |
| WSS Port | `50004` (WebSocket TLS) |
| Database | LevelDB (`/data/electrumx`) |

### HAProxy (Load Balancer)

| Property | Value |
|---|---|
| Algorithm | Least connections |
| Health check | TCP connect every 30s |
| Ports forwarded | 50001, 50002, 50004 |
| Stats page | `http://127.0.0.1:8404/stats` |

### TARWallet (Mobile)

| Property | Value |
|---|---|
| Base | BlueWallet (React Native, MIT) |
| Platforms | iOS 14+ / Android 8+ |
| BIP44 coin type | `5050` — SLIP-0044 PR [#2030](https://github.com/satoshilabs/slips/pull/2030) |
| Default server | `ssl://electrum.tarcoin.org:50002` |
| Wallet types | BIP44 / BIP49 / BIP84 / BIP86 |

---

## Data Flow

### Balance Check
```
Wallet  →  ElectrumX: blockchain.scripthash.get_balance(scripthash)
ElectrumX  →  LevelDB: lookup indexed UTXO
ElectrumX  →  Wallet: { confirmed: N, unconfirmed: M }
```

### Send Transaction
```
Wallet: sign raw tx locally (private key NEVER leaves device)
Wallet  →  ElectrumX: blockchain.transaction.broadcast(raw_hex)
ElectrumX  →  tarcoind RPC: sendrawtransaction(raw_hex)
tarcoind  →  TARCOIN Network: P2P mempool propagation
```

### New Block (real-time)
```
tarcoind  →  ElectrumX: new block notification
ElectrumX  →  Subscribed wallets: blockchain.headers.subscribe push
```

---

## Network Parameters Reference

| Parameter | Mainnet | Testnet | Regtest |
|---|---|---|---|
| P2P Port | 19333 | 29333 | 18444 |
| RPC Port | 19332 | 29332 | 19443 |
| ElectrumX SSL | 50002 | 60002 | — |
| Bech32 HRP | `tar` | `ttar` | `tarrt` |
| P2PKH prefix | 65 → `T` | 111 → `m/n` | 111 |
| P2SH prefix | 127 → `t` | 196 | 196 |
| WIF prefix | 128 | 239 | 239 |
| BIP32 xpub | `0488B21E` | `043587CF` | `043587CF` |
| BIP32 xprv | `0488ADE4` | `04358394` | `04358394` |
| Magic bytes | `74 61 72 63` | `fc c1 b7 dc` | `fa bf b5 da` |
| BIP44 coin type | 5050 | 1 (testnet) | — |

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| ElectrumX fork | spesmilo/electrumx | Canonical, actively maintained |
| Coin class injection | Patch script | Upstream-compatible, survives `git pull` |
| Mobile wallet base | BlueWallet | React Native, MIT, iOS+Android, feature-rich |
| TLS | Let's Encrypt | Free, auto-renewing |
| Load balancer | HAProxy | Battle-tested TCP proxy |
| Database | LevelDB | Native ElectrumX choice |
| BIP44 coin type | 5050 | Registered via SLIP-0044 PR #2030 |

---

## Ports Summary

| Port | Service | Exposure |
|---|---|---|
| `19332` | tarcoind RPC | Internal only |
| `19333` | TARCOIN P2P | Public |
| `50001` | ElectrumX TCP | Internal (behind HAProxy) |
| `50002` | ElectrumX SSL | Public |
| `50004` | ElectrumX WSS | Public |
| `8404` | HAProxy stats | localhost only |
| `9090` | Prometheus | localhost only |
| `3000` | Grafana | localhost (SSH tunnel) |

---

## Repository Structure

```
TARCOIN/
├── blockchain_core/            ← TARCOIN Core (source of truth)
│   └── tarcoin-core/src/kernel/chainparams.cpp
├── electrumx/                  ← ElectrumX TARCOIN integration
│   ├── coins_tarcoin.py        ← Coin class patch
│   ├── Dockerfile / docker-compose.yml
│   ├── config/                 ← mainnet + testnet + tarcoin.conf
│   ├── nginx/ / scripts/ / systemd/
├── wallet/                     ← TARWallet (BlueWallet fork)
│   ├── src/config/             ← network.js, electrum.js, app.js
│   ├── src/models/             ← walletConstants.js
│   ├── patches/ / scripts/
├── infrastructure/             ← Production deployment
│   ├── haproxy/haproxy.cfg
│   ├── docker-compose.prod.yml
│   └── monitoring/             ← Prometheus + Grafana
├── tests/                      ← Test suite
│   ├── test_coin_class.py
│   ├── test_addresses.py
│   └── integration_regtest.sh
└── docs/                       ← Documentation
    ├── ARCHITECTURE.md
    ├── SECURITY_AUDIT.md
    ├── ELECTRUMX_DEPLOYMENT.md
    └── MOBILE_WALLET.md
```