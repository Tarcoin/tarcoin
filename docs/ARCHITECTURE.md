# TARCOIN Architecture Guide

## System Architecture Overview

TARCOIN follows a microservices architecture built around the Bitcoin Core blockchain daemon.

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
│                                                              │
│    Cloudflare (DDoS, CDN, SSL)                               │
│         │                                                    │
│    ┌────┴──────────────────────────────────────────────┐    │
│    │            Nginx Reverse Proxy                     │    │
│    │    rate-limiting, SSL, security headers            │    │
│    └──┬──────┬──────┬──────┬──────┬────────────────────┘    │
│       │      │      │      │      │                         │
│       ▼      ▼      ▼      ▼      ▼                         │
│   ┌─────┐┌──────┐┌─────┐┌──────┐┌──────┐                  │
│   │Website│Explorer││ API ││ Pool ││Stratum│                │
│   │:3000 │:4000 ││:5000││:3001││:3333 │                 │
│   └──┬───┘└──┬───┘└──┬──┘└──┬───┘└──────┘                  │
│      │       │       │      │                               │
│      └───────┴───────┴──────┘                               │
│                      │                                      │
│                      ▼                                      │
│              ┌───────────┐                                  │
│              │  tarcoind  │  P2P: 19333  RPC: 19332          │
│              │  (RPC)    │  ◄─── TARCOIN Network            │
│              └───────────┘                                  │
│                      │                                      │
│              ┌───────┴───────┐                              │
│              ▼               ▼                              │
│         ┌────────┐    ┌────────┐                           │
│         │ Redis  │    │Postgres│                           │
│         │(Cache) │    │  (DB)  │                           │
│         └────────┘    └────────┘                           │
│                      │                                      │
│              ┌───────┴───────┐                              │
│              ▼               ▼                              │
│         ┌────────┐    ┌────────┐                           │
│         │Prometheus│  │ Grafana│ Monitoring                 │
│         │ Loki    │   │        │                           │
│         └────────┘    └────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. Blockchain Node (`tarcoind`)
- Bitcoin Core v31.x fork — **Live on Mainnet**
- Genesis block: `000074c6...f44bd7e0` (verified)
- Maintains full copy of the blockchain
- Validates transactions and blocks via SHA256d PoW
- Serves RPC API to internal services
- Connects to P2P network via port 19333
- RPC port 19332 (internal only)

### 2. Explorer Service
- Backend API for blockchain data
- Connects to `tarcoind` RPC
- Uses Redis for caching (30-60s TTL)
- WebSocket streaming for live updates
- Rate-limited (50 req/s)

### 3. REST API
- Public-facing API for developers
- Swagger documentation
- Rate-limited (30 req/s)
- Redis for session management

### 4. Mining Pool
- Stratum protocol server for ASIC miners
- Worker management and share tracking
- Payout engine
- Redis for real-time statistics

### 5. Website
- Next.js SSR/SSG
- Cyberpunk gold/black theme
- Framer Motion animations
- Three.js particle backgrounds

### 6. Monitoring Stack
- Prometheus: Metrics collection
- Grafana: Dashboards and alerts
- Loki: Log aggregation
- Node Exporter: System metrics

## Data Flow

### Block Discovery
```
1. Miner finds block → submits to pool
2. Pool validates → submits to tarcoind RPC
3. tarcoind propagates to P2P network
4. Explorer detects new block via polling/WebSocket
5. Cache invalidated → updates broadcast to subscribers
```

### Transaction Flow
```
1. User creates tx in wallet
2. Wallet broadcasts to tarcoind via RPC
3. tarcoind validates and adds to mempool
4. Mempool update → Explorer API detects change
5. Miners pick up tx for next block
6. Block mined → tx confirmed
```

## Security Architecture

### Network Segmentation
```
Service          Network     Firewall Rules
─────────        ───────     ──────────────
tarcoind         internal    Port 19333 (P2P), 19332 (RPC-internal)
Explorer         dmz         4000
API              dmz         5000
Website          dmz         3000
Mining Pool      dmz         3001, 3333 (Stratum)
Redis            internal    6379 (internal-only)
PostgreSQL       internal    5432 (internal-only)
Nginx            public      80, 443
```

### Rate Limiting
| Endpoint | Rate | Burst |
|----------|------|-------|
| /api/* | 30/s | 50 |
| /api/v1/blockchain/* | 50/s | 100 |
| Explorer /api/* | 50/s | 100 |
| Website | 100/s | 200 |

### Security Headers (Nginx)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=63072000
- Permissions-Policy: restricted

## Deployment Requirements

### Minimum Production Specs
| Component | vCPU | RAM | Storage |
|-----------|------|-----|---------|
| tarcoind | 4 | 8GB | 100GB+ |
| Explorer | 2 | 4GB | 20GB |
| API | 2 | 4GB | 10GB |
| Pool | 2 | 4GB | 10GB |
| Website | 1 | 2GB | 5GB |
| Monitoring | 2 | 4GB | 50GB |

### Network
- 100 Mbps minimum
- 1 Gbps recommended for seed nodes
- Static public IP addresses for seed nodes
- DNS A records for: tarcoin.org, *.tarcoin.org