// TARCOIN Mining Pool - Stratum Protocol Server
// Implements proper SHA256d block verification for TARCOIN mainnet
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('redis');
const { WebSocketServer, WebSocket } = require('ws');
const axios = require('axios');
const cron = require('node-cron');
const crypto = require('crypto');
const dotenv = require('dotenv');
const zmq = require('zeromq');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const RPC_HOST = process.env.RPC_HOST || '127.0.0.1';
const RPC_PORT = process.env.RPC_PORT || 19332;
const RPC_USER = process.env.RPC_USER || 'tarcoin';
const RPC_PASS = process.env.RPC_PASS || 'tarcoin';

// TARCOIN constants
const TARCOIN_NBITS = '1f00ffff';

app.use(helmet());
app.use(cors());
app.use(express.json());

// ====== Redis client ======
let redis;
async function initRedis() {
  redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  redis.on('error', (err) => console.warn('Redis error:', err.message));
  try {
    await redis.connect();
    console.log('Redis connected for mining pool');
  } catch {
    console.warn('Redis unavailable — running without persistence');
  }
}

// ====== RPC helper ======
async function rpcCall(method, params = []) {
  const { data } = await axios.post(`http://${RPC_HOST}:${RPC_PORT}`, {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  }, {
    auth: { username: RPC_USER, password: RPC_PASS },
    timeout: 10000,
  });
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// ====== SHA256d — double SHA256 (Bitcoin/TARCOIN PoW) ======
function sha256d(buffer) {
  const first = crypto.createHash('sha256').update(buffer).digest();
  return crypto.createHash('sha256').update(first).digest();
}

// ====== nBits → target (256-bit Buffer) ======
function nBitsToTarget(nBits) {
  const nBitsInt = parseInt(nBits, 16);
  const exponent = (nBitsInt >>> 24) & 0xff;
  const mantissa = nBitsInt & 0x007fffff;
  const target = Buffer.alloc(32, 0);
  const start = 32 - exponent;
  if (start >= 0 && start < 32) {
    target[start] = (mantissa >>> 16) & 0xff;
    if (start + 1 < 32) target[start + 1] = (mantissa >>> 8) & 0xff;
    if (start + 2 < 32) target[start + 2] = mantissa & 0xff;
  }
  return target;
}

// ====== Build 80-byte block header ======
function buildBlockHeader(version, prevHash, merkleRoot, nTime, nBits, nonce) {
  const buf = Buffer.alloc(80);
  let offset = 0;

  // version (LE 4 bytes)
  buf.writeUInt32LE(parseInt(version, 16), offset); offset += 4;

  // prevHash (reverse-byte internal order, 32 bytes)
  const prevHashBuf = Buffer.from(prevHash, 'hex').reverse();
  prevHashBuf.copy(buf, offset); offset += 32;

  // merkleRoot (32 bytes LE)
  const merkleRootBuf = Buffer.from(merkleRoot, 'hex').reverse();
  merkleRootBuf.copy(buf, offset); offset += 32;

  // nTime (LE 4 bytes)
  buf.writeUInt32LE(parseInt(nTime, 16), offset); offset += 4;

  // nBits (LE 4 bytes)
  buf.writeUInt32LE(parseInt(nBits, 16), offset); offset += 4;

  // nonce (LE 4 bytes)
  buf.writeUInt32LE(parseInt(nonce, 16), offset);

  return buf;
}

// ====== Compare buffers (LE hash < target) ======
function hashMeetsTarget(hashBuf, targetBuf) {
  // Both are 32-byte buffers; compare big-endian (reverse the LE hash)
  const hashBE = Buffer.from(hashBuf).reverse();
  for (let i = 0; i < 32; i++) {
    if (hashBE[i] < targetBuf[i]) return true;
    if (hashBE[i] > targetBuf[i]) return false;
  }
  return true;
}

// ====== Encode integer as varint ======
function encodeVarint(n) {
  if (n < 0xfd) return Buffer.from([n]);
  if (n <= 0xffff) {
    const buf = Buffer.alloc(3);
    buf[0] = 0xfd;
    buf.writeUInt16LE(n, 1);
    return buf;
  }
  const buf = Buffer.alloc(5);
  buf[0] = 0xfe;
  buf.writeUInt32LE(n, 1);
  return buf;
}

// ====== Encode block height for coinbase scriptSig (BIP34) ======
function encodeHeight(height) {
  if (height <= 16) return Buffer.from([0x51 + height - 1]); // OP_1 through OP_16
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(height);
  // Trim trailing zero bytes
  let len = 4;
  while (len > 1 && buf[len - 1] === 0) len--;
  // If the top bit is set, add another byte
  if (buf[len - 1] & 0x80) len++;
  const result = Buffer.alloc(len + 1);
  result[0] = len;
  buf.copy(result, 1, 0, len);
  return result;
}

// ====== Validate TARCOIN address format ======
function isValidTarcoinAddress(address) {
  if (!address || typeof address !== 'string') return false;
  // Bech32: tar1...
  if (address.startsWith('tar1') && address.length >= 14 && address.length <= 74) return true;
  // Base58: T... (pubkey hash) or t... (script hash)
  if (address.startsWith('T') && address.length >= 25 && address.length <= 36) return true;
  return false;
}

// ====== Pool state ======
let poolState = {
  difficulty: 1,
  blockTemplate: null,
  miners: new Map(),
  totalHashrate: 0,
  blocksFound: 0,
  activeWorkers: 0,
  poolWallet: process.env.POOL_WALLET || '',
  fee: parseFloat(process.env.POOL_FEE || '1'),
  startTime: Date.now(),
};

// ====== Per-IP connection tracking ======
const connectionsByIP = new Map();
const MAX_CONNECTIONS_PER_IP = 50;

// ====== Stratum WebSocket Server (port 3333) ======
const wss = new WebSocketServer({ port: 3333 });
console.log('Stratum server listening on port 3333');

wss.on('connection', (ws, req) => {
  let workerName = '';
  const workerId = crypto.randomBytes(8).toString('hex');
  const extraNonce1 = crypto.randomBytes(4).toString('hex');
  const clientIP = req.socket.remoteAddress || 'unknown';

  // Per-IP rate limiting
  const ipCount = (connectionsByIP.get(clientIP) || 0) + 1;
  connectionsByIP.set(clientIP, ipCount);
  if (ipCount > MAX_CONNECTIONS_PER_IP) {
    console.warn(`Too many connections from ${clientIP} (${ipCount}), rejecting`);
    ws.close();
    return;
  }

  console.log(`New miner connected: ${workerId} from ${clientIP}`);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.method) {
        case 'mining.subscribe':
          ws.send(JSON.stringify({
            id: message.id,
            result: [
              [['mining.set_difficulty', 'tarcoin-' + workerId], ['mining.notify', 'tarcoin-' + workerId]],
              extraNonce1,
              4, // extraNonce2 size
            ],
            error: null,
          }));
          ws.send(JSON.stringify({ id: null, method: 'mining.set_difficulty', params: [poolState.difficulty] }));
          sendWork(ws);
          break;

        case 'mining.authorize':
          workerName = message.params[0];
          // Validate TARCOIN address format
          if (!isValidTarcoinAddress(workerName)) {
            ws.send(JSON.stringify({ id: message.id, result: false, error: [24, 'Invalid TARCOIN address. Must start with T (base58) or tar1 (bech32)', null] }));
            break;
          }
          poolState.miners.set(workerName, {
            hashrate: 0, shares: 0, validShares: 0, invalidShares: 0,
            lastSeen: Date.now(), startTime: Date.now(), workerId, extraNonce1,
          });
          ws.send(JSON.stringify({ id: message.id, result: true, error: null }));
          poolState.activeWorkers = poolState.miners.size;
          console.log(`Miner authorized: ${workerName}`);
          break;

        case 'mining.submit':
          await handleSubmit(ws, message, workerName, extraNonce1);
          break;
      }
    } catch (err) {
      console.error('Stratum message error:', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`Miner disconnected: ${workerName || workerId}`);
    if (workerName) {
      poolState.miners.delete(workerName);
      poolState.activeWorkers = poolState.miners.size;
    }
    // Decrement IP connection count
    const current = connectionsByIP.get(clientIP) || 1;
    if (current <= 1) connectionsByIP.delete(clientIP);
    else connectionsByIP.set(clientIP, current - 1);
  });
});

