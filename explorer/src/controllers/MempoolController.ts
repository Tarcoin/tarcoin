import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';

export class MempoolController {
  constructor(
    private rpc: RpcClient,
    private cache: CacheManager
  ) {}

  async getAll(req: Request, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
      const cached = await this.cache.get<any>(this.cache.mempoolKey());
      if (cached) return res.json(cached);

      const rawMempool = await this.rpc.getRawMempool(true);

      // Convert to array and sort by fee rate descending
      const txs = Object.entries(rawMempool as Record<string, any>)
        .map(([txid, info]: [string, any]) => ({
          txid,
          size: info.size || info.vsize || 0,
          fee: info.fees?.base || info.fee || 0,
          feeRate: info.fees?.base ? (info.fees.base / (info.vsize || info.size || 1)) * 1000 : 0,
          time: info.time,
          depends: info.depends || [],
        }))
        .sort((a, b) => b.feeRate - a.feeRate)
        .slice(0, limit);

      const result = { count: txs.length, transactions: txs };
      await this.cache.set(this.cache.mempoolKey(), result, 10);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch mempool', message: error.message });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const cached = await this.cache.get<any>(this.cache.mempoolStatsKey());
      if (cached) return res.json(cached);

      const info = await this.rpc.getMempoolInfo();
      const stats = {
        size: info.size,
        bytes: info.bytes,
        usage: info.usage,
        maxMempool: info.maxmempool,
        mempoolMinFee: info.mempoolminfee,
        minRelayTxFee: info.minrelaytxfee,
        unbroadcastCount: info.unbroadcastcount || 0,
      };

      await this.cache.set(this.cache.mempoolStatsKey(), stats, 10);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch mempool stats', message: error.message });
    }
  }
}