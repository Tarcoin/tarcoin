# TARCOIN API Documentation

## Overview

The TARCOIN REST API provides programmatic access to blockchain data, wallet utilities, and network information.

**Base URL:** `https://api.tarcoin.org/api/v1`

## Authentication

Some endpoints require authentication via API key:

```bash
# Header-based auth
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.tarcoin.org/api/v1/...

# Query parameter auth
curl https://api.tarcoin.org/api/v1/...?api_key=YOUR_API_KEY
```

## Rate Limiting

| Tier | Rate Limit | Burst |
|------|------------|-------|
| Free | 30 req/s | 50 |
| Premium | 100 req/s | 200 |
| Enterprise | 500 req/s | 1000 |

## Endpoints

### Blockchain

#### Get Blockchain Info
```http
GET /api/v1/blockchain/info
```

**Response:**
```json
{
  "chain": "main",
  "blocks": 0,
  "headers": 0,
  "bestblockhash": "000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0",
  "bits": "1f00ffff",
  "target": "0000ffff00000000000000000000000000000000000000000000000000000000",
  "difficulty": 1.52587890625e-05,
  "mediantime": 1748304000,
  "chainwork": "0000000000000000000000000000000000000000000000000000000000010001",
  "size_on_disk": 273
}
```

#### Get Block by Hash
```http
GET /api/v1/blockchain/block/{hash}
```

**Response:**
```json
{
  "hash": "000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0",
  "confirmations": 1,
  "height": 0,
  "version": 1,
  "merkleroot": "1fa777a38f96e44bb26591573ed2b22d5b40d7a63067201a40ad3b214152b749",
  "time": 1748304000,
  "nonce": 15878,
  "bits": "1f00ffff",
  "difficulty": 1.52587890625e-05,
  "tx": []
}
```

#### Get Block by Height
```http
GET /api/v1/blockchain/block/height/{height}
```

#### Get Supply Information
```http
GET /api/v1/blockchain/supply
```

**Response:**
```json
{
  "max_supply": 50000000000,
  "circulating_supply": 0,
  "mined_supply": 0,
  "ecosystem_treasury_allocation": 10000000000,
  "public_mining_supply": 40000000000,
  "block_reward": 50000,
  "halving_interval": 400000
}
```

#### Get Difficulty
```http
GET /api/v1/blockchain/difficulty
```

#### Get Mempool Info
```http
GET /api/v1/blockchain/mempool
```

### Transactions

#### Get Transaction by ID
```http
GET /api/v1/transactions/{txid}
```

#### Decode Raw Transaction
```http
POST /api/v1/transactions/decode
Content-Type: application/json

{
  "rawTx": "0100000001..."
}
```

#### Broadcast Transaction
```http
POST /api/v1/transactions/send
Content-Type: application/json

{
  "hex": "0100000001..."
}
```

**Response:**
```json
{
  "txid": "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098",
  "message": "Transaction broadcast successfully"
}
```

### Addresses

#### Get Address Info
```http
GET /api/v1/address/{address}/info
```

**Response:**
```json
{
  "address": "tar1q...",
  "balance": 1000,
  "total_received": 5000,
  "total_sent": 4000,
  "tx_count": 10,
  "unconfirmed_balance": 0
}
```

#### Get Address Transactions
```http
GET /api/v1/address/{address}/transactions
```

#### Validate Address
```http
GET /api/v1/wallet/validate/{address}
```

**Response:**
```json
{
  "valid": true,
  "address": "tar1q...",
  "type": "p2wpkh",
  "network": "mainnet"
}
```

### Mining

#### Get Mining Info
```http
GET /api/v1/mining/info
```

**Response:**
```json
{
  "algorithm": "SHA256d",
  "block_reward": 50000,
  "block_time": 600,
  "halving_interval": 400000,
  "current_era": 1,
  "public_mining_supply": 40000000000,
  "asic_compatible": true
}
```

#### Get Network Hashrate
```http
GET /api/v1/mining/hashrate
```

### Network

#### Get Network Info
```http
GET /api/v1/network/info
```

#### Get Peer Info
```http
GET /api/v1/network/peers
```

## WebSocket

Real-time updates are available via WebSocket.

**Endpoint:** `wss://api.tarcoin.org/ws`

### Events

```json
// New Block
{
  "event": "new_block",
  "data": {
    "hash": "000000000...",
    "height": 100,
    "time": 1234567890,
    "tx_count": 10
  }
}

// New Transaction
{
  "event": "new_transaction",
  "data": {
    "txid": "0e3e2357e...",
    "amount": 50000,
    "confirmations": 0
  }
}

// Mempool Update
{
  "event": "mempool_update",
  "data": {
    "size": 100,
    "bytes": 50000
  }
}
```

## Error Responses

```json
// 400 Bad Request
{
  "error": "Invalid address format",
  "code": "INVALID_ADDRESS"
}

// 404 Not Found
{
  "error": "Block not found",
  "code": "NOT_FOUND"
}

// 429 Rate Limited
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "retry_after": 10
}

// 500 Internal Error
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
const api = new TarcoinAPI({
  baseUrl: 'https://api.tarcoin.org/api/v1',
  apiKey: 'your-api-key'
});

// Get blockchain info
const info = await api.getBlockchainInfo();

// Get transaction
const tx = await api.getTransaction('0e3e2357e...');

// Validate address
const valid = await api.validateAddress('tar1q...');
```

### Python
```python
from tarcoin_api import TarcoinAPI

api = TarcoinAPI(
    base_url='https://api.tarcoin.org/api/v1',
    api_key='your-api-key'
)

# Get supply info
supply = api.get_supply()
print(f"Circulating: {supply['circulating_supply']} TAR")
```

### cURL
```bash
# Get block
curl https://api.tarcoin.org/api/v1/blockchain/block/0

# Get address info
curl https://api.tarcoin.org/api/v1/address/tar1.../info

# Broadcast transaction
curl -X POST https://api.tarcoin.org/api/v1/transactions/send \
  -H 'Content-Type: application/json' \
  -d '{"hex":"0100000001..."}'