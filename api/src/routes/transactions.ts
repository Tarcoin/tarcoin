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

/**
 * @openapi
 * /api/v1/transactions/decode:
 *   post:
 *     tags: [Transactions]
 *     summary: Decode a raw transaction hex
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rawTx:
 *                 type: string
 */
router.post('/decode', async (req: Request, res: Response) => {
  try {
    const { rawTx } = req.body;
    if (!rawTx || typeof rawTx !== 'string') {
      return res.status(400).json({ error: 'rawTx hex string is required' });
    }
    const decoded = await rpcCall('decoderawtransaction', [rawTx]);
    res.json(decoded);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to decode transaction', message: err.message });
  }
});

/**
 * @openapi
 * /api/v1/transactions/send:
 *   post:
 *     tags: [Transactions]
 *     summary: Broadcast a signed raw transaction to the network
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hex:
 *                 type: string
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { hex } = req.body;
    if (!hex || typeof hex !== 'string') {
      return res.status(400).json({ error: 'hex string is required' });
    }
    const txid = await rpcCall('sendrawtransaction', [hex]);
    res.json({
      txid,
      message: 'Transaction broadcast successfully',
      url: `/tx/${txid}`,
    });
  } catch (err: any) {
    // Provide user-friendly error messages for common rejection reasons
    const msg = err.message || '';
    if (msg.includes('insufficient fee')) {
      return res.status(400).json({ error: 'Insufficient fee', message: msg });
    }
    if (msg.includes('already in block chain')) {
      return res.status(409).json({ error: 'Transaction already confirmed', message: msg });
    }
    if (msg.includes('bad-txns')) {
      return res.status(400).json({ error: 'Invalid transaction', message: msg });
    }
    res.status(400).json({ error: 'Failed to broadcast transaction', message: msg });
  }
});

/**
 * @openapi
 * /api/v1/transactions/{txid}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get a transaction by txid
 */
router.get('/:txid', async (req: Request, res: Response) => {
  try {
    const { txid } = req.params;
    if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
      return res.status(400).json({ error: 'Invalid txid format' });
    }
    const tx = await rpcCall('getrawtransaction', [txid, true]);
    res.json(tx);
  } catch (err: any) {
    res.status(404).json({ error: 'Transaction not found', message: err.message });
  }
});

export default router;