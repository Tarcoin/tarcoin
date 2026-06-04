import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();
const RPC_CONFIG = {
  host: process.env.RPC_HOST || '127.0.0.1',
  port: parseInt(process.env.RPC_PORT || '19332'),
  user: process.env.RPC_USER || 'tarcoin',
  pass: process.env.RPC_PASS || 'tarcoin',
};

async function rpcCall(method: string, params: any[] = []) {
  const { data } = await axios.post(
    `http://${RPC_CONFIG.host}:${RPC_CONFIG.port}`,
    { jsonrpc: '2.0', id: Date.now(), method, params },
    { auth: { username: RPC_CONFIG.user, password: RPC_CONFIG.pass }, timeout: 15000 }
  );
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// TARCOIN constants
const BLOCK_REWARD_SATOSHIS = 5000000000000; // 50,000 TAR in satoshis
const HALVING_INTERVAL = 400000;

function getCurrentBlockReward(blockHeight: number): number {
  const halvings = Math.floor(blockHeight / HALVING_INTERVAL);
  if (halvings >= 64) return 0;
  return BLOCK_REWARD_SATOSHIS / Math.pow(2, halvings) / 1e8;
}

/**
 * @openapi
 * /api/v1/mining/info:
 *   get:
 *     tags: [Mining]
 *     summary: Get full mining information from node
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const [miningInfo, blockchainInfo, networkHashps] = await Promise.all([
      rpcCall('getmininginfo'),
      rpcCall('getblockchaininfo'),
      rpcCall('getnetworkhashps', [120, -1]).catch(() => 0),
    ]);

    res.json({
      algorithm: 'SHA256d',
      blocks: miningInfo.blocks,
      currentBlockSize: miningInfo.currentblocksize || 0,
      currentBlockWeight: miningInfo.currentblockweight || 0,
      difficulty: miningInfo.difficulty,
      networkHashrate: networkHashps,
      networkHashrateUnit: 'H/s',
      pooledTx: miningInfo.pooledtx || 0,
      chain: miningInfo.chain,
      blockReward: getCurrentBlockReward(miningInfo.blocks),
      blockRewardUnit: 'TAR',
      halvingInterval: HALVING_INTERVAL,
      nextHalvingBlock: HALVING_INTERVAL - (miningInfo.blocks % HALVING_INTERVAL),
      blocksUntilHalving: HALVING_INTERVAL - (miningInfo.blocks % HALVING_INTERVAL),
      currentEra: Math.floor(miningInfo.blocks / HALVING_INTERVAL) + 1,
      asicCompatible: true,
      stratumPort: 3333,
      totalSupply: 50000000000,
      publicMiningSupply: 40000000000,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/v1/mining/difficulty:
 *   get:
 *     tags: [Mining]
 *     summary: Get current and estimated next difficulty
 */
router.get('/difficulty', async (req: Request, res: Response) => {
  try {
    const [difficulty, hashps] = await Promise.all([
      rpcCall('getdifficulty'),
      rpcCall('getnetworkhashps', [120, -1]).catch(() => 0),
    ]);

    res.json({
      difficulty,
      networkHashrate: hashps,
      networkHashrateUnit: 'H/s',
      nBits: '1f00ffff',
      powTarget: '0000ffff00000000000000000000000000000000000000000000000000000000',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/v1/mining/hashrate:
 *   get:
 *     tags: [Mining]
 *     summary: Get network hashrate over last N blocks
 */
router.get('/hashrate', async (req: Request, res: Response) => {
  try {
    const nblocks = parseInt(req.query.blocks as string) || 120;
    const hashps = await rpcCall('getnetworkhashps', [nblocks, -1]);
    res.json({
      hashrate: hashps,
      unit: 'H/s',
      averageBlocks: nblocks,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/v1/mining/blocktemplate:
 *   get:
 *     tags: [Mining]
 *     summary: Get a block template for mining
 */
router.get('/blocktemplate', async (req: Request, res: Response) => {
  try {
    const template = await rpcCall('getblocktemplate', [{ rules: ['segwit'] }]);
    res.json(template);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;