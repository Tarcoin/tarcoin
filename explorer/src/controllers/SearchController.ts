import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';

const GENESIS_HASH = '000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0';

export class SearchController {
  constructor(
    private rpc: RpcClient,
    private cache: CacheManager
  ) {}

  async search(req: Request, res: Response) {
    try {
      const query = (req.query.q as string || '').trim();

      if (!query) {
        return res.status(400).json({ error: 'Query parameter q is required' });
      }

      // Block height (numeric)
      if (/^\d+$/.test(query)) {
        const height = parseInt(query);
        try {
          const hash = await this.rpc.getBlockHash(height);
          return res.json({ type: 'block', data: { height, hash }, redirect: `/block/${hash}` });
        } catch {
          return res.status(404).json({ error: `No block at height ${height}` });
        }
      }

      // Block hash (64 hex chars starting with 0s typically)
      if (/^[a-fA-F0-9]{64}$/.test(query)) {
        // Try block first
        try {
          const block = await this.rpc.getBlock(query, 1);
          return res.json({ type: 'block', data: block, redirect: `/block/${query}` });
        } catch {}

        // Try transaction
        try {
          const tx = await this.rpc.getRawTransaction(query, true);
          return res.json({ type: 'transaction', data: tx, redirect: `/tx/${query}` });
        } catch {}

        return res.status(404).json({ error: 'Hash not found as block or transaction' });
      }

      // TARCOIN address — bech32 (tar1...) or legacy (T...)
      if (query.startsWith('tar1') || (query.startsWith('T') && query.length >= 26)) {
        try {
          const info = await this.rpc.validateAddress(query);
          return res.json({
            type: 'address',
            data: { address: query, isValid: info.isvalid },
            redirect: `/address/${query}`,
          });
        } catch {
          return res.status(404).json({ error: 'Invalid address' });
        }
      }

      return res.status(400).json({
        error: 'Unrecognized query format. Enter a block height, block hash, txid, or address.',
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Search failed', message: error.message });
    }
  }
}