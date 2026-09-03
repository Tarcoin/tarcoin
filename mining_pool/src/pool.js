// TARCOIN Mining Pool - Stratum Protocol Server
// Implements proper SHA256d block verification for TARCOIN mainnet
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const net = require('net');
const axios = require('axios');
const cron = require('node-cron');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Helper: sanitize miner-supplied strings before logging (prevent log injection)
function sanitizeLog(str) {
  if (typeof str !== 'string') return '""';
  return JSON.stringify(str.slice(0, 128));
}

// Helper: safely extract real client IP (prevent x-forwarded-for spoofing)
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Take only the first IP in the chain (the original client)
    const first = forwarded.split(',')[0].trim();
    // Validate it looks like an IP address
    if (/^[\d.a-fA-F:]+$/.test(first)) return first;
  }
  return req.socket.remoteAddress || '0.0.0.0';
}

// Rate limiter for faucet endpoint (max 5 requests per IP per hour)
const faucetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many faucet requests. Please try again later.' },
});

const app = express();
app.set('trust proxy', 1);
app.set('trust proxy', 1); // Trust Nginx proxy for accurate IP rate limiting
const apiLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const PORT = process.env.PORT || 3001;
const RPC_HOST = process.env.RPC_HOST || '127.0.0.1';
const RPC_PORT = process.env.RPC_PORT || 19332;
const RPC_USER = process.env.RPC_USER || 'tarcoin';
const RPC_PASS = process.env.RPC_PASS || 'tarcoin';
const RPC_WALLET = process.env.RPC_WALLET || ''; // e.g. "mining_pool"

