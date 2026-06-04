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
  const { data } = await axios.post(`http://${RPC_CONFIG.host}:${RPC_CONFIG.port}`, {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  }, {
    auth: { username: RPC_CONFIG.user, password: RPC_CONFIG.pass },
    timeout: 15000,
  });
  return data.result;
}

/**
 * @openapi
 * /api/v1/blockchain/info:
 *   get:
 *     tags: [Blockchain]
 *     summary: Get blockchain info
 *     responses:
 *       200:
 *         description: Blockchain information
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const info = await rpcCall('getblockchaininfo');
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/v1/blockchain/block/{hash}:
 *   get:
 *     tags: [Blockchain]
 *     summary: Get block by hash
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/block/:hash', async (req: Request, res: Response) => {
  try {
    const block = await rpcCall('getblock', [req.params.hash, 2]);
    res.json(block);
  } catch (err: any) {
    res.status(404).json({ error: 'Block not found' });
  }
});

/**
 * @openapi
 * /api/v1/blockchain/block/height/{height}:
 *   get:
 *     tags: [Blockchain]
 *     summary: Get block by height
 */
router.get('/block/height/:height', async (req: Request, res: Response) => {
  try {
    const hash = await rpcCall('getblockhash', [parseInt(req.params.height)]);
    const block = await rpcCall('getblock', [hash, 2]);
    res.json(block);
  } catch (err: any) {
    res.status(404).json({ error: 'Block not found' });
  }
});

/**
 * @openapi
 * /api/v1/blockchain/supply:
 *   get:
 *     tags: [Blockchain]
 *     summary: Get supply information
 */
router.get('/supply', async (req: Request, res: Response) => {
  try {
    const info = await rpcCall('getblockchaininfo');
    const txoutset = await rpcCall('gettxoutsetinfo');
    res.json({
      totalSupply: 50000000000,
      ecosystemTreasuryAllocation: 10000000000,
      publicMiningSupply: 40000000000,
      circulating: Math.floor(txoutset.total_amount || 10000000000),
      blockHeight: info.blocks,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/v1/blockchain/difficulty:
 *   get:
 *     tags: [Blockchain]
 *     summary: Get current difficulty
 */
router.get('/difficulty', async (req: Request, res: Response) => {
  try {
    const difficulty = await rpcCall('getdifficulty');
    res.json({ difficulty });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;