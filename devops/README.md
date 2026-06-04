# TARCOIN DevOps

Complete infrastructure, deployment, and operations guide for the TARCOIN blockchain project.

---

## 📁 Directory Structure

```
devops/
├── README.md                    # This file
├── scripts/
│   ├── setup-server.sh          # Initial VPS provisioning (run once)
│   ├── deploy.sh                # Full deployment with rolling restart
│   ├── health-check.sh          # Endpoint health checks (CI/cron)
│   ├── backup.sh                # Backup blockchain, DB, configs
│   ├── ssl-setup.sh             # Let's Encrypt cert acquisition & renewal
│   ├── update.sh                # Rolling update with auto-rollback
│   ├── monitor-node.sh          # Continuous blockchain node monitor
│   └── init-env.sh              # Environment file bootstrapper
├── docker/
│   ├── override-dev.yml         # Docker Compose override – local dev
│   └── override-staging.yml     # Docker Compose override – staging
├── monitoring/
│   ├── alerts.yml               # Prometheus alerting rules
│   ├── grafana-datasource.yml   # Grafana provisioning datasources
│   └── discord-alerts.sh        # Shared Discord webhook notification lib
└── cron/
    └── crontab.example          # Example cron entries for production
```

---

## 🧰 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Engine | 24+ | https://docs.docker.com/engine/install/ubuntu/ |
| Docker Compose v2 | 2.20+ | Bundled with Docker Desktop / `apt install docker-compose-plugin` |
| Node.js | 20 LTS | Via nvm: `nvm install 20` |
| Git | 2.40+ | `apt install git` |
| WSL2 | (dev only) | Windows feature, Ubuntu 22.04 recommended |
| aws CLI | v2 (optional) | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| Certbot | Latest | `apt install certbot` |

> **WSL2 path note:** The project root on the host is `d:\TARCOIN`; inside WSL it maps to `/mnt/d/TARCOIN`.

---

## 🚀 Quick Start

### Local Development (WSL2 / Docker Desktop)

```bash
# 1. Bootstrap environment files
bash devops/scripts/init-env.sh

# 2. Start all services in dev mode (hot-reload volumes)
cd docker
docker compose -f docker-compose.yml -f ../devops/docker/override-dev.yml up -d

# 3. Verify everything is running
bash devops/scripts/health-check.sh
```

**Service URLs (dev):**

| Service | URL |
|---------|-----|
| Website | http://localhost:3000 |
| Mining Pool API | http://localhost:3001 |
| Explorer Frontend | http://localhost:4001 |
| API Server | http://localhost:5000 |
| Explorer Backend | http://localhost:4000 |
| Grafana | http://localhost:3002 |
| Prometheus | http://localhost:9090 |

---

### Production Deployment (Ubuntu 22.04 VPS)

```bash
# 1. Provision a fresh server (run as root, only once)
bash devops/scripts/setup-server.sh

# 2. SSH back in as tarcoin user, clone repo
ssh tarcoin@your-server-ip
cd /opt/tarcoin
git clone git@github.com:tarcoin/tarcoin.git .

# 3. Initialise environment
bash devops/scripts/init-env.sh

# 4. Obtain SSL certificates
bash devops/scripts/ssl-setup.sh --env production

# 5. Deploy all services
bash devops/scripts/deploy.sh --env production --service all
```

---

## 📜 Scripts Reference

### `setup-server.sh`

Initial VPS provisioning. **Run once** as root on a fresh Ubuntu 22.04 server.

```bash
bash devops/scripts/setup-server.sh
```

Actions:
- Updates all system packages
- Installs Docker Engine + Compose v2
- Installs Node.js 20 via nvm (for the `tarcoin` user)
- Installs Certbot
- Creates `/opt/tarcoin` working directory and `tarcoin` system user
- Configures UFW firewall
- Sets up log rotation under `/var/log/tarcoin/`
- Clones the repository

---

### `deploy.sh`

Full deployment pipeline with rolling restarts.

```bash
# Deploy everything to production
bash devops/scripts/deploy.sh --env production --service all

# Deploy only the API server
bash devops/scripts/deploy.sh --env production --service api

# Dry run – shows what would happen without doing it
bash devops/scripts/deploy.sh --env production --service all --dry-run

# Deploy to staging
bash devops/scripts/deploy.sh --env staging --service all
```

**Flags:**

| Flag | Values | Description |
|------|--------|-------------|
| `--env` | `production`, `staging` | Target environment (required) |
| `--service` | `all`, `tarcoind`, `explorer`, `api`, `pool`, `website` | Service to deploy |
| `--dry-run` | — | Simulate without applying changes |

