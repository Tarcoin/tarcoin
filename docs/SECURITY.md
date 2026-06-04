# TARCOIN Security Documentation

## Security Philosophy

TARCOIN follows Bitcoin's security model exactly. Every design decision prioritizes **security over convenience**, **decentralization over speed**, and **immutability over flexibility**.

### Core Principles

1. **No Admin Controls** — No backdoors, master keys, or administrative overrides
2. **No Centralized Minting** — Supply is fixed by consensus, not by any authority
3. **No Freeze Functions** — Transactions are irreversible once confirmed
4. **No Reversible Transactions** — No chargebacks or rollbacks
5. **No Custodial Systems** — Users control their own private keys
6. **Immutable After Launch** — Consensus rules cannot be changed post-deployment

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| **51% Attack** | Distributed mining, multiple pools, checkpoint support (early only) |
| **Double Spend** | Full node UTXO verification, mempool orphan detection |
| **Reorg Attack** | Bitcoin-standard reorg handling, 100-block coinbase maturity |
| **Sybil Attack** | DNS seeds from multiple providers, manual peer connections |
| **Eclipse Attack** | Multiple peer connections, random node selection |
| **Time Wrap Attack** | Bitcoin-standard timestamp validation |
| **Fee Sniping** | Replace-by-fee support, mempool policy |
| **Wallet Theft** | AES-256 encryption, passphrase protection, cold storage |
| **RPC Exploitation** | Internal network only, authentication required, rate limited |
| **Infrastructure Attack** | DDoS protection via Cloudflare + Nginx, rate limiting, fail2ban |

## Network Security

### Firewall Configuration
```
# Seed Node Firewall Rules
Chain INPUT (policy DROP)
ACCEPT     tcp  --  0.0.0.0/0    0.0.0.0/0    tcp dpt:19333  # P2P mainnet
ACCEPT     tcp  --  0.0.0.0/0    0.0.0.0/0    tcp dpt:22     # SSH (key only)
ACCEPT     tcp  --  0.0.0.0/0    0.0.0.0/0    tcp dpt:80     # HTTP redirect
ACCEPT     tcp  --  0.0.0.0/0    0.0.0.0/0    tcp dpt:443    # HTTPS
ACCEPT     all  --  10.0.0.0/8   0.0.0.0/0                 # Internal network

# RPC Port 19332 - INTERNAL ACCESS ONLY
ACCEPT     tcp  --  10.0.0.0/8   0.0.0.0/0    tcp dpt:19332
DROP       tcp  --  0.0.0.0/0    0.0.0.0/0    tcp dpt:19332
```

### DDoS Protection
- **Layer 3/4:** Cloudflare proxying
- **Layer 7:** Nginx rate limiting (30-100 req/s per endpoint)
- **Sync flood:** SYN cookies enabled
- **Amplification:** Disabled ICMP, UDP rate limiting

## Wallet Security

### Cold Storage Procedure

```
1. Boot air-gapped machine (never connected to internet)
2. Generate TARCOIN wallet
3. Record public addresses only
4. Create encrypted backups:
   a. Encrypted USB (AES-256)
   b. Paper backup (BIP39 seed phrase)
   c. Optional: Steel seed backup
5. Verify backup integrity
6. Wipe air-gapped machine
7. Store backups in geographically separated locations
```

### Key Management Rules
- Private keys must never exist on internet-connected systems
- Seed phrases must never be screenshotted, photographed, or digitally stored
- Backups must be encrypted with strong passphrases
- Multiple geographically separated backups required
- Hardware security module (HSM) for seed node signing keys

### Wallet Encryption
- Algorithm: AES-256-CBC
- Key derivation: PBKDF2-HMAC-SHA512
- Iterations: 2048 (Bitcoin standard)
- Salt: Random 128-bit per wallet

## Infrastructure Security

### Access Control
- SSH key-based authentication only (no passwords)
- SSH allowed from management IPs only
- All administrative access logged and monitored
- Principle of least privilege for all services
- Regular access audits

