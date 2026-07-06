import { Router, Request, Response } from 'express';
import { rpcCall } from '../lib/rpc';

const router = Router();

// TARCOIN constants
const BLOCK_REWARD_TAR_UNITS = 5000000000000; // 50,000 TAR in tar (smallest unit)
const HALVING_INTERVAL = 400000;

function getCurrentBlockReward(blockHeight: number): number {
  const halvings = Math.floor(blockHeight / HALVING_INTERVAL);
  if (halvings >= 64) return 0;
  return BLOCK_REWARD_TAR_UNITS / Math.pow(2, halvings) / 1e8;
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
    console.error('RPC error in /mining/info:', err.message);
    res.status(500).json({ error: 'Service temporarily unavailable' });
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
    console.error('RPC error in /mining/difficulty:', err.message);
    res.status(500).json({ error: 'Service temporarily unavailable' });
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
    console.error('RPC error in /mining/hashrate:', err.message);
    res.status(500).json({ error: 'Service temporarily unavailable' });
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
    console.error('RPC error in /mining/blocktemplate:', err.message);
    res.status(500).json({ error: 'Service temporarily unavailable' });
  }
});

export default router;