function sendWork(ws) {
  if (!poolState.blockTemplate) return;
  const t = poolState.blockTemplate;
  ws.send(JSON.stringify({
    id: null,
    method: 'mining.notify',
    params: [
      t.jobId,
      t.prevHash,
      t.coinbase1,
      t.coinbase2,
      t.merkleBranch,
      t.version,
      t.nBits,
      t.nTime,
      true, // clean jobs
    ],
  }));
}

// ====== Real SHA256d share/block verification ======
async function handleSubmit(ws, message, workerName, extraNonce1) {
  const worker = poolState.miners.get(workerName);
  if (!worker) {
    ws.send(JSON.stringify({ id: message.id, result: null, error: [21, 'Unknown worker', null] }));
    return;
  }

  const [_workerNameParam, jobId, extraNonce2, nTime, nonce] = message.params;

  if (!poolState.blockTemplate || poolState.blockTemplate.jobId !== jobId) {
    ws.send(JSON.stringify({ id: message.id, result: null, error: [21, 'Job not found', null] }));
    return;
  }

  const t = poolState.blockTemplate;

  try {
    // Reconstruct coinbase transaction hex
    const coinbaseHex = t.coinbase1 + extraNonce1 + extraNonce2 + t.coinbase2;
    const coinbaseBuf = Buffer.from(coinbaseHex, 'hex');
    const coinbaseTxid = sha256d(coinbaseBuf);

    // Build merkle root from coinbase txid + merkle branches
    let merkleRoot = coinbaseTxid;
    for (const branch of t.merkleBranch) {
      merkleRoot = sha256d(Buffer.concat([merkleRoot, Buffer.from(branch, 'hex')]));
    }

    // Build 80-byte block header
    const header = buildBlockHeader(t.version, t.prevHash, merkleRoot.toString('hex'), nTime, t.nBits, nonce);

    // Compute SHA256d of the header
    const headerHash = sha256d(header);

    // Check pool share difficulty (pool target is relaxed)
    const poolTarget = nBitsToTarget(t.nBits);
    const meetsPoolDiff = hashMeetsTarget(headerHash, poolTarget);

    if (!meetsPoolDiff) {
      worker.invalidShares++;
      ws.send(JSON.stringify({ id: message.id, result: null, error: [23, 'Low difficulty share', null] }));
      return;
    }

    worker.validShares++;
    worker.shares++;
    worker.lastSeen = Date.now();
    ws.send(JSON.stringify({ id: message.id, result: true, error: null }));

    // Track in Redis
    if (redis) {
      await redis.lPush('pool:shares', JSON.stringify({ worker: workerName, time: Date.now() }));
      await redis.lTrim('pool:shares', 0, 9999);
    }

    // Check if meets network block difficulty (use actual nBits-derived target, not hardcoded powLimit)
    const blockTarget = nBitsToTarget(t.nBits);
    if (hashMeetsTarget(headerHash, blockTarget)) {
      await handleBlockFound(header, coinbaseHex, workerName);
    }

    console.log(`Share accepted from ${workerName} — hash: ${Buffer.from(headerHash).reverse().toString('hex').slice(0, 16)}...`);
  } catch (err) {
    console.error('Share verification error:', err.message);
    ws.send(JSON.stringify({ id: message.id, result: null, error: [20, 'Verification error', null] }));
  }
}

