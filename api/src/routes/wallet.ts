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
 * /api/v1/wallet/validate/{address}:
 *   get:
 *     tags: [Wallet]
 *     summary: Validate a TARCOIN address via node
 */
router.get('/validate/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const result = await rpcCall('validateaddress', [address]);
    res.json({
      address,
      valid: result.isvalid,
      scriptPubKey: result.scriptPubKey,
      isWitness: result.iswitness || false,
      witnessVersion: result.witness_version,
      witnessProgram: result.witness_program,
      network: result.isvalid
        ? address.startsWith('tar1') ? 'bech32' : 'base58'
        : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/v1/wallet/estimate-fee:
 *   get:
 *     tags: [Wallet]
 *     summary: Estimate transaction fee rate
 */
router.get('/estimate-fee', async (req: Request, res: Response) => {
  try {
    const confTarget = parseInt(req.query.blocks as string) || 6;
    let feeRate = 0.00001; // Default fallback

    try {
      const estimate = await rpcCall('estimatesmartfee', [confTarget, 'CONSERVATIVE']);
      if (estimate.feerate) {
        feeRate = estimate.feerate;
      }
    } catch {
      // Node may not have enough data for estimation yet
    }

    res.json({
      feeRate,
      unit: 'TAR/kB',
      confTarget,
      fast: Math.max(feeRate * 2, 0.0001),
      medium: feeRate,
      slow: Math.max(feeRate * 0.5, 0.000001),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/v1/wallet/utxo/{address}:
 *   get:
 *     tags: [Wallet]
 *     summary: Get UTXOs for an address
 */
router.get('/utxo/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const minConf = parseInt(req.query.minconf as string) || 0;
    const maxConf = parseInt(req.query.maxconf as string) || 9999999;

    const utxos = await rpcCall('listunspent', [minConf, maxConf, [address]]);
    const total = utxos.reduce((sum: number, u: any) => sum + u.amount, 0);

    res.json({ address, utxos, total, count: utxos.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;