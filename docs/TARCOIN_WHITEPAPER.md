# TARCOIN Technical Whitepaper
## A UTXO-Based Decentralized Cryptocurrency Ecosystem Built on Battle-Tested Proof-of-Work Architecture

**Version:** 1.0.0
**Date:** May 2026
**Status:** Live — Mainnet Running

---

## Abstract

TARCOIN (TAR) is a fully decentralized, UTXO-based cryptocurrency built on a battle-tested Proof-of-Work blockchain foundation derived from Bitcoin Core. It inherits the complete security model — SHA256d Proof-of-Work, UTXO transaction model, secp256k1 elliptic curve cryptography, ECDSA signatures, Bitcoin Script, Merkle trees, difficulty retargeting, SegWit, and longest-chain consensus — while introducing a distinct identity, custom supply parameters, and a complete web/mobile ecosystem.

Unlike experimental blockchain projects that modify consensus rules or introduce centralized components, TARCOIN remains faithful to the proven principles of decentralized consensus, ensuring maximum security, ASIC miner compatibility, and long-term stability.

---

## 1. Introduction

### 1.1 Philosophy

TARCOIN follows the original Bitcoin philosophy: a peer-to-peer electronic cash system that is decentralized, permissionless, and immutable. Every design decision prioritizes **security over convenience**, **decentralization over speed**, and **immutability over flexibility**.

### 1.2 Design Goals

1. **Battle-Tested Security** — Preserve all Bitcoin consensus rules and cryptographic primitives
2. **ASIC Mining Compatibility** — SHA256d algorithm supports existing Bitcoin mining hardware
3. **Immutable Supply** — Fixed 50 billion TAR supply, enforced by consensus
4. **Decentralized Operation** — No admin controls, no backdoors, no central authority
5. **Privacy-Preserving Development** — Secure, anonymous development and deployment
6. **Production Infrastructure** — Explorer, API, mining pool, wallets, monitoring

---

## 2. Technical Architecture

### 2.1 Blockchain Foundation

TARCOIN is derived from Bitcoin Core v31.x. Only the following components are modified:

- **Supply constants** (`amount.h`)
- **Network parameters** (`chainparams.cpp` — magic bytes, ports, DNS seeds, checkpoints)
- **Address prefixes** (bech32: `tar1`, base58: `T`)
- **Branding** (coin name, ticker, UI identity)
- **Genesis block** (unique hash, treasury allocation)

Everything else — validation logic, consensus engine, networking, mempool, wallet encryption, RPC interface — remains **identical to the upstream Bitcoin Core implementation**, ensuring full compatibility with the Bitcoin security model.

### 2.2 Cryptographic Primitives

| Component | Standard |
|-----------|----------|
| Hashing Algorithm | SHA256d (double SHA-256) |
| Elliptic Curve | secp256k1 |
| Signature Algorithm | ECDSA |
| Address Format | Bech32 (SegWit) and Base58 (Legacy) |
| Merkle Trees | Binary Merkle (Bitcoin standard) |
| Script Language | Bitcoin Script |

### 2.3 Supply Schedule

```
Total Supply:           50,000,000,000 TAR
Ecosystem Treasury:     10,000,000,000 TAR (20%)
Public Mining Supply:   40,000,000,000 TAR (80%)
Block Reward:           50,000 TAR
Halving Interval:       400,000 blocks
Block Time:             10 minutes
```

#### Emission Schedule

```
Era 1:  Block 0 - 400,000           | 50,000 TAR/block | ~7.6 years | 20,000,000,000 TAR
Era 2:  Block 400,001 - 800,000     | 25,000 TAR/block | ~7.6 years | 10,000,000,000 TAR
Era 3:  Block 800,001 - 1,200,000   | 12,500 TAR/block | ~7.6 years |  5,000,000,000 TAR
Era 4:  Block 1,200,001 - 1,600,000 |  6,250 TAR/block | ~7.6 years |  2,500,000,000 TAR
...emission continues halving every 400,000 blocks until the maximum supply is reached
```

The public mining supply of 40 billion TAR is designed for emission over an estimated **15–20 year** timeframe through progressive halvings every 400,000 blocks. The block reward starts at 50,000 TAR and halves at each 400,000-block interval — ensuring the vast majority of mineable supply is distributed in the early eras while extending the emission schedule to incentivize long-term mining participation.