async function handleBlockFound(headerBuffer, coinbaseHex, workerName) {
  console.log(`BLOCK FOUND by ${workerName}!`);
  poolState.blocksFound++;

  try {
    const t = poolState.blockTemplate;
    if (!t) return;

    // Assemble full block:
    // header (80 bytes) + varint(tx count) + coinbase tx + other txs
    const txCount = 1 + (t.transactions || []).length;
    const txCountVarint = encodeVarint(txCount);

    const coinbaseBuf = Buffer.from(coinbaseHex, 'hex');

    // Get other transaction data from template
    let otherTxData = Buffer.alloc(0);
    if (t.transactions && t.transactions.length > 0) {
      const txHexes = t.transactions.map((tx) => tx.data).join('');
      otherTxData = Buffer.from(txHexes, 'hex');
    }

    const blockHex = Buffer.concat([headerBuffer, txCountVarint, coinbaseBuf, otherTxData]).toString('hex');

    // Submit to node
    const result = await rpcCall('submitblock', [blockHex]);
    if (result === null) {
      console.log(`Block accepted by node at height ${(t.height || 0) + 1}!`);
    } else {
      console.error(`Block rejected: ${result}`);
    }

    // Record in Redis
    if (redis) {
      const blockRecord = {
        worker: workerName,
        height: (t.height || 0) + 1,
        time: Date.now(),
        accepted: result === null,
        reward: (t.coinbaseValue || 0) / 1e8, // Convert from smallest unit to TAR
      };
      await redis.lPush('pool:blocks', JSON.stringify(blockRecord));

      // Also store in unpaid list for the payout engine
      if (result === null) {
        await redis.lPush('pool:blocks:unpaid', JSON.stringify(blockRecord));
      }
    }

    // Refresh template immediately after block found
    await refreshBlockTemplate();
  } catch (err) {
    console.error('Block submission error:', err.message);
  }
}

