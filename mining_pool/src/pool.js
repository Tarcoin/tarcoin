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

// ====== Pool state ======
const activeSockets = new Set();
let poolState = {
  difficulty: 10000, // Fixed pool difficulty for ASICs
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
            console.log('Miner authorized: %s', sanitizeLog(workerName));
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
      };

      activeSockets.forEach((client) => {
        if (!client.destroyed) sendWork(client);
      });
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
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to TARCOIN Mining Pool',
    status: 'Online',
    stratum: 'stratum+tcp://stratum.tarcoin.org:3333',
    algorithm: 'SHA256d'
  });
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

