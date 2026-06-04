import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';

export class TransactionController {
  constructor(
    private rpc: RpcClient,
    private cache: CacheManager
  ) {}

  async getByTxid(req: Request, res: Response) {
    try {
      const { txid } = req.params;

      if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
        return res.status(400).json({ error: 'Invalid txid format' });
      }

      const cached = await this.cache.get<any>(this.cache.txKey(txid));
      if (cached) return res.json(cached);

      const tx = await this.rpc.getRawTransaction(txid, true);

      // Enrich with value totals
      const totalOut = tx.vout?.reduce((sum: number, o: any) => sum + (o.value || 0), 0) || 0;

      const enriched = {
        ...tx,
        totalOut,
        confirmations: tx.confirmations || 0,
      };

      // Cache confirmed txs longer
      const ttl = enriched.confirmations > 0 ? 300 : 10;
      await this.cache.set(this.cache.txKey(txid), enriched, ttl);
      res.json(enriched);
    } catch (error: any) {
      res.status(404).json({ error: 'Transaction not found', message: error.message });
    }
  }
}