Additional halving eras continue beyond Era 4 until the remaining mineable supply is emitted. The emission schedule follows progressive halvings every 400,000 blocks until the maximum mineable supply of 40 billion TAR is distributed.

---

## 3. Network Architecture

### 3.1 Network Parameters

| Parameter | Mainnet | Testnet | Regtest |
|-----------|---------|---------|---------|
| P2P Port | 19333 | 18333 | 18444 |
| RPC Port | 19332 | 18332 | 18443 |
| Magic Bytes | 0xfabfb5da | 0x0b110907 | 0xfabfb5da |
| Address Prefix | tar1 / T | tar1 / T | tar1 / T |

#### TARCOIN Mainnet Parameters

| Parameter | Value |
|-----------|-------|
| Coin Name | TARCOIN |
| Symbol | TAR |
| Consensus | SHA256d Proof-of-Work |
| Block Time | 10 minutes (Bitcoin-standard) |
| Initial Block Reward | 50,000 TAR |
| Halving Interval | 400,000 blocks |
| Maximum Supply | 50,000,000,000 TAR |
| Mineable Supply | 40,000,000,000 TAR (80%) |
| Ecosystem Treasury | 10,000,000,000 TAR (20%) |
| P2P Port | 19333 |
| RPC Port | 19332 |
| Bech32 Address Prefix | tar1 |

### 3.2 DNS Seed Nodes

Seed nodes are deployed across multiple cloud providers (DigitalOcean, AWS, Hetzner, Vultr) to ensure network resilience. Each seed node runs a full archive node.

### 3.3 Peer-to-Peer Protocol

TARCOIN uses the standard Bitcoin-compatible P2P protocol:
- **Version/VerAck** handshake
- **Inv/GetData** inventory propagation
- **Headers/GetHeaders** block header sync
- **Block/Tx** data propagation
- **Addr** peer discovery
- **Ping/Pong** keepalive
- **FeeFilter** fee relay

---

## 4. Consensus Rules

### 4.1 Proof-of-Work

SHA256d Proof-of-Work with difficulty retargeting every 2016 blocks (approximately 2 weeks). Difficulty adjusts based on the time taken to mine the previous 2016 blocks, maintaining a ~10-minute average block time.

### 4.2 Block Validation

Block validation follows the Bitcoin Core consensus standard:
- Verify block header hash meets difficulty target
- Verify Merkle root matches transactions
- Verify all transaction inputs reference valid UTXOs
- Verify no double-spends within the block
- Verify block size ≤ 1MB (base) / 4MB (SegWit)
- Verify signature operations limits
- Verify coinbase maturity

### 4.3 Genesis Block

The TARCOIN genesis block was successfully mined and verified on mainnet.

| Field | Value |
|-------|-------|
| Block Hash | `000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0` |
| Merkle Root | `1fa777a38f96e44bb26591573ed2b22d5b40d7a63067201a40ad3b214152b749` |
| Timestamp | `1748304000` (2025-05-27 00:00:00 UTC) |
| nBits | `0x1f00ffff` |
| Nonce | `15878` |
| Block Reward | `50,000 TAR` |
| PoW Target | `0000ffff00000000000000000000000000000000000000000000000000000000` |
| powLimit | `0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff` |
| Height | `0` |

The genesis block is **hardcoded** into [`chainparams.cpp`](../blockchain_core/tarcoin-core/src/kernel/chainparams.cpp) and verified by `assert()` on every node startup.

---

## 5. Long-Term Ecosystem Treasury Security

### 5.1 Offline Generation

The ecosystem treasury wallet is created entirely offline using an **air-gapped machine** that has never been connected to the internet.

**Process:**
1. Generate wallet on air-gapped machine
2. Record public address only (publicly verifiable)
3. Create multiple encrypted backups (USB, paper, steel)
4. Transfer public address to development environment
5. Hardcode address into [`chainparams.cpp`](../blockchain_core/chainparams.cpp)
6. Destroy intermediate systems

### 5.2 Private Key Security

