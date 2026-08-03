// TARCOIN Mining Pool - Stratum Protocol Server
// Implements proper SHA256d block verification for TARCOIN mainnet
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('redis');
const net = require('net');
const axios = require('axios');
const cron = require('node-cron');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const RPC_HOST = process.env.RPC_HOST || '127.0.0.1';
const RPC_PORT = process.env.RPC_PORT || 19332;
const RPC_USER = process.env.RPC_USER || 'tarcoin';
const RPC_PASS = process.env.RPC_PASS || 'tarcoin';

// TARCOIN constants
const TARCOIN_NBITS = '1f00ffff';
const POW_LIMIT = Buffer.from('0000ffff00000000000000000000000000000000000000000000000000000000', 'hex');

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

// Stratum format helper for prevHash
function formatPrevHashForStratum(hex) {
  const buf = Buffer.from(hex, 'hex').reverse(); // To LE
  const swapped = Buffer.alloc(32);
  for (let i = 0; i < 32; i += 4) {
    swapped[i] = buf[i + 3];
    swapped[i + 1] = buf[i + 2];
    swapped[i + 2] = buf[i + 1];
    swapped[i + 3] = buf[i];
  }
  return swapped.toString('hex');
}

// ====== Build 80-byte block header ======
function buildBlockHeader(version, prevHash, merkleRoot, nTime, nBits, nonce) {
  const buf = Buffer.alloc(80);
  let offset = 0;

  // version (LE 4 bytes)
  buf.writeUInt32LE(parseInt(version, 16), offset); offset += 4;

  // prevHash (reverse-byte internal order, 32 bytes)
  // prevHash passed here is the original Big-Endian string from the template
  const prevHashBuf = Buffer.from(prevHash, 'hex').reverse();
  prevHashBuf.copy(buf, offset); offset += 32;

  // merkleRoot (32 bytes LE)
  // merkleRoot passed here is the raw sha256d output (already LE)
  const merkleRootBuf = Buffer.from(merkleRoot, 'hex'); // REMOVED .reverse()
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

// ====== Pool state ======
const activeSockets = new Set();
let poolState = {
  difficulty: 1, // Fixed pool difficulty
  blockTemplate: null,
  miners: new Map(),
  totalHashrate: 0,
  blocksFound: 0,
  activeWorkers: 0,
  poolWallet: process.env.POOL_WALLET || '',
  fee: parseFloat(process.env.POOL_FEE || '1'),
  startTime: Date.now(),
};

// ====== Stratum TCP Server (port 3333) ======
console.log('Stratum server listening on port 3333');

const stratumServer = net.createServer((socket) => {
  activeSockets.add(socket);
  let workerName = '';
  let buffer = '';
  const workerId = crypto.randomBytes(8).toString('hex');
  const extraNonce1 = crypto.randomBytes(4).toString('hex');

  console.log(`New miner connected: \${workerId}`);

  socket.on('data', async (data) => {
    buffer += data.toString();
    if (!buffer.includes('\\n')) return;
    
    const messages = buffer.split('\\n');
    buffer = messages.pop(); // keep remainder
    
    for (const msg of messages) {
      if (!msg.trim()) continue;
      try {
        const message = JSON.parse(msg);

        switch (message.method) {
          case 'mining.subscribe':
            socket.write(JSON.stringify({
              id: message.id,
              result: [
                [['mining.set_difficulty', 'tarcoin-' + workerId], ['mining.notify', 'tarcoin-' + workerId]],
                extraNonce1,
                4, // extraNonce2 size
              ],
              error: null,
            }) + "\n");
            socket.write(JSON.stringify({ id: null, method: 'mining.set_difficulty', params: [poolState.difficulty] }) + "\n");
            sendWork(socket);
            break;

          case 'mining.authorize':
            workerName = message.params[0];
            poolState.miners.set(workerName, {
              hashrate: 0, shares: 0, validShares: 0, invalidShares: 0,
              lastSeen: Date.now(), workerId, extraNonce1,
            });
            socket.write(JSON.stringify({ id: message.id, result: true, error: null }) + "\n");
            poolState.activeWorkers = poolState.miners.size;
            console.log(`Miner authorized: \${workerName}`);
            break;

          case 'mining.submit':
            await handleSubmit(socket, message, workerName, extraNonce1);
            break;
        }
      } catch (err) {
        console.error('Stratum message error:', err.message);
      }
    }
  });

  socket.on('close', () => {
    activeSockets.delete(socket);
    console.log(`Miner disconnected: \${workerName || workerId}`);
    if (workerName) {
      poolState.miners.delete(workerName);
      poolState.activeWorkers = poolState.miners.size;
    }
  });
  
  socket.on('error', (err) => {
    console.warn(`Socket error from \${workerName || workerId}:`, err.message);
  });
});

function sendWork(socket) {
  if (!poolState.blockTemplate) return;
  const t = poolState.blockTemplate;
  socket.write(JSON.stringify({
    id: null,
    method: 'mining.notify',
    params: [
      t.jobId,
      t.stratumPrevHash, // Stratum formatted
      t.coinbase1,
      t.coinbase2,
      t.merkleBranch,
      t.version,
      t.nBits,
      t.nTime,
      true, // clean jobs
    ],
  }) + "\n");
}

// ====== Real SHA256d share/block verification ======
async function handleSubmit(socket, message, workerName, extraNonce1) {
  const worker = poolState.miners.get(workerName);
  if (!worker) {
    socket.write(JSON.stringify({ id: message.id, result: null, error: [21, 'Unknown worker', null] }) + "\n");
    return;
  }

  const [_workerNameParam, jobId, extraNonce2, nTime, nonce] = message.params;

  if (!poolState.blockTemplate || poolState.blockTemplate.jobId !== jobId) {
    socket.write(JSON.stringify({ id: message.id, result: null, error: [21, 'Job not found', null] }) + "\n");
    return;
  }

  const t = poolState.blockTemplate;

  try {
    // Reconstruct coinbase transaction hash
    const coinbaseHex = t.coinbase1 + extraNonce1 + extraNonce2 + t.coinbase2;
    const coinbaseBuf = Buffer.from(coinbaseHex, 'hex');
    const coinbaseTxid = sha256d(coinbaseBuf);

    // Build merkle root from coinbase txid + merkle branches
    let merkleRoot = coinbaseTxid;
    for (const branch of t.merkleBranch) {
      merkleRoot = sha256d(Buffer.concat([merkleRoot, Buffer.from(branch, 'hex')]));
    }

    // Build 80-byte block header (uses internal prevHashBE)
    const header = buildBlockHeader(t.version, t.prevHashBE, merkleRoot.toString('hex'), nTime, t.nBits, nonce);

    // Compute SHA256d of the header
    const headerHash = sha256d(header);

    // FIX: Check pool share difficulty against the POOL TARGET (Difficulty 1), NOT the network target!
    // Difficulty 1 Target is 00000000ffff000000...
    const poolTarget = Buffer.from('00000000ffff0000000000000000000000000000000000000000000000000000', 'hex');
    const meetsPoolDiff = hashMeetsTarget(headerHash, poolTarget);

    if (!meetsPoolDiff) {
      worker.invalidShares++;
      socket.write(JSON.stringify({ id: message.id, result: null, error: [23, 'Low difficulty share', null] }) + "\n");
      return;
    }

    worker.validShares++;
    worker.shares++;
    worker.lastSeen = Date.now();
    socket.write(JSON.stringify({ id: message.id, result: true, error: null }) + "\n");

    // Track in Redis
    if (redis) {
      await redis.lPush('pool:shares', JSON.stringify({ worker: workerName, time: Date.now() }));
      await redis.lTrim('pool:shares', 0, 9999);
    }

    // Check if meets network block difficulty (powLimit or t.nBits)
    const networkTarget = nBitsToTarget(t.nBits);
    if (hashMeetsTarget(headerHash, networkTarget)) {
      await handleBlockFound(header, workerName);
    }

    console.log(`Share accepted from \${workerName} — hash: \${headerHash.reverse().toString('hex').slice(0, 16)}...`);
  } catch (err) {
    console.error('Share verification error:', err.message);
    socket.write(JSON.stringify({ id: message.id, result: null, error: [20, 'Verification error', null] }) + "\n");
  }
}

async function handleBlockFound(headerBuffer, workerName) {
  console.log(`🎉 BLOCK FOUND by \${workerName}!`);
  poolState.blocksFound++;

  try {
    const height = poolState.blockTemplate?.height || 0;
    console.log(`Block found at height ~\${height + 1} by \${workerName}`);

    if (redis) {
      await redis.lPush('pool:blocks', JSON.stringify({
        worker: workerName,
        height: height + 1,
        time: Date.now(),
      }));
    }
  } catch (err) {
    console.error('Block found handling error:', err.message);
  }
}

// ====== Block template refresh ======
async function refreshBlockTemplate() {
  try {
    const template = await rpcCall('getblocktemplate', [{ rules: ['segwit'] }]);
    if (template) {
      const originalPrevHash = template.previousblockhash || '0000000000000000000000000000000000000000000000000000000000000000';
      poolState.blockTemplate = {
        jobId: crypto.randomBytes(4).toString('hex'),
        prevHashBE: originalPrevHash, // Keep for header assembly
        stratumPrevHash: formatPrevHashForStratum(originalPrevHash), // For mining.notify
        coinbase1: '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff',
        coinbase2: 'ffffffff01',
        merkleBranch: (template.transactions || []).map((t) => t.hash),
        version: template.version.toString(16).padStart(8, '0'),
        nBits: template.bits,
        nTime: Math.floor(Date.now() / 1000).toString(16).padStart(8, '0'),
        height: template.height,
        target: template.target,
      };

      activeSockets.forEach((client) => {
        if (!client.destroyed) sendWork(client);
      });
      console.log(`Block template refreshed — height: \${template.height}, txs: \${(template.transactions || []).length}`);
    }
  } catch (err) {
    console.warn('Template refresh failed (node may not be connected):', err.message);
  }
}

setInterval(refreshBlockTemplate, 30000);

// ====== Payout engine ======
async function processPayouts() {
  console.log('Processing pool payouts...');
  if (!redis) return;

  try {
    const shares = await redis.lRange('pool:shares', 0, -1);
    const workerShares = {};
    shares.forEach((s) => {
      const { worker } = JSON.parse(s);
      workerShares[worker] = (workerShares[worker] || 0) + 1;
    });
    console.log('Worker shares:', workerShares);
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
    algorithm: 'SHA256d'
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tarcoin-mining-pool', timestamp: Date.now() });
});

async function start() {
  await initRedis();
  await refreshBlockTemplate();
  app.listen(PORT, () => {
    console.log(`TARCOIN Mining Pool HTTP API running on port \${PORT}`);
  });
  stratumServer.listen(3333, '0.0.0.0', () => {
    console.log(`Stratum TCP server running on port 3333`);
  });
}

start();