**Flow:**
1. `git pull` latest changes
2. `npm ci && npm run build` for changed Node.js services
3. Build Docker images tagged with git SHA
4. Rolling restart per service, wait for health check
5. Post-deploy health check on all endpoints
6. Webhook notification on success/failure

Logs: `/var/log/tarcoin/deploy.log`

---

### `health-check.sh`

Checks all service endpoints and returns colored status.

```bash
# One-time check
bash devops/scripts/health-check.sh

# Watch mode – refreshes every 30 seconds
bash devops/scripts/health-check.sh --watch

# Use in CI (exit code 1 on any failure)
bash devops/scripts/health-check.sh && echo "All healthy"
```

Exit codes: `0` = all services healthy, `1` = one or more failed.

---

### `backup.sh`

Creates a compressed backup of all persistent data.

```bash
# Create a backup
bash devops/scripts/backup.sh

# Restore from a backup archive
bash devops/scripts/backup.sh --restore /backups/tarcoin-backup-2026-05-30.tar.gz
```

What is backed up:
- `tarcoin-data` Docker volume (blockchain)
- PostgreSQL database via `pg_dump`
- Redis RDB snapshot
- All `.env` configuration files

Backups are stored in `/backups/` locally and optionally uploaded to S3.  
Local copies older than 7 days are pruned automatically.

---

### `ssl-setup.sh`

Acquires and installs TLS certificates.

```bash
# Production – Let's Encrypt certificates
bash devops/scripts/ssl-setup.sh --env production

# Staging – self-signed certificates
bash devops/scripts/ssl-setup.sh --env staging
```

Domains covered: `tarcoin.org`, `www.tarcoin.org`, `explorer.tarcoin.org`,  
`api.tarcoin.org`, `pool.tarcoin.org`

Auto-renewal is configured via cron. See `cron/crontab.example`.

---

### `update.sh`

Intelligent rolling update – only rebuilds what changed.

```bash
bash devops/scripts/update.sh
```

Flow:
1. `git pull` (aborts on conflicts)
2. Diff against previous HEAD to detect changed services
3. `npm ci` only for changed Node.js services
4. Rebuild only changed Docker images
5. One-by-one rolling restart with health check between each
6. Auto-rollback to previous image tag on failure
7. Discord summary (if webhook configured)

---

### `monitor-node.sh`

Continuous blockchain node health monitor.

```bash
# Run in foreground (Ctrl+C to stop)
bash devops/scripts/monitor-node.sh

# Run as a daemon in the background
bash devops/scripts/monitor-node.sh --daemon
```

Polls every 60 seconds. Alerts if:
- Block height unchanged for > 20 minutes
- Peer connections < 2
- Disk usage > 80 %

Metrics are written to `/var/log/tarcoin/node-metrics.log` in JSON format.  
Auto-restarts `tarcoind` after 3 consecutive failures.

---

### `init-env.sh`

Bootstraps all `.env` files with secure random secrets.

```bash
bash devops/scripts/init-env.sh
```

- Generates 32-character random passwords for `POSTGRES_PASSWORD`, `GRAFANA_PASSWORD`, `RPC_PASSWORD`
- Prompts for `POOL_WALLET`, domain name, Discord webhook
- Validates the TARCOIN wallet address format (`tar1…` or `T…`)
- Creates `docker/.env`, `explorer/.env`, `api/.env`, `mining_pool/.env`

---

## 🌍 Environment Variables Reference

These live in `docker/.env` (copied from `docker/.env.example`).

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | ✅ | PostgreSQL username |
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL password (auto-generated) |
| `POSTGRES_DB` | ✅ | Database name (default: `tarcoin`) |
| `RPC_USER` | ✅ | tarcoind RPC username |
| `RPC_PASSWORD` | ✅ | tarcoind RPC password (auto-generated) |
| `POOL_WALLET` | ✅ | Mining pool payout wallet address |
| `GRAFANA_PASSWORD` | ✅ | Grafana admin password (auto-generated) |
| `DOMAIN` | ✅ | Primary domain (e.g. `tarcoin.org`) |
| `DISCORD_WEBHOOK_URL` | ⬜ | Discord webhook for alerts |
| `AWS_S3_BUCKET` | ⬜ | S3 bucket for remote backups |
| `AWS_ACCESS_KEY_ID` | ⬜ | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | ⬜ | AWS secret key |
| `CERTBOT_EMAIL` | ⬜ | Email for Let's Encrypt registration |
| `ENVIRONMENT` | ✅ | `production` or `staging` |