The treasury private key:
- **MUST NEVER** touch any internet-connected system
- **MUST NEVER** be stored in repositories or cloud systems
- **MUST NEVER** be logged or screenshotted
- **MUST** have geographically separated backups
- **MUST** follow industry-standard cold storage key management best practices

### 5.3 Transparency & Immutability

Once the genesis block is mined:
- The ecosystem treasury allocation is permanent and immutable
- No mechanism exists to modify the supply or allocation
- All treasury transactions are publicly recorded on the blockchain
- No individual or entity has unilateral control over treasury funds
- The blockchain operates independently of any developer or entity

---

## 6. Security Model

### 6.1 Attack Mitigation

#### 51% Attack Protection (Early Network)
- Encourage distributed mining participation
- Deploy multiple mining pools
- Public mining awareness campaign
- Optional temporary checkpoints if required (for initial security only)
- Rapid hashrate growth through ASIC compatibility

#### Reorg Protection
- Bitcoin-standard reorganization handling
- 100-block maturity for coinbase outputs
- Merkle tree verification
- Checkpoints at regular intervals

#### Double-Spend Protection
- Full node validation
- Mempool orphan detection
- Replace-by-fee (RBF) support
- UTXO set verification

### 6.2 Wallet Security
- AES-256 encrypted wallet.dat files
- BIP39/BIP32 mnemonic seed phrases
- Passphrase protection
- Offline transaction signing (cold storage)
- Hardware wallet compatibility roadmap

### 6.3 Network Security
- Full node validation only (no SPV reliance)
- Tor/I2P support for privacy
- Encrypted P2P connections (BIP324)
- DoS protection (limit counters, penalty system)

---

## 7. Infrastructure Architecture

### 7.1 Explorer ([`explorer/`](../explorer/))

The blockchain explorer provides:
- Real-time block, transaction, and address lookup
- Mempool monitoring
- Difficulty and hashrate charts
- Supply tracking and rich list
- WebSocket live updates
- Redis-cached API for performance

### 7.2 API ([`api/`](../api/))

RESTful API with:
- Comprehensive blockchain data endpoints
- Wallet utilities (address validation, fee estimation)
- Mining information
- Swagger documentation
- Rate limiting and DDoS protection

### 7.3 Mining Pool ([`mining_pool/`](../mining_pool/))

Full-featured mining pool:
- Stratum protocol server (port 3333)
- Worker management and monitoring
- Share tracking with Redis
- Payout engine
- ASIC miner compatibility
- Pool dashboard

### 7.4 Website ([`website/`](../website/))

Built with Next.js, featuring:
- Cyberpunk/gold-black aesthetic
- Framer Motion animations
- Three.js particle effects
- Responsive design
- SEO optimized

---

## 8. Deployment Architecture

### 8.1 Docker Stack

All services are containerized for deterministic deployment.

**Services:**
- `tarcoind` — Blockchain node
- `explorer` — Blockchain explorer
- `api` — REST API
- `mining-pool` — Mining pool + Stratum
- `website` — Next.js frontend
- `nginx` — Reverse proxy (SSL termination, DDoS protection)
- `redis` — Cache layer
- `postgres` — Database
- `prometheus` / `grafana` / `loki` — Monitoring

### 8.2 Infrastructure Requirements

| Service | CPU | RAM | Storage | Network |
|---------|-----|-----|---------|---------|
| tarcoind (archive) | 8 cores | 16 GB | 1+ TB SSD | 1 Gbps |
| tarcoind (pruned) | 4 cores | 8 GB | 50 GB SSD | 100 Mbps |
| Explorer + API | 4 cores | 8 GB | 100 GB SSD | 1 Gbps |
| Mining Pool | 4 cores | 8 GB | 50 GB SSD | 1 Gbps |
| Website | 2 cores | 4 GB | 20 GB SSD | 100 Mbps |
| Monitoring | 2 cores | 4 GB | 100 GB SSD | 100 Mbps |

### 8.3 Cloud Providers Supported
- DigitalOcean
- AWS (EC2, EKS)
- Hetzner
- Vultr

---

## 9. Testing & Audit

### 9.1 Mandatory Audits (Pre-Launch)

