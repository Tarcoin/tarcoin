# TARCOIN (TAR) — Decentralized SHA256d Proof-of-Work Blockchain

**TARCOIN** is a fully decentralized, UTXO-based blockchain built on forked Bitcoin Core. It preserves Bitcoin-grade security, SHA256d Proof-of-Work mining, UTXO transaction model, and immutable consensus rules while introducing a fixed supply model, ecosystem treasury, and a complete web infrastructure.

## Quick Links

- **Website:** [https://tarcoin.org](https://tarcoin.org)
- **Explorer:** [https://explorer.tarcoin.org](https://explorer.tarcoin.org)
- **API:** [https://api.tarcoin.org](https://api.tarcoin.org)
- **Mining Pool:** [https://pool.tarcoin.org](https://pool.tarcoin.org)
- **GitHub:** [https://github.com/tarcoin/tarcoin](https://github.com/tarcoin/tarcoin)
- **Whitepaper:** [`docs/TARCOIN_WHITEPAPER.md`](docs/TARCOIN_WHITEPAPER.md)

## Specifications

| Parameter | Value |
|-----------|-------|
| **Coin Name** | Tarcoin |
| **Ticker** | TAR |
| **Max Supply** | 50,000,000,000 TAR |
| **Ecosystem Treasury** | 10,000,000,000 TAR |
| **Public Mining Supply** | 40,000,000,000 TAR |
| **Block Reward** | 50,000 TAR |
| **Halving Interval** | 400,000 blocks |
| **Algorithm** | SHA256d |
| **Smallest Unit** | Tar (1 TAR = 100,000,000 Tar) |
| **Block Time** | 10 minutes |
| **Consensus** | Proof-of-Work |
| **Mining Type** | Public ASIC Mining |

## Network Parameters

### Mainnet
- P2P Port: **19333**
- RPC Port: **19332**
- Address Prefix: `tar1` (bech32) / `T` (base58)

### Testnet
- P2P Port: **29333**
- RPC Port: **29332**

### Regtest
- P2P Port: **29333**

## Security Principles

TARCOIN is built on the foundation of Bitcoin's security architecture. The following are **STRICTLY FORBIDDEN**:

- ❌ Hidden admin controls or backdoors
- ❌ Centralized minting or inflation
- ❌ Freeze or reversible transactions
- ❌ Master wallet keys or custodial systems
- ❌ Custom consensus logic or modified cryptography
- ❌ Centralized validator authority

The blockchain becomes **immutable after launch** — exactly like Bitcoin. No individual or entity can modify the consensus rules post-deployment.

## Project Structure

```
TARCOIN/
├── blockchain_core/       # Forked Bitcoin Core with TARCOIN parameters
│   ├── chainparams.cpp    # Genesis block, network parameters, DNS seeds
│   ├── amount.h           # Supply constants
│   ├── validation.cpp     # Bitcoin validation (unchanged)
│   └── README.md          # Build and development guide
├── website/               # Next.js official website (cyberpunk UI)
├── explorer/              # Blockchain explorer backend + frontend
├── api/                   # REST API infrastructure
├── mining_pool/           # Stratum mining pool server
├── wallet/                # Wallet core library
├── docker/                # Docker, Docker Compose, Nginx, Monitoring
│   ├── Dockerfile.*       # Container images for each service
│   ├── docker-compose.yml # Full stack orchestration
│   ├── nginx/             # Reverse proxy with DDoS protection
│   └── monitoring/        # Prometheus, Grafana, Loki configs
├── .github/workflows/     # CI/CD pipeline
└── docs/                  # Comprehensive documentation
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone and Build
```bash
git clone https://github.com/tarcoin/tarcoin.git
cd tarcoin
```

### 2. Start Full Stack (Docker)
```bash
cd docker
docker compose up -d
```

This starts:
- `tarcoind` — Blockchain node
- `website` — TARCOIN website
- `explorer` — Blockchain explorer
- `api` — REST API
- `mining-pool` — Mining pool with Stratum server
- `nginx` — Reverse proxy with SSL
- `redis` — Cache layer
- `postgres` — Database
- `prometheus` + `grafana` + `loki` — Monitoring stack

### 3. Verify Services
```bash
# Blockchain RPC
curl --user tarcoin:tarcoin http://localhost:19332 \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getblockchaininfo","params":[]}'

# Website
curl http://localhost:3000

# Explorer
curl http://localhost:4000/health

# API
curl http://localhost:5000/health

# Mining Pool
curl http://localhost:3001/api/pool/stats
```

## Building from Source (Blockchain Core)

### Linux/macOS
```bash
cd blockchain_core
./autogen.sh
./configure --disable-wallet --disable-gui-tests --with-incompatible-bdb
make -j$(nproc)
sudo make install
tarcoind -daemon
tarcoin-cli getblockchaininfo
```

### Docker Build
```bash
docker build -f docker/Dockerfile.tarcoind -t tarcoin/tarcoind .
docker run -d --name tarcoind -p 19333:19333 -p 19332:19332 tarcoin/tarcoind
```

## Mining

TARCOIN uses **SHA256d** Proof-of-Work, making it compatible with Bitcoin ASIC miners.

### Pool Mining
Connect your miners to:
- **Stratum URL:** `stratum+tcp://pool.tarcoin.org:3333`
- **Backup URL:** `stratum+tcp://pool2.tarcoin.org:3333`
- **Username:** Your TAR wallet address
- **Password:** Anything (or d= difficulty)

### Supported Miners
- Antminer S19/S21 series
- Whatsminer M50/M60 series
- Avalonminer A12+ series
- Any SHA-256 ASIC miner

### Solo Mining
```bash
tarcoind -daemon
tarcoin-cli generatetoaddress 1 <YOUR_ADDRESS>
```

## Wallets

### tarcoin-qt (Desktop GUI)
Download from [https://tarcoin.org/download](https://tarcoin.org/download)
- Windows: `tarcoin-qt-win64.exe`
- macOS: `tarcoin-qt-macos.dmg`
- Linux: `tarcoin-qt-linux.tar.gz`

### tarcoin-cli (Command Line)
```bash
tarcoin-cli -rpcuser=tarcoin -rpcpassword=tarcoin getbalance
tarcoin-cli -rpcuser=tarcoin -rpcpassword=tarcoin sendtoaddress <address> <amount>
```

### Cold Storage
TARCOIN supports full Bitcoin-compatible cold storage:
- Offline wallet generation (air-gapped machine)
- Encrypted `wallet.dat` backups
- BIP39 mnemonic seed phrases
- Offline transaction signing
- Hardware wallet compatibility (in development)

## API Documentation

Full API documentation is available at [https://api.tarcoin.org/docs](https://api.tarcoin.org/docs)

### Endpoints

```bash
# Blockchain Info
GET /api/v1/blockchain/info

# Block by Hash
GET /api/v1/blockchain/block/{hash}

# Block by Height
GET /api/v1/blockchain/block/height/{height}

# Supply Info
GET /api/v1/blockchain/supply

# Difficulty
GET /api/v1/blockchain/difficulty

# Validate Address
GET /api/v1/wallet/validate/{address}

# Mining Info
GET /api/v1/mining/info
```

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Fork Bitcoin Core, modify chain parameters, genesis block | ✅ Complete |
| **Phase 2** | Launch testnet, build wallets, explorer backend | ✅ Complete |
| **Phase 3** | Build website, APIs, mining pool | ✅ Complete |
| **Phase 4** | Security testing, infrastructure deployment, public testing | ✅ Complete |
| **Phase 5** | Mainnet launch, wallet release, mining activation | ✅ Complete |

## Security & Auditing

Before mainnet launch, the following audits are performed:
- Consensus rule verification
- Wallet penetration testing
- RPC security auditing
- API security testing
- Memory leak analysis
- Reorg attack simulation
- 51% attack simulation
- Mining stress testing
- P2P network testing

## Licensing

TARCOIN is released under the **MIT License**.

The blockchain core is a fork of [Bitcoin Core](https://github.com/bitcoin/bitcoin), which is also MIT-licensed.

## Transparency & Privacy

Developer privacy is maintained to ensure network neutrality:
- Pseudonymous maintainer identities
- Metadata-sanitized builds
- Isolated infrastructure
- No personally identifiable information in repositories
- Encrypted and offline treasury wallet

## Ecosystem Treasury Wallet

The Long-Term Ecosystem Treasury wallet is created **entirely offline** using an air-gapped machine:
- Private keys never touch the internet
- Encrypted USB and paper backups
- Geographically separated cold storage
- No individual has unilateral control of treasury keys

Loss of the treasury private key results in permanent loss of access — exactly like Bitcoin.

## Contributing

See [`CONTRIBUTING.md`](docs/CONTRIBUTING.md) for contribution guidelines.

## Community

- [Discord](https://discord.gg/tarcoin)
- [Telegram](https://t.me/tarcoin)
- [Twitter/X](https://twitter.com/tarcoin)

---

**TARCOIN — Decentralized. Immutable. Proof-of-Work.**