// ====== TARCOIN constants ======
const TARCOIN_NBITS = '1f00ffff';
const POW_LIMIT = Buffer.from('0000ffff00000000000000000000000000000000000000000000000000000000', 'hex');

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/', apiLimiter);

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
async function rpcCall(method, params = [], walletOverride = null) {
  // Wallet commands like getbalance, sendmany, sendtoaddress need the /wallet/ path if a named wallet is used
  const isWalletCommand = ['getbalance', 'sendmany', 'sendtoaddress', 'validateaddress', 'getnewaddress'].includes(method);
  const activeWallet = walletOverride || RPC_WALLET;
  const urlPath = (isWalletCommand && activeWallet) ? `/wallet/${activeWallet}` : '/';
  
  const { data } = await axios.post(`http://${RPC_HOST}:${RPC_PORT}${urlPath}`, {
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

// ====== VarInt helper ======
function encodeVarInt(n) {
  if (n < 0xfd) return n.toString(16).padStart(2, '0');
  const buf = Buffer.alloc(3);
  buf[0] = 0xfd;
  buf.writeUInt16LE(n, 1);
  return buf.toString('hex');
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

// ====== Vardiff Config ======
const VARDIFF = {
  startDiff:   10000,    // Default starting difficulty (same as before, vardiff adjusts from here)
  minDiff:     64,       // Absolute minimum (protects server from tiny miners)
  maxDiff:     30000000, // Absolute maximum (protects server from whale ASICs)
  targetTime:  10,       // Target seconds between shares
  retargetEvery: 60000,  // Retarget interval in ms (60 seconds)
  variance:    0.25,     // Allow 25% variance before adjusting
};

// ====== Parse d=XXXX or diff=XXXX from miner password field ======
function parseDiffOverride(password) {
  if (!password || typeof password !== 'string') return null;
  // Accept: d=12500 or diff=12500 anywhere in the password string
  const match = password.match(/(?:^|[,;])(?:diff|d)=(\d+)/i);
  if (!match) return null;
  const requested = parseInt(match[1], 10);
  if (isNaN(requested)) return null;
  // Clamp to safe range
  return Math.min(VARDIFF.maxDiff, Math.max(VARDIFF.minDiff, requested));
}

// ====== Pool state ======
const activeSockets = new Set();
let poolState = {
  blockTemplate: null,
  miners: new Map(),
  totalHashrate: 0,
  blocksFound: 0,
  activeWorkers: 0,
  poolWallet: process.env.POOL_WALLET || '',
  fee: parseFloat(process.env.POOL_FEE || '1'),
  startTime: Date.now(),
};

// ====== Solo state ======
const activeSoloSockets = new Set();
let soloState = {
  miners: new Map(),
  blocksFound: 0,
  fee: 1, // 1% solo fee
};

// ====== Stratum TCP Server (port 3333) ======
console.log('Stratum server listening on port 3333');

const stratumServer = net.createServer((socket) => {
  activeSockets.add(socket);
  let workerName = '';
  let buffer = '';
  const workerId = crypto.randomBytes(8).toString('hex');
  const extraNonce1 = crypto.randomBytes(4).toString('hex');

  // Per-socket difficulty state
  let socketDiff = VARDIFF.startDiff;
  let diffOverridden = false; // true = user set d=XXXX, skip auto-vardiff
  let shareTimestamps = [];   // rolling window for vardiff calculation
  let vardiffTimer = null;

  // Send a difficulty update to this specific socket
  function sendDifficulty(diff) {
    socketDiff = diff;
    socket.write(JSON.stringify({ id: null, method: 'mining.set_difficulty', params: [diff] }) + "\n");
    if (workerName && poolState.miners.has(workerName)) {
      poolState.miners.get(workerName).difficulty = diff;
    }
  }

  // Auto-Vardiff: adjusts per-socket diff every retargetEvery ms
  function startVardiff() {
    if (diffOverridden) return; // Password override = no auto-adjust
    vardiffTimer = setInterval(() => {
      if (shareTimestamps.length < 2) return; // Not enough data yet
      const window = VARDIFF.retargetEvery / 1000; // seconds
      const now = Date.now() / 1000;
      const recentShares = shareTimestamps.filter(t => (now - t) <= window).length;
      const actualTime = recentShares > 0 ? window / recentShares : VARDIFF.targetTime * 2;
      const ratio = actualTime / VARDIFF.targetTime;

      // Only retarget if outside the variance window
      if (ratio < (1 - VARDIFF.variance) || ratio > (1 + VARDIFF.variance)) {
        let newDiff = Math.round(socketDiff * (VARDIFF.targetTime / actualTime));
        newDiff = Math.min(VARDIFF.maxDiff, Math.max(VARDIFF.minDiff, newDiff));
        if (newDiff !== socketDiff) {
          console.log(`[Vardiff] ${sanitizeLog(workerName)}: ${socketDiff} → ${newDiff} (${recentShares} shares in ${window}s)`);
          sendDifficulty(newDiff);
        }
      }
      shareTimestamps = []; // Reset window
    }, VARDIFF.retargetEvery);
  }

  console.log(`New miner connected: ${workerId}`);

  socket.on('data', async (data) => {
    buffer += data.toString();
    if (!buffer.includes('\n')) return;
    
    const messages = buffer.split('\n');
    buffer = messages.pop(); // keep remainder
    
    for (const msg of messages) {
      if (!msg.trim()) continue;
      try {
        const message = JSON.parse(msg);

        switch (message.method) {
          case 'mining.configure':
            let mask = "1fffe000";
            if (message.params && message.params[1] && message.params[1]["version-rolling.mask"]) {
                mask = message.params[1]["version-rolling.mask"];
            }
            socket.write(JSON.stringify({
              id: message.id,
              result: {
                "version-rolling": true,
                "version-rolling.mask": mask
              },
              error: null
            }) + "\n");
            break;

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
            sendDifficulty(socketDiff);
            sendWork(socket);
            break;

          case 'mining.authorize':
            workerName = message.params[0];
            const password = message.params[1] || '';

            // Check for d=XXXX or diff=XXXX password override
            const overrideDiff = parseDiffOverride(password);
            if (overrideDiff !== null) {
              diffOverridden = true;
              socketDiff = overrideDiff;
              console.log(`[DiffOverride] ${sanitizeLog(workerName)} requested d=${overrideDiff}`);
              sendDifficulty(overrideDiff);
            }

            poolState.miners.set(workerName, {
              hashrate: 0, shares: 0, validShares: 0, invalidShares: 0,
              lastSeen: Date.now(), workerId, extraNonce1,
              difficulty: socketDiff,
            });
            socket.write(JSON.stringify({ id: message.id, result: true, error: null }) + "\n");
            poolState.activeWorkers = poolState.miners.size;
            console.log('Miner authorized: %s (diff: %d%s)', sanitizeLog(workerName), socketDiff, diffOverridden ? ' [override]' : ' [vardiff]');
            startVardiff();
            break;

          case 'mining.submit':
            // Record share timestamp for vardiff
            shareTimestamps.push(Date.now() / 1000);
            if (shareTimestamps.length > 500) shareTimestamps.shift(); // cap array size
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
    if (vardiffTimer) clearInterval(vardiffTimer);
    console.log('Miner disconnected: %s', sanitizeLog(workerName || workerId));
    if (workerName) {
      poolState.miners.delete(workerName);
      poolState.activeWorkers = poolState.miners.size;
    }
  });
  
  socket.on('error', (err) => {
    console.warn('Socket error from %s: %s', sanitizeLog(workerName || workerId), sanitizeLog(err.message));
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

// ====== Solo Stratum TCP Server (port 3334) ======
console.log('Solo Stratum server listening on port 3334');

const soloStratumServer = net.createServer((socket) => {
  activeSoloSockets.add(socket);
  let workerName = '';
  let buffer = '';
  const workerId = crypto.randomBytes(8).toString('hex');
  const extraNonce1 = crypto.randomBytes(4).toString('hex');

  let socketDiff = VARDIFF.startDiff;
  let diffOverridden = false;
  let shareTimestamps = [];
  let vardiffTimer = null;

  function sendSoloDifficulty(diff) {
    socketDiff = diff;
    socket.write(JSON.stringify({ id: null, method: 'mining.set_difficulty', params: [diff] }) + "\n");
    if (workerName && soloState.miners.has(workerName)) {
      soloState.miners.get(workerName).difficulty = diff;
    }
  }

  function startSoloVardiff() {
    if (diffOverridden) return;
    vardiffTimer = setInterval(() => {
      if (shareTimestamps.length < 2) return;
      const window = VARDIFF.retargetEvery / 1000;
      const now = Date.now() / 1000;
      const recentShares = shareTimestamps.filter(t => (now - t) <= window).length;
      const actualTime = recentShares > 0 ? window / recentShares : VARDIFF.targetTime * 2;
      const ratio = actualTime / VARDIFF.targetTime;
      if (ratio < (1 - VARDIFF.variance) || ratio > (1 + VARDIFF.variance)) {
        let newDiff = Math.round(socketDiff * (VARDIFF.targetTime / actualTime));
        newDiff = Math.min(VARDIFF.maxDiff, Math.max(VARDIFF.minDiff, newDiff));
        if (newDiff !== socketDiff) {
          console.log(`[Solo Vardiff] ${sanitizeLog(workerName)}: ${socketDiff} → ${newDiff}`);
          sendSoloDifficulty(newDiff);
        }
      }
      shareTimestamps = [];
    }, VARDIFF.retargetEvery);
  }

  console.log(`New SOLO miner connected: ${workerId}`);

  socket.on('data', async (data) => {
    buffer += data.toString();
    if (!buffer.includes('\n')) return;
    const messages = buffer.split('\n');
    buffer = messages.pop();
    for (const msg of messages) {
      if (!msg.trim()) continue;
      try {
        const message = JSON.parse(msg);
        switch (message.method) {
          case 'mining.configure':
            let mask = "1fffe000";
            if (message.params && message.params[1] && message.params[1]["version-rolling.mask"]) {
              mask = message.params[1]["version-rolling.mask"];
            }
            socket.write(JSON.stringify({ id: message.id, result: { "version-rolling": true, "version-rolling.mask": mask }, error: null }) + "\n");
            break;

          case 'mining.subscribe':
            socket.write(JSON.stringify({
              id: message.id,
              result: [
                [['mining.set_difficulty', 'tarcoin-solo-' + workerId], ['mining.notify', 'tarcoin-solo-' + workerId]],
                extraNonce1,
                4,
              ],
              error: null,
            }) + "\n");
            sendSoloDifficulty(socketDiff);
            // DO NOT call sendWork(socket) here. It will be sent via sendSoloWork during authorize.
            break;

          case 'mining.authorize':
            workerName = message.params[0];
            const password = message.params[1] || '';
            const overrideDiff = parseDiffOverride(password);
            if (overrideDiff !== null) {
              diffOverridden = true;
              socketDiff = overrideDiff;
              sendSoloDifficulty(overrideDiff);
            }
            // Store socket reference so refreshBlockTemplate can push new work
            const soloMinerEntry = {
              shares: 0, validShares: 0, lastSeen: Date.now(),
              workerId, extraNonce1, difficulty: socketDiff,
              socket, // store socket for template refresh pushes
              coinbase1: null, coinbase2: null,
              jobId: crypto.randomBytes(4).toString('hex'),
            };
            soloState.miners.set(workerName, soloMinerEntry);
            socket.write(JSON.stringify({ id: message.id, result: true, error: null }) + "\n");
            console.log('[SOLO] Miner authorized: %s', sanitizeLog(workerName));
            startSoloVardiff();
            // Build custom coinbase async and send work immediately
            (async () => {
              try {
                if (poolState.blockTemplate?.rawTemplate) {
                  const minerAddress = workerName.split('.')[0];
                  const { coinbase1, coinbase2 } = await buildSoloCoinbase(minerAddress, poolState.blockTemplate.rawTemplate);
                  soloMinerEntry.coinbase1 = coinbase1;
                  soloMinerEntry.coinbase2 = coinbase2;
                  if (!socket.destroyed) sendSoloWork(socket, soloMinerEntry);
                  console.log('[SOLO] Custom coinbase built and work sent to %s', sanitizeLog(workerName));
                }
              } catch (e) {
                console.warn('[SOLO] Failed to build coinbase for %s: %s', sanitizeLog(workerName), sanitizeLog(e.message || String(e)));
              }
            })();
            break;

          case 'mining.submit':
            shareTimestamps.push(Date.now() / 1000);
            if (shareTimestamps.length > 500) shareTimestamps.shift();
            await handleSoloSubmit(socket, message, workerName, extraNonce1);
            break;
        }
      } catch (err) {
        console.error('[SOLO] Stratum message error:', sanitizeLog(err.message || String(err)));
      }
    }
  });

  socket.on('close', () => {
    activeSoloSockets.delete(socket);
    if (vardiffTimer) clearInterval(vardiffTimer);
    console.log('[SOLO] Miner disconnected: %s', sanitizeLog(workerName || workerId));
    if (workerName) soloState.miners.delete(workerName);
  });

  socket.on('error', (err) => {
    console.warn('[SOLO] Socket error from %s: %s', sanitizeLog(workerName || workerId), sanitizeLog(err.message));
  });
});

soloStratumServer.listen(3334, () => console.log('Solo Stratum server ready on port 3334'));

// ====== Solo share handler ======
async function handleSoloSubmit(socket, message, workerName, extraNonce1) {
  let worker = soloState.miners.get(workerName) || soloState.miners.get(message.params[0]);
  if (!worker) {
    worker = { shares: 0, validShares: 0, lastSeen: Date.now(), workerId: extraNonce1, extraNonce1, difficulty: VARDIFF.startDiff, coinbase1: null, coinbase2: null };
    soloState.miners.set(message.params[0], worker);
  }
  workerName = message.params[0];

  const [_w, jobId, extraNonce2, nTime, nonce] = message.params;
  const safeJobId = String(jobId).replace(/[\r\n]/g, '').substring(0, 32);

  // Use the miner's own jobId, not the pool's shared one
  if (!poolState.blockTemplate || worker.jobId !== jobId) {
    socket.write(JSON.stringify({ id: message.id, result: null, error: [21, 'Job not found', null] }) + "\n");
    return;
  }

  // Use the miner's CUSTOM coinbase (with their wallet address baked in)
  if (!worker.coinbase1 || !worker.coinbase2) {
    socket.write(JSON.stringify({ id: message.id, result: null, error: [20, 'Coinbase not ready, please wait', null] }) + "\n");
    return;
  }

  const t = poolState.blockTemplate;
  try {
    // Use miner's own custom coinbase (pays to their wallet directly)
    const coinbaseHex = worker.coinbase1 + extraNonce1 + extraNonce2 + worker.coinbase2;
    const coinbaseBuf = Buffer.from(coinbaseHex, 'hex');
    const coinbaseTxid = sha256d(coinbaseBuf);

    let merkleRoot = coinbaseTxid;
    for (const branch of t.merkleBranch) {
      merkleRoot = sha256d(Buffer.concat([merkleRoot, Buffer.from(branch, 'hex')]));
    }

    let finalVersion = t.version;
    if (message.params.length > 5) {
      const versionBits = parseInt(message.params[5], 16);
      const baseVersion = parseInt(t.version, 16);
      finalVersion = (baseVersion | versionBits).toString(16).padStart(8, '0');
    }

    const header = buildBlockHeader(finalVersion, t.prevHashBE, merkleRoot.toString('hex'), nTime, t.nBits, nonce);
    const headerHash = sha256d(header);

    worker.validShares++;
    worker.shares++;
    worker.lastSeen = Date.now();
    socket.write(JSON.stringify({ id: message.id, result: true, error: null }) + "\n");

    const networkTarget = nBitsToTarget(t.nBits);
    if (hashMeetsTarget(headerHash, networkTarget)) {
      await handleSoloBlockFound(header, coinbaseHex, workerName);
    }

    console.log('[SOLO] Share accepted from %s', sanitizeLog(workerName));
  } catch (err) {
    console.error('[SOLO] Share verification error:', err.message);
    socket.write(JSON.stringify({ id: message.id, result: null, error: [20, 'Verification error', null] }) + "\n");
  }
}

// ====== Real SHA256d share/block verification ======
async function handleSubmit(socket, message, workerName, extraNonce1) {
  let worker = poolState.miners.get(workerName) || poolState.miners.get(message.params[0]);
  if (!worker) {
    // If worker was deleted due to another socket disconnecting with the same name, recreate it
    worker = { hashrate: 0, shares: 0, validShares: 0, invalidShares: 0, lastSeen: Date.now(), workerId: extraNonce1, extraNonce1 };
    poolState.miners.set(message.params[0], worker);
  }
  workerName = message.params[0]; // Always trust the submit message for worker name

  const [_workerNameParam, jobId, extraNonce2, nTime, nonce] = message.params;
  
  // Sanitize jobId to prevent log injection vulnerabilities
  const safeJobId = String(jobId).replace(/[\r\n]/g, '').substring(0, 32);

  if (!poolState.blockTemplate || poolState.blockTemplate.jobId !== jobId) {
    console.log(`[DEBUG] Share rejected: Job not found (Miner sent: ${safeJobId}, Current: ${poolState.blockTemplate?.jobId})`);
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

    // Handle BIP320 Version Rolling (Bitaxe sends version bits in param 5)
    let finalVersion = t.version;
    if (message.params.length > 5) {
      const versionBits = parseInt(message.params[5], 16);
      const baseVersion = parseInt(t.version, 16);
      finalVersion = (baseVersion | versionBits).toString(16).padStart(8, '0');
    }

    // Build 80-byte block header (uses internal prevHashBE and finalVersion)
    const header = buildBlockHeader(finalVersion, t.prevHashBE, merkleRoot.toString('hex'), nTime, t.nBits, nonce);

    // Compute SHA256d of the header
    const headerHash = sha256d(header);

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
      await handleBlockFound(header, coinbaseHex, workerName);
    }

    console.log('Share accepted from %s — hash: %s...', sanitizeLog(workerName), headerHash.reverse().toString('hex').slice(0, 16));
  } catch (err) {
    console.error('Share verification error:', err.message);
    socket.write(JSON.stringify({ id: message.id, result: null, error: [20, 'Verification error', null] }) + "\n");
  }
}

async function handleBlockFound(headerBuffer, coinbaseHex, workerName) {
  const safeWorker = sanitizeLog(workerName);
  console.log('🎉 BLOCK FOUND by %s!', safeWorker);
  poolState.blocksFound++;

  try {
    const t = poolState.blockTemplate;
    const height = t?.height || 0;
    
    // Construct full serialized block (Header + TxCount + Coinbase + Txs)
    const txCount = 1 + (t.txData ? t.txData.length : 0);
    let blockHex = headerBuffer.toString('hex');
    blockHex += encodeVarInt(txCount);
    blockHex += coinbaseHex;
    if (t.txData) {
      for (const tx of t.txData) {
        blockHex += tx;
      }
    }

    console.log('Submitting block height %d to network...', height);
    // submitblock requires the raw hex of the full block
    const submissionResult = await rpcCall('submitblock', [blockHex]);
    console.log('submitblock result:', submissionResult || 'accepted');

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

async function handleSoloBlockFound(headerBuffer, coinbaseHex, workerName) {
  const safeWorker = sanitizeLog(workerName);
  console.log('🎉 SOLO BLOCK FOUND by %s! Coinbase pays miner directly.', safeWorker);
  soloState.blocksFound++;

  try {
    const t = poolState.blockTemplate;
    const height = t?.height || 0;

    // Construct full serialized block
    const txCount = 1 + (t.txData ? t.txData.length : 0);
    let blockHex = headerBuffer.toString('hex');
    blockHex += encodeVarInt(txCount);
    blockHex += coinbaseHex; // This coinbase already pays the miner's wallet directly!
    if (t.txData) {
      for (const tx of t.txData) {
        blockHex += tx;
      }
    }

    console.log('[SOLO] Submitting block height %d to network...', height);
    const submissionResult = await rpcCall('submitblock', [blockHex]);
    console.log('[SOLO] submitblock result:', submissionResult || 'accepted');
    console.log('[SOLO] 💰 49,500 TAR paid DIRECTLY to %s via coinbase — no extra tx needed!', safeWorker);

    // Store solo block record in Redis
    if (redis) {
      await redis.lPush('solo:blocks', JSON.stringify({
        worker: workerName,
        height: height + 1,
        time: Date.now(),
      }));
      await redis.lTrim('solo:blocks', 0, 99);
    }

  } catch (err) {
    console.error('[SOLO] Block found handling error:', err.message);
  }
}


// ====== Build custom coinbase for a solo miner ======
// Pays miner 99% and pool fee wallet 1% directly in the coinbase tx
async function buildSoloCoinbase(minerAddress, template) {
  // Get miner's scriptPubKey from node
  const minerValidation = await rpcCall('validateaddress', [minerAddress]);
  if (!minerValidation.isvalid || !minerValidation.scriptPubKey) {
    throw new Error(`[SOLO] Invalid miner address: ${minerAddress}`);
  }
  const minerScriptPubKey = minerValidation.scriptPubKey;

  // Get pool fee wallet scriptPubKey
  const feeWallet = process.env.FEE_WALLET || poolState.poolWallet;
  const feeValidation = await rpcCall('validateaddress', [feeWallet]);
  const feeScriptPubKey = feeValidation.scriptPubKey || ('76a914' + feeWallet + '88ac');

  const blockReward = template.coinbasevalue || 5000000000000; // smallest units (10^-8 Tar)
  const feeAmount = Math.floor(blockReward * (soloState.fee / 100));
  const minerAmount = blockReward - feeAmount;

  // Build height scriptSig (same as pool coinbase1)
  const height = template.height || 0;
  let heightBuf = Buffer.alloc(4);
  heightBuf.writeUInt32LE(height, 0);
  let end = 4;
  while (end > 1 && heightBuf[end - 1] === 0) end--;
  const trimmed = heightBuf.slice(0, end);
  const pushOp = Buffer.alloc(1);
  pushOp[0] = end;
  const heightScript = Buffer.concat([pushOp, trimmed]).toString('hex');
  const scriptSigLen = Buffer.alloc(1);
  scriptSigLen[0] = (heightScript.length / 2) + 8;
  const coinbase1 = '01000000' + '01' + '0000000000000000000000000000000000000000000000000000000000000000' + 'ffffffff' + scriptSigLen.toString('hex') + heightScript;

  // Build coinbase2 outputs: miner (99%) + pool fee (1%) + optional witness
  const minerAmountBuf = Buffer.alloc(8);
  minerAmountBuf.writeBigUInt64LE(BigInt(minerAmount), 0);
  const feeAmountBuf = Buffer.alloc(8);
  feeAmountBuf.writeBigUInt64LE(BigInt(feeAmount), 0);

  const minerOutput = minerAmountBuf.toString('hex') + encodeVarInt(minerScriptPubKey.length / 2) + minerScriptPubKey;
  const feeOutput = feeAmountBuf.toString('hex') + encodeVarInt(feeScriptPubKey.length / 2) + feeScriptPubKey;

  let witnessOutput = '';
  if (template.default_witness_commitment) {
    const witValBuf = Buffer.alloc(8, 0);
    witnessOutput = witValBuf.toString('hex') + encodeVarInt(template.default_witness_commitment.length / 2) + template.default_witness_commitment;
  }

  const numOutputs = witnessOutput ? '03' : '02'; // miner + fee + optional witness
  const coinbase2 = 'ffffffff' + numOutputs + minerOutput + feeOutput + witnessOutput + '00000000';

  return { coinbase1, coinbase2 };
}

// ====== Send solo-specific work to one socket ======
function sendSoloWork(socket, minerData) {
  if (!poolState.blockTemplate) return;
  const t = poolState.blockTemplate;
  socket.write(JSON.stringify({
    id: null,
    method: 'mining.notify',
    params: [
      minerData.jobId,
      t.stratumPrevHash,
      minerData.coinbase1,
      minerData.coinbase2,
      t.merkleBranch,
      t.version,
      t.nBits,
      t.nTime,
      true,
    ],
  }) + "\n");
}

// ====== Block template refresh ======
async function refreshBlockTemplate() {
  try {
    // Some nodes require segwit rules to be explicitly requested
    const template = await rpcCall('getblocktemplate', [{"rules": ["segwit"]}]);
    if (template) {
      const originalPrevHash = template.previousblockhash || '0000000000000000000000000000000000000000000000000000000000000000';
      
      // Build valid coinbase1 (BIP34 block height + scriptSig length)
      const height = template.height || 0;
      let heightBuf = Buffer.alloc(4);
      heightBuf.writeUInt32LE(height, 0);
      let end = 4;
      while (end > 1 && heightBuf[end - 1] === 0) end--;
      const trimmed = heightBuf.slice(0, end);
      const pushOp = Buffer.alloc(1);
      pushOp[0] = end;
      const heightScript = Buffer.concat([pushOp, trimmed]).toString('hex');
      const scriptSigLen = Buffer.alloc(1);
      scriptSigLen[0] = (heightScript.length / 2) + 8; // +8 for extranonce1 and extranonce2
      const coinbase1 = '01000000' + '01' + '0000000000000000000000000000000000000000000000000000000000000000' + 'ffffffff' + scriptSigLen.toString('hex') + heightScript;

      // Build valid coinbase2 (Outputs + Locktime)
      const blockReward = template.coinbasevalue || 5000000000000;
      const rewardBuf = Buffer.alloc(8);
      rewardBuf.writeBigUInt64LE(BigInt(blockReward), 0);
      
      const poolScriptPubKey = '00140de17bfae2199542aefe26f3dc8d0bd475475e31';
      const rewardOutput = rewardBuf.toString('hex') + encodeVarInt(poolScriptPubKey.length / 2) + poolScriptPubKey;

      let witnessOutput = '';
      if (template.default_witness_commitment) {
          const witValBuf = Buffer.alloc(8, 0); // 0 value
          witnessOutput = witValBuf.toString('hex') + encodeVarInt(template.default_witness_commitment.length / 2) + template.default_witness_commitment;
      }
      
      const numOutputs = witnessOutput ? '02' : '01';
      const coinbase2 = 'ffffffff' + numOutputs + rewardOutput + witnessOutput + '00000000';

      const txHashes = (template.transactions || []).map(t => t.txid || t.hash);
      const merkleBranch = [];
      if (txHashes.length > 0) {
        let hashes = [null, ...txHashes.map(h => Buffer.from(h, 'hex').reverse())];
        while (hashes.length > 1) {
          if (hashes.length % 2 !== 0) hashes.push(hashes[hashes.length - 1]);
          const nextLevel = [];
          for (let i = 0; i < hashes.length; i += 2) {
            if (i === 0) {
              merkleBranch.push(hashes[1]);
              nextLevel.push(null);
            } else {
              nextLevel.push(sha256d(Buffer.concat([hashes[i], hashes[i + 1]])));
            }
          }
          hashes = nextLevel;
        }
      }

      poolState.blockTemplate = {
        jobId: crypto.randomBytes(4).toString('hex'),
        prevHashBE: originalPrevHash,
        stratumPrevHash: formatPrevHashForStratum(originalPrevHash),
        coinbase1: coinbase1,
        coinbase2: coinbase2,
        merkleBranch: merkleBranch.map(b => b.toString('hex')),
        txData: (template.transactions || []).map((t) => t.data),
        version: template.version.toString(16).padStart(8, '0'),
        nBits: template.bits,
        nTime: Math.floor(Date.now() / 1000).toString(16).padStart(8, '0'),
        height: template.height,
        target: template.target,
        rawTemplate: template, // store raw template for solo coinbase rebuilds
      };

      activeSockets.forEach((client) => {
        if (!client.destroyed) sendWork(client);
      });

      // Rebuild solo coinbases and notify each solo miner with their custom job
      for (const [workerName, minerState] of soloState.miners.entries()) {
        if (!minerState.socket || minerState.socket.destroyed) continue;
        try {
          const minerAddress = workerName.split('.')[0];
          const { coinbase1, coinbase2 } = await buildSoloCoinbase(minerAddress, template);
          minerState.coinbase1 = coinbase1;
          minerState.coinbase2 = coinbase2;
          minerState.jobId = crypto.randomBytes(4).toString('hex');
          sendSoloWork(minerState.socket, minerState);
        } catch (e) {
          console.warn('[SOLO] Could not refresh coinbase for %s: %s', sanitizeLog(workerName), e.message);
        }
      }

      console.log(`Block template refreshed — height: ${template.height}, txs: ${(template.transactions || []).length}`);
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
    // 1. Get mature, spendable balance
    let balance = 0;
    try {
      balance = await rpcCall('getbalance', ['*', 101]); // At least 6 confirmations, but coinbase needs 100
    } catch (e) {
      console.warn('Could not fetch wallet balance for payouts:', e.message);
      return;
    }

    if (balance < 50) {
      console.log(`Balance too low for payouts (${balance} TAR). Waiting for blocks to mature...`);
      return;
    }

    // 2. Fetch shares
    const shares = await redis.lRange('pool:shares', 0, -1);
    if (shares.length === 0) {
      console.log('No shares found to payout.');
      return;
    }

    const workerShares = {};
    let totalShares = 0;
    shares.forEach((s) => {
      const { worker } = JSON.parse(s);
      const walletAddress = worker.split('.')[0];
      workerShares[walletAddress] = (workerShares[walletAddress] || 0) + 1;
      totalShares++;
    });

    console.log(`Calculating payouts for ${totalShares} shares across ${Object.keys(workerShares).length} workers.`);

    // Reserve 0.1 TAR for network transaction fees
    const sendableBalance = balance - 0.1;

    // 3. Calculate proportions
    const feeWallet = process.env.FEE_WALLET || poolState.poolWallet;
    const feePercentage = poolState.fee / 100;
    const amountToDistribute = sendableBalance * (1 - feePercentage);
    const feeAmount = sendableBalance * feePercentage;
    
    const payouts = {};
    let totalAssigned = 0;

    for (const [worker, shareCount] of Object.entries(workerShares)) {
      const proportion = shareCount / totalShares;
      const workerReward = parseFloat((amountToDistribute * proportion).toFixed(8));
      
      if (workerReward >= 1) { // Minimum payout 1 TAR to avoid dust
        payouts[worker] = workerReward;
        totalAssigned += workerReward;
      }
    }

    // Assign any dust remainder and the 1% fee to the fee wallet
    const finalFee = parseFloat((sendableBalance - totalAssigned).toFixed(8));
    if (finalFee > 0 && feeWallet) {
      if (payouts[feeWallet]) {
        payouts[feeWallet] = parseFloat((payouts[feeWallet] + finalFee).toFixed(8));
      } else {
        payouts[feeWallet] = finalFee;
      }
    }

    if (Object.keys(payouts).length === 0) return;

    // 3.5 Address Validation & Safety Check (Donation Approach)
    for (const address of Object.keys(payouts)) {
      if (address === feeWallet) continue;
      
      try {
        const validation = await rpcCall('validateaddress', [address]);
        if (!validation.isvalid) {
          console.warn(`[SAFETY] Invalid address detected: ${address}. Reassigning their reward to the pool fee wallet!`);
          const invalidReward = payouts[address];
          delete payouts[address];
          
          if (feeWallet) {
            payouts[feeWallet] = parseFloat(((payouts[feeWallet] || 0) + invalidReward).toFixed(8));
          }
        }
      } catch (err) {
        console.error(`Failed to validate address ${address}:`, err.message);
      }
    }

    console.log('Executing sendmany:', payouts);

    // 4. Send the transaction
    const txid = await rpcCall('sendmany', ["", payouts, 101]);
    console.log(`💸 Payout successful! TXID: ${txid}`);

    // 5. Clear the shares ONLY if successful
    await redis.del('pool:shares');
    console.log('Cleared processed shares from Redis.');

    // 6. Bonus Engine (Miner Bounty Program)
    try {
      const faucetBalance = await rpcCall('getbalance', ['*', 1], 'faucet');
      if (faucetBalance >= 1000) {
        for (const [worker, reward] of Object.entries(payouts)) {
          if (worker === feeWallet) continue; // Skip fee wallet

          const lifetimeKey = `miner:lifetime:${worker}`;
          const lifetime = await redis.incrByFloat(lifetimeKey, reward);

          if (lifetime >= 20000) {
            const bonusClaimedKey = `miner:bonus:${worker}`;
            const alreadyClaimed = await redis.get(bonusClaimedKey);

            if (!alreadyClaimed) {
              const globalBountyKey = `miner:bounty_count`;
              const bountyCount = parseInt((await redis.get(globalBountyKey)) || '0');

              if (bountyCount < 4000) {
                // Execute Bonus Payout from Faucet Wallet
                const bonusTxid = await rpcCall('sendtoaddress', [worker, 1000], 'faucet');
                await redis.incr(globalBountyKey);
                await redis.set(bonusClaimedKey, '1');
                console.log('🎉 MINER BOUNTY AWARDED! 1,000 TAR to %s (Miner #%d). TXID: %s', sanitizeLog(worker), bountyCount + 1, bonusTxid);
              }
            }
          }
        }
      }
    } catch (bonusErr) {
      console.error('Bonus Engine error:', bonusErr.message);
    }

  } catch (err) {
    console.error('Payout error:', err.message);
  }
}

cron.schedule('0 * * * *', processPayouts);

    // ====== HTTP API ======
  app.get('/api/pool/stats', async (req, res) => {
    try {
      if (!redis) {
        return res.json({ status: 'offline', workers: {}, totalShares: 0, blocksFound: [], poolHashrate: 0 });
      }

      // 1. Fetch shares
      const sharesData = await redis.lRange('pool:shares', 0, -1);
      const workers = {};
      let totalShares = 0;

      sharesData.forEach((s) => {
        try {
          const { worker, time } = JSON.parse(s);
          const wallet = worker.split('.')[0];
          if (!workers[wallet]) workers[wallet] = { shares: 0, lastSeen: 0, difficulty: 0 };
          workers[wallet].shares++;
          if (time > workers[wallet].lastSeen) workers[wallet].lastSeen = time;
          // Attach live difficulty from miners map if available
          const minerState = poolState.miners.get(worker) || poolState.miners.get(wallet);
          if (minerState && minerState.difficulty) workers[wallet].difficulty = minerState.difficulty;
          totalShares++;
        } catch(e) {}
      });

      // 2. Fetch recent blocks
      const blocksData = await redis.lRange('pool:blocks', 0, 9);
      const blocksFound = blocksData.map(b => JSON.parse(b));

      // 3. Calculate true Pool Hashrate based on active miners and their Vardiff
      let poolHashrate = 0;
      for (const [name, miner] of poolState.miners.entries()) {
        if (Date.now() - miner.lastSeen < 600000) { // Active in last 10 mins
          // Expected Hashrate = (Difficulty * 2^32) / TargetTime
          poolHashrate += (miner.difficulty * Math.pow(2, 32)) / VARDIFF.targetTime;
        }
      }

      res.json({
        status: 'Online',
        stratum: 'stratum+tcp://stratum.tarcoin.org:3333',
        algorithm: 'SHA256d',
        activeMiners: Object.keys(workers).length,
        totalShares,
        workers,
        blocksFound,
        poolHashrate
      });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ====== Solo Stats API ======
  app.get('/api/solo/stats', async (req, res) => {
    try {
      // 1. Build solo workers from live soloState
      const workers = {};
      for (const [name, miner] of soloState.miners.entries()) {
        const wallet = name.split('.')[0];
        if (!workers[wallet]) workers[wallet] = { shares: 0, lastSeen: 0, difficulty: 0 };
        workers[wallet].shares += miner.validShares || 0;
        if (miner.lastSeen > workers[wallet].lastSeen) workers[wallet].lastSeen = miner.lastSeen;
        workers[wallet].difficulty = miner.difficulty || 0;
      }

      // 2. Fetch recent solo blocks
      let blocksFound = [];
      if (redis) {
        const blocksData = await redis.lRange('solo:blocks', 0, 9);
        blocksFound = blocksData.map(b => JSON.parse(b));
      }

      // 3. Calculate Solo Hashrate
      let soloHashrate = 0;
      for (const [name, miner] of soloState.miners.entries()) {
        if (Date.now() - miner.lastSeen < 600000) {
          soloHashrate += (miner.difficulty * Math.pow(2, 32)) / VARDIFF.targetTime;
        }
      }

      res.json({
        status: soloState.miners.size > 0 ? 'Online' : 'Waiting',
        stratum: 'stratum+tcp://stratum.tarcoin.org:3334',
        algorithm: 'SHA256d',
        fee: soloState.fee,
        activeMiners: Object.keys(workers).length,
        workers,
        blocksFound,
        soloHashrate,
      });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const path = require('path');
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
  });

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tarcoin-mining-pool', timestamp: Date.now() });
});

// ====== Faucet API ======
app.post('/api/faucet', faucetLimiter, async (req, res) => {
  try {
    const { address, token } = req.body;
    const ip = getClientIp(req);

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!token) {
      return res.status(400).json({ error: 'Bot verification token is required' });
    }

    // 0. Cloudflare Turnstile Verification
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const verifyRes = await axios.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(ip)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      if (!verifyRes.data.success) {
        return res.status(400).json({ error: 'Bot verification failed. Please refresh and try again.' });
      }
    }

    // 1. Basic format validation
    if (!address.startsWith('tar1') && !address.startsWith('T')) {
      return res.status(400).json({ error: 'Invalid address format' });
    }

    // 2. Rate limiting check via Redis
    if (redis) {
      const ipCheck = await redis.get(`faucet:ip:${ip}`);
      if (ipCheck) return res.status(429).json({ error: 'You have already claimed TAR today. Please come back in 24 hours!' });
      
      const addrCheck = await redis.get(`faucet:address:${address}`);
      if (addrCheck) return res.status(429).json({ error: 'This address has already claimed TAR today.' });
    }

    // 3. Cryptographic validation via Tarcoind
    const validation = await rpcCall('validateaddress', [address], 'faucet');
    if (!validation.isvalid) {
      return res.status(400).json({ error: 'Address is invalid on the blockchain' });
    }

    // 4. Check faucet wallet balance
    const balance = await rpcCall('getbalance', ['*', 1], 'faucet');
    if (balance < 100) {
      return res.status(503).json({ error: 'The Faucet reward limit has been reached. Thank you to the 10,000 early adopters who joined the TARCOIN network!' });
    }

    // 5. Record rate limits BEFORE sending (prevent double-spend if Redis fails after send)
    if (redis) {
      await redis.setEx(`faucet:ip:${ip}`, 315360000, '1');
      await redis.setEx(`faucet:address:${address}`, 315360000, '1');
    }

    // 6. Send TAR
    const txid = await rpcCall('sendtoaddress', [address, 100], 'faucet');

    console.log('🚰 Faucet payout sent! 100 TAR to %s. TXID: %s', sanitizeLog(address), txid);
    res.json({ success: true, txid, amount: 100 });

  } catch (err) {
    console.error('Faucet error:', err.message);
    res.status(500).json({ error: 'Internal server error processing faucet claim' });
  }
});

async function start() {
  await initRedis();
  await refreshBlockTemplate();
  app.listen(PORT, () => {
    console.log(`TARCOIN Mining Pool HTTP API running on port ${PORT}`);
  });
  stratumServer.listen(3333, '0.0.0.0', () => {
    console.log(`Stratum TCP server running on port 3333`);
  });
}

start();