### Monitoring & Alerting
- **Prometheus:** System metrics, node health
- **Grafana:** Real-time dashboards, alert rules
- **Loki:** Centralized log aggregation
- **Alertmanager:** PagerDuty/Slack/Email alerts
- **Uptime monitoring:** External uptime checks every 5 minutes

### Alert Thresholds
| Alert | Threshold | Response |
|-------|-----------|----------|
| Node offline | > 5 min downtime | Auto-restart, notify admin |
| Block height stale | > 30 min no new blocks | Investigate consensus issue |
| Memory usage | > 85% | Scale up or investigate leak |
| Disk usage | > 80% | Clean old logs, scale storage |
| RPC failure rate | > 5% errors | Investigate tarcoind health |
| DDoS detection | > 1000 req/s | Enable stricter rate limits |

## Audit Checklist (Pre-Launch)

### Blockchain Layer
- [x] Consensus rules match Bitcoin Core (diff: only chainparams, amount.h)
- [x] Supply constants verified (50 billion max, 50,000 TAR genesis reward)
- [x] Halving schedule correct (50,000 TAR → 25,000 → 12,500 → ...)
- [x] Genesis block hash publicly verifiable (`000074c6...f44bd7e0`)
- [x] Genesis merkle root verified (`1fa777a3...2b749`)
- [x] Genesis nBits (`0x1f00ffff`) within powLimit (`0000ffff...`)
- [x] Address prefixes correct (tar1, T)
- [x] Network ports correct (P2P: 19333, RPC: 19332)
- [x] `CLIENT_VERSION_IS_RELEASE = true` set
- [ ] No hidden consensus modifications (audit pending)
- [ ] No backdoors or admin RPCs (audit pending)
- [ ] No developer key privileges (audit pending)
- [x] Bitcoin script validation preserved

### Infrastructure Layer
- [ ] DNS records configured correctly
- [ ] SSL/TLS certificates issued and valid
- [ ] Cloudflare configured for DDoS protection
- [ ] Firewall rules applied and verified
- [ ] Fail2ban configured for SSH
- [ ] Automatic backups configured and tested
- [ ] Monitoring stack operational
- [ ] All services health-checked
- [ ] Rate limiting verified
- [ ] No default passwords in production

### Privacy Layer
- [ ] No personally identifiable information in repos
- [ ] No real names in commits or code
- [ ] No personal email addresses
- [ ] Build metadata sanitized
- [ ] CI/CD logs sanitized
- [ ] DNS registrar WHOIS privacy enabled
- [ ] Cloud accounts using pseudonymous identities
- [ ] No KYC-linked wallets in infrastructure

## Disaster Recovery

### Backup Strategy
```
Data           Frequency    Retention    Location
────           ─────────    ────────     ────────
Blockchain     Daily        30 days      Offsite + Cloud
Wallet files   Hourly       7 days       Encrypted + Geographically separated
Configuration  Per change   1 year       Git + Offsite backup
SSL keys       Per renewal  5 years      Hardware security module + Paper backup
Database       Daily        30 days      Offsite + Cloud
```

### Recovery Procedures

#### Node Failure
```bash
# Automatic: Docker restart policy (unless-stopped)
docker compose up -d tarcoind

# Manual: Reindex from genesis
docker compose exec tarcoind tarcoind -reindex

# Full restore: Download blockchain snapshot
wget https://snapshots.tarcoin.org/blockchain.tar.gz
tar -xzf blockchain.tar.gz -C /home/tarcoin/.tarcoin/
```

#### Database Failure
```bash
# Restore from backup
docker compose exec postgres pg_restore -U tarcoin -d tarcoin /backups/latest.dump
```

#### Complete Infrastructure Failure
```bash
# Deploy new node
docker compose up -d

# Wait for blockchain sync
# Restore from latest backup
# Verify services operational
```

## Security Contact

For security vulnerabilities, contact: **security@tarcoin.org**

Please encrypt sensitive reports using the TARCOIN security PGP key.

**Responsible disclosure policy:** We commit to acknowledging reports within 24 hours and issuing fixes within 72 hours for critical vulnerabilities.