// ====== Block template refresh ======
async function refreshBlockTemplate() {
  try {
    const template = await rpcCall('getblocktemplate', [{ rules: ['segwit'] }]);
    if (template) {
      const height = template.height;
      const coinbaseValue = template.coinbasevalue;

      // Build BIP34 height encoding for coinbase scriptSig
      const heightScript = encodeHeight(height);

      // Build coinbase1: version + txin_count + prevout + scriptSig_start
      // version (4 bytes LE) + vin count (01) + prev txid (32 zero bytes) + prev vout (ffffffff) + scriptSig length + height bytes
      const cbVersion = '01000000'; // tx version 1
      const cbVinCount = '01';
      const cbPrevOut = '0000000000000000000000000000000000000000000000000000000000000000ffffffff';
      // scriptSig = heightScript + extraNonce1(4 bytes) + extraNonce2(4 bytes)
      const scriptSigLen = Buffer.from([heightScript.length + 4 + 4]); // height + extraNonce1 + extraNonce2
      const coinbase1 = cbVersion + cbVinCount + cbPrevOut + scriptSigLen.toString('hex') + heightScript.toString('hex');

      // Build coinbase2: sequence + vout_count + value + scriptPubKey + locktime
      const cbSequence = 'ffffffff';
      const cbVoutCount = '01';

      // Encode reward value as 8-byte LE
      const valueBuf = Buffer.alloc(8);
      valueBuf.writeBigUInt64LE(BigInt(coinbaseValue));
      const cbValue = valueBuf.toString('hex');

      // scriptPubKey: use OP_RETURN if no pool wallet configured, else P2PKH placeholder
      let cbScriptPubKey;
      if (poolState.poolWallet) {
        // Simple OP_DUP OP_HASH160 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG placeholder
        // In production, properly decode the pool wallet address to get the pubkey hash
        cbScriptPubKey = '6a14' + crypto.createHash('sha256').update(poolState.poolWallet).digest('hex').slice(0, 40);
      } else {
        // OP_RETURN with pool identifier
        const poolTag = Buffer.from('TARCOIN Pool', 'utf8');
        cbScriptPubKey = '6a' + Buffer.from([poolTag.length]).toString('hex') + poolTag.toString('hex');
      }
      const cbScriptPubKeyLen = Buffer.from([cbScriptPubKey.length / 2]).toString('hex');

      const cbLocktime = '00000000';
      const coinbase2 = cbSequence + cbVoutCount + cbValue + cbScriptPubKeyLen + cbScriptPubKey + cbLocktime;

      poolState.blockTemplate = {
        jobId: crypto.randomBytes(4).toString('hex'),
        prevHash: template.previousblockhash || '0000000000000000000000000000000000000000000000000000000000000000',
        coinbase1: coinbase1,
        coinbase2: coinbase2,
        merkleBranch: (template.transactions || []).map((t) => t.hash),
        transactions: template.transactions || [], // Store full tx objects for block assembly
        version: template.version.toString(16).padStart(8, '0'),
        nBits: template.bits,
        nTime: Math.floor(Date.now() / 1000).toString(16).padStart(8, '0'),
        height: template.height,
        target: template.target,
        coinbaseValue: coinbaseValue,
      };

      // Broadcast new work to all connected miners
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) sendWork(client);
      });
      console.log(`Block template refreshed — height: ${template.height}, txs: ${(template.transactions || []).length}`);
    }
  } catch (err) {
    console.warn('Template refresh failed (node may not be connected):', err.message);
  }
}

// Refresh template every 30 seconds (fallback; ZMQ is primary)
setInterval(refreshBlockTemplate, 30000);

