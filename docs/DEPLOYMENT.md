# TARCOIN Deployment Guide

## Overview

This guide covers deploying TARCOIN infrastructure to production using Docker Compose. The full stack includes blockchain nodes, explorer, API, mining pool, website, and monitoring.

## Prerequisites

- Server with Ubuntu 22.04+ or Debian 12+
- Docker 24+ and Docker Compose v2+
- Domain names configured
- SSL certificates (Let's Encrypt or commercial)
- Minimum 4 CPU cores, 8GB RAM, 100GB SSD

## Quick Deploy

```bash
# Clone repository
git clone https://github.com/tarcoin/tarcoin.git
cd tarcoin

# Configure environment
cp docker/.env.example docker/.env
nano docker/.env  # Set passwords, wallet addresses, etc.

# Deploy full stack
cd docker
docker compose up -d

# Verify all services
docker compose ps
docker compose logs -f
```

## Manual Deployment (Per-Service)

### 1. Blockchain Seed Node

**Requirements:** 8 CPU cores, 16GB RAM, 1TB+ SSD, 1Gbps network

```bash
docker run -d \
  --name tarcoind \
  --restart unless-stopped \
  -p 19333:19333 \
  -p 19332:19332 \
  -v tarcoin-data:/home/tarcoin/.tarcoin \
  -e TARCOIN_VERSION=v31.99.0 \
  tarcoin/tarcoind:latest
  
# Verify synchronization
curl --user tarcoin:tarcoin http://localhost:19332 \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getblockchaininfo","params":[]}'
```

### 2. Explorer + API Server

**Requirements:** 4 CPU cores, 8GB RAM, 100GB SSD

```bash
docker run -d \
  --name tarcoin-explorer \
  --restart unless-stopped \
  -p 4000:4000 \
  -e RPC_HOST=tarcoind \
  -e RPC_PORT=19332 \
  -e RPC_USER=tarcoin \
  -e RPC_PASSWORD=tarcoin \
  tarcoin/explorer:latest
```

### 3. Mining Pool Server

**Requirements:** 4 CPU cores, 8GB RAM, 50GB SSD

```bash
docker run -d \
  --name tarcoin-pool \
  --restart unless-stopped \
  -p 3001:3001 \
  -p 3333:3333 \
  -e RPC_HOST=tarcoind \
  -e RPC_PORT=19332 \
  -e RPC_USER=tarcoin \
  -e RPC_PASS=tarcoin \
  -e POOL_WALLET=tar1... \
  -e POOL_FEE=1 \
  tarcoin/mining-pool:latest
```

### 4. Website Server

**Requirements:** 2 CPU cores, 4GB RAM, 20GB SSD

```bash
docker run -d \
  --name tarcoin-website \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://api.tarcoin.org \
  -e NEXT_PUBLIC_EXPLORER_URL=https://explorer.tarcoin.org \
  tarcoin/website:latest
```

## DNS Configuration

```
tarcoin.org          A  <server-ip-1>
www.tarcoin.org      CNAME tarcoin.org
explorer.tarcoin.org A  <server-ip-1>
api.tarcoin.org      A  <server-ip-1>
pool.tarcoin.org     A  <server-ip-1>
stratum.tarcoin.org  A  <server-ip-2>  # Separate pool server
seed1.tarcoin.org    A  <seed-node-ip>
seed2.tarcoin.org    A  <seed-node-ip>
seed3.tarcoin.org    A  <seed-node-ip>
```

## Cloudflare Setup

1. Add all domains to Cloudflare
2. Enable proxy (orange cloud) for web traffic
3. Configure SSL/TLS: Full (Strict)
4. Set WAF rules:
   - Rate limiting: 100 req/s per IP
   - Challenge DDoS traffic
   - Block known attack patterns
5. Enable Always Use HTTPS
6. Set Minimum TLS Version: 1.3

## Nginx SSL Configuration

```bash
# Generate Let's Encrypt certificates
docker run -it --rm -p 80:80 \
  -v ./ssl:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d tarcoin.org -d www.tarcoin.org \
  -d explorer.tarcoin.org -d api.tarcoin.org \
  -d pool.tarcoin.org

# Automatic renewal
echo "0 3 * * * docker run --rm -v ./ssl:/etc/letsencrypt certbot/certbot renew" | crontab -
```

## Monitoring Setup

```bash
# Prometheus
docker compose up -d prometheus

# Grafana
docker compose up -d grafana

# Loki (log aggregation)
docker compose up -d loki

# Import dashboards
curl -X POST http://admin:admin@localhost:3001/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @monitoring/grafana/dashboards/tarcoin-node.json
```

## Backup Configuration

```bash
# Automated backup script
cat > /usr/local/bin/backup-tarcoin.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/tarcoin/$DATE"

mkdir -p $BACKUP_DIR

# Backup blockchain data
docker exec tarcoind tar -czf $BACKUP_DIR/blockchain.tar.gz /home/tarcoin/.tarcoin/blocks

# Backup wallet
docker exec tarcoind tar -czf $BACKUP_DIR/wallet.tar.gz /home/tarcoin/.tarcoin/wallet.dat

# Encrypt backups
gpg --encrypt --recipient backup-key $BACKUP_DIR/blockchain.tar.gz
gpg --encrypt --recipient backup-key $BACKUP_DIR/wallet.tar.gz

# Upload to offsite storage
rsync -avz $BACKUP_DIR/ backup@offsite:/backups/tarcoin/

# Clean old backups (keep 30 days)
find /backups/tarcoin -type d -mtime +30 -exec rm -rf {} \;
EOF

chmod +x /usr/local/bin/backup-tarcoin.sh
echo "0 4 * * * /usr/local/bin/backup-tarcoin.sh" | crontab -
```

## Pre-Launch Checklist

- [x] Genesis block verified (`000074c6...f44bd7e0`)
- [x] TARCOIN Core v31.x compiled and running on mainnet
- [x] PoW validation passes (`powLimit` aligned with `nBits 0x1f00ffff`)
- [x] `CLIENT_VERSION_IS_RELEASE = true` (no pre-release warning)
- [ ] Seed nodes synchronized and stable
- [ ] Explorer indexing and caching verified
- [ ] API endpoints all responsive (Swagger test)
- [ ] Mining pool Stratum server accepting connections
- [ ] SSL certificates valid and auto-renew configured
- [ ] Cloudflare proxying enabled for all domains
- [ ] Firewall rules applied (only ports 80, 443, 19333 public)
- [ ] Fail2ban configured for SSH protection
- [ ] Monitoring dashboards operational
- [ ] Backup schedule tested and verified
- [ ] DNS propagation confirmed worldwide
- [ ] Rate limiting thresholds verified
- [ ] Node time synchronized (NTP)
- [ ] No personal data in builds or repositories