1. **Consensus Audit** — Verify all consensus rules match Bitcoin Core
2. **Supply Audit** — Verify supply constants, halving schedule, ecosystem treasury allocation
3. **Wallet Penetration Test** — Secure key storage, encryption, signing
4. **RPC Security Audit** — No unauthorized access, injection, or exposure
5. **API Security Testing** — Rate limiting, SQL injection, XSS, CSRF
6. **Memory Analysis** — No leaks in long-running processes
7. **Reorg Attack Simulation** — Network partition handling
8. **51% Attack Simulation** — Chain reorganization resilience
9. **Mining Stress Test** — Pool and Stratum server capacity
10. **P2P Network Test** — Peer discovery, propagation, DoS resilience

### 9.2 Deterministic Builds

All releases must be:
- Deterministic (same source → same binary)
- Reproducible (anyone can verify)
- Publicly auditable
- Signed with release keys

---

## 10. Launch Checklist

### Pre-Launch
- [x] Genesis block mined and verified (`000074c6...f44bd7e0`)
- [x] TARCOIN Core v31.x compiled and running
- [x] Mainnet node boots and passes PoW validation
- [x] `powLimit` aligned with genesis `nBits` (`0x1f00ffff`)
- [x] Genesis hash and merkle root `assert()` verified on startup
- [x] `CLIENT_VERSION_IS_RELEASE = true` set
- [ ] Seed nodes deployed (DNS seeds live)
- [ ] Explorer backend verified
- [ ] Wallet binaries built and signed
- [ ] Mining pool configured and tested
- [ ] Infrastructure stress-tested
- [ ] Monitoring stack operational
- [ ] DNS records configured
- [ ] SSL certificates issued
- [ ] Cloudflare configured
- [ ] CI/CD pipeline validated
- [ ] Deterministic builds confirmed
- [ ] Source code publicly released

### Launch
- [ ] Seed nodes go online
- [ ] Explorer goes online
- [ ] Mining pool activates
- [ ] Wallet downloads available
- [ ] Website published
- [ ] API operational
- [ ] Social media announcements
- [ ] Mining campaigns begin

### Post-Launch
- [ ] Network monitoring
- [ ] Community support channels
- [ ] Bug bounty program
- [ ] Ongoing security audits

> **Transparency Statement:** All critical network parameters, supply allocations, genesis data, and consensus rules are publicly documented and independently verifiable from the TARCOIN source code.

---

## 11. Governance

TARCOIN operates without any centralized governance authority. The blockchain is governed solely by its immutable consensus rules, enforced by network participants running full nodes.

- No foundation, corporation, or legal entity controls the network
- No administrative keys or backdoors exist
- No single entity has authority to upgrade or modify the protocol
- No governance tokens or on-chain voting mechanisms
- Development is community-driven through open-source contributions on a best-effort basis
- No individual or organization can alter the supply schedule, consensus rules, or treasury allocation after genesis

The ecosystem treasury of 10 billion TAR is allocated at genesis to a publicly verifiable cold storage address. The treasury allocation is permanently recorded in the genesis block and remains publicly auditable on-chain. The treasury is a permanent, immutable part of the genesis block — its existence does not constitute governance or control.

---

## 12. Conclusion

TARCOIN represents a return to the foundational principles of decentralized cryptocurrency — a secure, permissionless, UTXO-based blockchain network that anyone can mine, use, or build upon. By preserving a battle-tested Proof-of-Work codebase while introducing a unique identity, custom supply parameters, and a complete ecosystem, TARCOIN provides a reliable foundation for long-term value storage and peer-to-peer transactions.

**TARCOIN is not an experiment. It is battle-tested Proof-of-Work architecture, reborn for a new era.**

---

## References

1. Nakamoto, S. "Bitcoin: A Peer-to-Peer Electronic Cash System" (2008)
2. Bitcoin Core — https://github.com/bitcoin/bitcoin
3. BIP 32 — Hierarchical Deterministic Wallets
4. BIP 39 — Mnemonic Code for Generating Deterministic Keys
5. BIP 141 — Segregated Witness (SegWit)
6. BIP 173 — Bech32 Address Format

---

*TARCOIN is released under the MIT License. This whitepaper is for informational purposes only and does not constitute financial advice.*