---

## 🔁 Deployment Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   TARCOIN Deploy Workflow                    │
└─────────────────────────────────────────────────────────────┘

Developer pushes to main branch
         │
         ▼
  git pull on server
         │
         ▼
  npm ci + build  ←── only changed services
         │
         ▼
  docker build --tag sha-<GIT_SHA>
         │
         ▼
  ┌──────────────────────────────┐
  │  Rolling restart loop:       │
  │  for each changed service:   │
  │    docker compose up -d svc  │
  │    wait_for_health_check()   │
  │    if failed → rollback()    │
  └──────────────────────────────┘
         │
         ▼
  Post-deploy health check (all endpoints)
         │
         ▼
  Send Discord/webhook notification
```

### Manual Steps for First Production Deploy

```bash
# On the server as tarcoin user
cd /opt/tarcoin

# 1. Ensure env is complete
bash devops/scripts/init-env.sh

# 2. Get SSL certs
sudo bash devops/scripts/ssl-setup.sh --env production

# 3. Start services
cd docker
docker compose up -d

# 4. Check everything
bash ../devops/scripts/health-check.sh
```

---

## ⏪ Rollback Procedure

### Automatic Rollback (via `update.sh`)

The update script saves the previous image tag. If a health check fails post-update, it automatically rolls back.

### Manual Rollback

```bash
# List available image tags
docker images | grep tarcoin

# Roll back a specific service to a previous SHA
docker compose stop api
docker tag tarcoin-api:sha-<PREVIOUS_SHA> tarcoin-api:latest
docker compose up -d api

# Verify
bash devops/scripts/health-check.sh
```

### Full Rollback (all services)

```bash
# Find the last known-good git SHA from the deploy log
grep "SUCCESS" /var/log/tarcoin/deploy.log | tail -5

# Check out that commit
git checkout <GOOD_SHA>

# Redeploy
bash devops/scripts/deploy.sh --env production --service all
```

---

## 📊 Monitoring URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | https://tarcoin.org:3002 | admin / `$GRAFANA_PASSWORD` |
| Prometheus | http://localhost:9090 | (internal only) |
| Explorer | https://explorer.tarcoin.org | public |
| API | https://api.tarcoin.org/health | public |
| Pool Dashboard | https://pool.tarcoin.org | public |

### Key Dashboards (Grafana)

- **TARCOIN Node** – block height, peer count, mempool size
- **Infrastructure** – CPU, memory, disk per container
- **Mining Pool** – active workers, hashrate, shares
- **API / Explorer** – request rate, error rate, latency

---

## 🔧 Troubleshooting

### `tarcoind` won't sync

```bash
# Check logs
docker compose logs --tail=100 tarcoind

# Check peer connections
docker compose exec tarcoind tarcoin-cli -conf=/etc/tarcoin/tarcoin.conf getpeerinfo | jq length

# Restart with fresh peer discovery
docker compose restart tarcoind
```

### Database connection errors

```bash
# Verify postgres is running
docker compose ps postgres

# Check DB logs
docker compose logs postgres

# Manual connection test
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c '\l'
```

### SSL certificate renewal failed

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Check certbot logs
sudo journalctl -u certbot

# Re-run ssl-setup manually
sudo bash devops/scripts/ssl-setup.sh --env production
```

### Mining pool not accepting connections

```bash
# Check stratum port
nc -zv your-server-ip 3333

# Verify pool config
docker compose exec pool cat /app/config.json | jq .

# Restart pool
docker compose restart pool
```

### High disk usage

```bash
# Find largest consumers
du -sh /var/lib/docker/volumes/*
du -sh /backups/*

# Prune unused Docker resources
docker system prune -f --volumes

# Run backup and prune old ones
bash devops/scripts/backup.sh
```

### Redis memory issues

```bash
docker compose exec redis redis-cli INFO memory
docker compose exec redis redis-cli CONFIG SET maxmemory 512mb
docker compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 🛡️ Security Notes

- All RPC and database passwords are auto-generated (32 chars, random)
- tarcoind RPC is **not** exposed outside Docker network
- UFW blocks all ports except 22, 80, 443, 19333 (P2P), 3333 (Stratum)
- Grafana/Prometheus are accessible only via nginx reverse proxy or local port-forward
- `.env` files are in `.gitignore` — never commit secrets

---

## 📞 Support & Contacts

- GitHub: https://github.com/tarcoin/tarcoin
- Issues: https://github.com/tarcoin/tarcoin/issues
- Documentation: https://docs.tarcoin.org
