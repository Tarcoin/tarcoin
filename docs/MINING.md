# TARCOIN Mining Guide

## Overview

TARCOIN uses SHA256d Proof-of-Work, making it fully compatible with Bitcoin ASIC miners. This guide covers how to mine TAR using both pool and solo mining methods.

## Network Parameters

| Parameter | Value |
|-----------|-------|
| Algorithm | SHA256d |
| Block Reward (Era 1) | 50,000 TAR |
| Block Time | 10 minutes |
| Halving Interval | 400,000 blocks |
| Difficulty Retarget | Every 2016 blocks (~2 weeks) |
| ASIC Compatible | Yes (all SHA256 ASICs) |
| P2P Port | 19333 |
| RPC Port | 19332 |
| Genesis nBits | 0x1f00ffff |
| Genesis Hash | `000074c6...f44bd7e0` |
| Mainnet Status | **Live — Height 0 confirmed** |

## Pool Mining

### Official TARCOIN Pool

```
Stratum URL:  stratum+tcp://pool.tarcoin.org:3333
Backup URL:   stratum+tcp://pool2.tarcoin.org:3333
Port:         3333
Username:     <YOUR_TAR_ADDRESS>
Password:     x (or any value)
Pool Fee:     1%
```

### Supported Miners

#### Antminer (Bitmain)
```
Model     : Antminer S19, S19 Pro, S19 XP, S21
URL       : stratum+tcp://pool.tarcoin.org:3333
Worker    : <TAR_ADDRESS>.<WORKER_NAME>
Password  : x
```

#### Whatsminer (MicroBT)
```
Model     : Whatsminer M50, M50S, M60, M60S
URL       : stratum+tcp://pool.tarcoin.org:3333
Worker    : <TAR_ADDRESS>.<WORKER_NAME>
Password  : x
```

#### Avalonminer (Canaan)
```
Model     : Avalonminer A12+, A13, A15
URL       : stratum+tcp://pool.tarcoin.org:3333
Worker    : <TAR_ADDRESS>.<WORKER_NAME>
Password  : x
```

### Mining with CGMiner/BFGMiner

```bash
cgminer -o stratum+tcp://pool.tarcoin.org:3333 \
  -u <TAR_ADDRESS>.<WORKER_NAME> \
  -p x \
  --api-listen \
  --api-network

bfgminer -o stratum+tcp://pool.tarcoin.org:3333 \
  -u <TAR_ADDRESS>.<WORKER_NAME> \
  -p x
```

### Mining with CPU/GPU (Testnet Only)

```bash
# CPU mining (testnet only - not profitable on mainnet)
tarcoin-cli -testnet generatetoaddress 1 <TAR_ADDRESS>

# Using cpuminer (testnet)
minerd -a sha256d -o stratum+tcp://pool.tarcoin.org:3333 \
  -u <TAR_ADDRESS> -p x -t <THREADS>
```

## Solo Mining

### Prerequisites
- Full TARCOIN node synchronized
- TARCOIN wallet with an address
- ASIC miner or CPU/GPU mining software

### Setup

```bash
# 1. Start tarcoind with mining enabled
tarcoind -daemon \
  -rpcuser=tarcoin \
  -rpcpassword=tarcoin \
  -rpcallowip=127.0.0.1

# 2. Create a wallet
tarcoin-cli -rpcuser=tarcoin -rpcpassword=tarcoin createwallet "mining"

# 3. Get a mining address
ADDRESS=$(tarcoin-cli -rpcuser=tarcoin -rpcpassword=tarcoin getnewaddress)
echo "Mining to: $ADDRESS"

# 4. Start mining (requires CPU/ASIC connected)
# For CPU mining (testnet/regtest only):
tarcoin-cli -rpcuser=tarcoin -rpcpassword=tarcoin generatetoaddress 1 $ADDRESS

# For ASIC mining, point miner to your node:
# URL: stratum+tcp://YOUR_NODE_IP:3333
```

### Solo Mining with GetBlockTemplate

```bash
# Get block template
tarcoin-cli -rpcuser=tarcoin -rpcpassword=tarcoin getblocktemplate '{"rules":["segwit"]}'

# Submit block
tarcoin-cli -rpcuser=tarcoin -rpcpassword=tarcoin submitblock <HEX_DATA>
```

## Profitability Calculator

```bash
# Estimated daily earnings (pool)
DAILY_REWARD = (YOUR_HASHRATE / NETWORK_HASHRATE) * BLOCKS_PER_DAY * BLOCK_REWARD * (1 - POOL_FEE)

# Example: 100 TH/s, 1000 TH/s network, 1% pool fee
DAILY_REWARD = (100 / 1000) * 144 * 50000 * 0.99
DAILY_REWARD ≈ 712.8 TAR/day
```

## Pool Dashboard

Access the pool dashboard at [https://pool.tarcoin.org](https://pool.tarcoin.org)

Features:
- Real-time hashrate monitoring
- Worker management
- Payout tracking
- Block finder history
- Profitability calculator

## Mining API

```bash
# Pool statistics
curl https://pool.tarcoin.org/api/pool/stats

# Worker list
curl https://pool.tarcoin.org/api/pool/miners

# Hashrate
curl https://pool.tarcoin.org/api/pool/hashrate
```

## Troubleshooting

### Miner Won't Connect
```
1. Verify miner can reach pool.tarcoin.org
   ping pool.tarcoin.org

2. Check port 3333 is open
   nc -zv pool.tarcoin.org 3333

3. Verify your TAR address is valid
   (starts with "tar1" or "T")

4. Try backup pool URL
```

### High Stale Share Rate
```
1. Network connection issues - check latency
2. Pool server too far geographically
3. Miner configuration incorrect
   - Ensure stratum+tcp:// not http://
   - Correct port (3333)
4. Try different pool server
```

### No Payout Received
```
1. Verify your payout address in miner config
2. Check minimum payout threshold on pool
3. Verify your hashrate is registering
4. Check pool dashboard for worker activity
```

## Best Practices

1. **Use descriptive worker names** - track individual miner performance
2. **Monitor temperatures** - ASIC miners run hot
3. **Set up backup pools** - ensure uptime during maintenance
4. **Secure your wallet** - use cold storage for large balances
5. **Join a pool** - solo mining is extremely difficult for individuals

## Resources

- Pool Dashboard: [https://pool.tarcoin.org](https://pool.tarcoin.org)
- Network Stats: [https://explorer.tarcoin.org](https://explorer.tarcoin.org)
- Mining API: [https://api.tarcoin.org/docs](https://api.tarcoin.org/docs)
- Community: [https://discord.gg/tarcoin](https://discord.gg/tarcoin)