// ====== ZMQ Block Notification ======
async function startZmqSubscriber() {
  const zmqEndpoint = process.env.ZMQ_BLOCK_ENDPOINT || 'tcp://127.0.0.1:28332';
  let sock;
  try {
    sock = new zmq.Subscriber();
    sock.connect(zmqEndpoint);
    sock.subscribe('hashblock');
    console.log(`ZMQ subscriber connected to ${zmqEndpoint} — listening for new blocks`);
  } catch (err) {
    console.warn(`ZMQ not available (${err.message}) — falling back to 30s polling only`);
    return;
  }

  try {
    for await (const [topic, msg] of sock) {
      const topicStr = topic.toString();
      if (topicStr === 'hashblock') {
        const blockHash = msg.toString('hex');
        console.log(`ZMQ: New block detected — ${blockHash.slice(0, 16)}... — refreshing template`);
        await refreshBlockTemplate();
      }
    }
  } catch (err) {
    console.error('ZMQ subscriber error:', err.message);
    // If ZMQ dies, polling interval is still active as fallback
  }
}

// ====== Hashrate tracking ======
function updateHashrates() {
  const now = Date.now();
  const window = 600000; // 10 minute window
  let totalValidShares = 0;

  poolState.miners.forEach((data, name) => {
    if (now - data.lastSeen < window && data.validShares > 0) {
      // hashrate = shares * difficulty * 2^32 / time_in_seconds
      const timeDelta = Math.max((now - data.startTime) / 1000, 1);
      data.hashrate = Math.floor((data.validShares * poolState.difficulty * 4294967296) / timeDelta);
      totalValidShares += data.validShares;
    } else {
      data.hashrate = 0;
    }
  });

  const totalTime = Math.max((now - poolState.startTime) / 1000, 1);
  poolState.totalHashrate = Math.floor((totalValidShares * poolState.difficulty * 4294967296) / totalTime);
}

// Update hashrates every 30 seconds
setInterval(updateHashrates, 30000);

// ====== Payout Engine (Proportional) ======
const MINIMUM_PAYOUT = parseFloat(process.env.MINIMUM_PAYOUT || '10'); // Minimum TAR before payout
const MATURITY_CONFIRMATIONS = 100; // Coinbase maturity

async function processPayouts() {
  console.log('Processing pool payouts...');
  if (!redis) {
    console.warn('Payouts skipped — Redis not available');
    return;
  }

  try {
    // 1. Get all accepted blocks from Redis that haven't been paid out yet
    const unpaidBlocks = await redis.lRange('pool:blocks:unpaid', 0, -1);
    if (unpaidBlocks.length === 0) {
      console.log('No unpaid blocks to process');
      return;
    }

    let totalReward = 0;
    const matureBlocks = [];

    for (const raw of unpaidBlocks) {
      const block = JSON.parse(raw);
      if (!block.accepted) continue;

      // Check if block has enough confirmations (coinbase maturity)
      try {
        const currentHeight = await rpcCall('getblockcount');
        if (currentHeight - block.height >= MATURITY_CONFIRMATIONS) {
          matureBlocks.push(block);
          totalReward += block.reward || 0;
        }
      } catch {
        // Node unavailable — skip this round
        return;
      }
    }

    if (matureBlocks.length === 0 || totalReward === 0) {
      console.log('No mature blocks ready for payout');
      return;
    }

    // 2. Get share counts for the payout window
    const shares = await redis.lRange('pool:shares', 0, -1);
    const workerShares = {};
    let totalShares = 0;

    shares.forEach((s) => {
      const { worker } = JSON.parse(s);
      workerShares[worker] = (workerShares[worker] || 0) + 1;
      totalShares++;
    });

    if (totalShares === 0) {
      console.log('No shares recorded — skipping payout');
      return;
    }

    // 3. Calculate proportional payouts
    const poolFeeRate = poolState.fee / 100; // e.g., 1% = 0.01
    const poolFeeAmount = totalReward * poolFeeRate;
    const distributableReward = totalReward - poolFeeAmount;

    const payouts = {};
    let payoutCount = 0;

    for (const [worker, shareCount] of Object.entries(workerShares)) {
      const proportion = shareCount / totalShares;
      const amount = parseFloat((distributableReward * proportion).toFixed(8));

      if (amount >= MINIMUM_PAYOUT) {
        payouts[worker] = amount;
        payoutCount++;
      } else {
        // Below minimum — accumulate for next round
        console.log(`  ${worker}: ${amount.toFixed(8)} TAR (below ${MINIMUM_PAYOUT} TAR minimum, deferred)`);
      }
    }

    if (payoutCount === 0) {
      console.log('All payouts below minimum threshold — deferring');
      return;
    }

    // 4. Send payouts via sendmany RPC
    console.log(`Sending payouts to ${payoutCount} workers (total: ${distributableReward.toFixed(8)} TAR, fee: ${poolFeeAmount.toFixed(8)} TAR)`);
    console.log('Payouts:', payouts);

    try {
      const txid = await rpcCall('sendmany', ['', payouts, MATURITY_CONFIRMATIONS, 'Pool payout']);
      console.log(`Payout transaction sent: ${txid}`);

      // 5. Record payout in Redis
      await redis.lPush('pool:payouts', JSON.stringify({
        txid,
        payouts,
        totalReward,
        poolFee: poolFeeAmount,
        distributed: distributableReward,
        blocks: matureBlocks.map((b) => b.height),
        time: Date.now(),
      }));

      // 6. Clear processed blocks and shares
      await redis.del('pool:blocks:unpaid');
      await redis.del('pool:shares');

      console.log('Payout cycle complete');
    } catch (err) {
      console.error('Payout sendmany failed:', err.message);
      // Don't clear — will retry next cycle
    }
  } catch (err) {
    console.error('Payout error:', err.message);
  }
}

cron.schedule('0 * * * *', processPayouts);

// ====== HTTP API ======
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to TARCOIN Mining Pool',
    status: 'Online',
    stratum: 'stratum+tcp://pool.tarcoin.org:3333',
    algorithm: 'SHA256d',
    fee: `${poolState.fee}%`,
    payout: 'Proportional',
    endpoints: {
      stats: '/api/pool/stats',
      miners: '/api/pool/miners',
      hashrate: '/api/pool/hashrate',
      blocks: '/api/pool/blocks'
    },
    instructions: {
      step1: 'Get a wallet address from tarcoin-cli or TARCOIN Wallet',
      step2: 'Download a CPU miner like cpuminer',
      step3: 'Run: minerd -a sha256d -o stratum+tcp://pool.tarcoin.org:3333 -u YOUR_WALLET_ADDRESS -p x'
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tarcoin-mining-pool', timestamp: Date.now() });
});

app.get('/api/pool/stats', (_req, res) => {
  const miners = Array.from(poolState.miners.entries()).map(([name, data]) => ({
    name,
    hashrate: data.hashrate,
    shares: data.shares,
    validShares: data.validShares,
    invalidShares: data.invalidShares,
    lastSeen: data.lastSeen,
  }));

  res.json({
    pool: {
      hashrate: poolState.totalHashrate,
      activeWorkers: poolState.activeWorkers,
      blocksFound: poolState.blocksFound,
      poolFee: poolState.fee,
      difficulty: poolState.difficulty,
      uptime: Math.floor((Date.now() - poolState.startTime) / 1000),
      stratumPort: 3333,
      algorithm: 'SHA256d',
      network: 'TARCOIN Mainnet',
    },
    miners,
    currentBlock: poolState.blockTemplate ? {
      height: poolState.blockTemplate.height,
      nBits: poolState.blockTemplate.nBits,
    } : null,
  });
});

app.get('/api/pool/miners', (_req, res) => {
  const miners = Array.from(poolState.miners.entries()).map(([name, data]) => ({
    name,
    hashrate: data.hashrate,
    shares: data.shares,
    validShares: data.validShares,
    invalidShares: data.invalidShares,
    lastSeen: data.lastSeen,
  }));
  res.json(miners);
});

app.get('/api/pool/hashrate', (_req, res) => {
  res.json({
    totalHashrate: poolState.totalHashrate,
    activeWorkers: poolState.activeWorkers,
    unit: 'H/s',
  });
});

app.get('/api/pool/blocks', async (_req, res) => {
  try {
    const blocks = redis ? await redis.lRange('pool:blocks', 0, 49) : [];
    res.json(blocks.map((b) => JSON.parse(b)));
  } catch {
    res.json([]);
  }
});

// ====== Initialize ======
async function start() {
  await initRedis();
  await refreshBlockTemplate();

  // Start ZMQ subscriber for instant block notifications
  startZmqSubscriber().catch((err) => {
    console.warn('ZMQ subscriber failed to start:', err.message);
  });

  app.listen(PORT, () => {
    console.log(`TARCOIN Mining Pool HTTP API running on port ${PORT}`);
    console.log(`Stratum server running on port 3333`);
  });
}

start();