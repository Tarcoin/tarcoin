import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';

export class SupplyController {
  constructor(
    private rpc: RpcClient,
    private cache: CacheManager
  ) {}

  async getSupply(req: Request, res: Response) {
    try {
      const cached = await this.cache.get(this.cache.supplyKey());
      if (cached) return res.json(cached);

      const info = await this.rpc.getBlockchainInfo();
      const txoutset = await this.rpc.getTxOutSetInfo();
      
      const supply = {
        totalSupply: 50000000000,
        ecosystemTreasuryAllocation: 10000000000,
        publicMiningSupply: 40000000000,
        circulating: Math.floor(txoutset.total_amount || 10000000000),
        blockHeight: info.blocks,
        lastUpdated: Date.now(),
      };

      await this.cache.set(this.cache.supplyKey(), supply, 60);
      res.json(supply);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch supply', message: error.message });
    }
  }

  async getCirculating(req: Request, res: Response) {
    try {
      const txoutset = await this.rpc.getTxOutSetInfo();
      res.json({
        circulating: Math.floor(txoutset.total_amount || 10000000000),
        units: 'TAR',
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch circulating supply', message: error.message });
    }
  }

  async getNetworkStats(req: Request, res: Response) {
    try {
      const cached = await this.cache.get(this.cache.networkStatsKey());
      if (cached) return res.json(cached);

      const [info, difficulty, hashrate, mempool, network] = await Promise.all([
        this.rpc.getBlockchainInfo(),
        this.rpc.getDifficulty(),
        this.rpc.getNetworkHashrate(),
        this.rpc.getMempoolInfo(),
        this.rpc.getNetworkInfo(),
      ]);

      const stats = {
        blockHeight: info.blocks,
        difficulty,
        hashrate,
        mempool: {
          size: mempool.size,
          bytes: mempool.bytes,
          usage: mempool.usage,
        },
        connections: network.connections,
        version: network.version,
        lastUpdated: Date.now(),
      };

      await this.cache.set(this.cache.networkStatsKey(), stats, 30);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch network stats', message: error.message });
    }
  }

  async getRichList(req: Request, res: Response) {
    try {
      const cached = await this.cache.get(this.cache.richListKey());
      if (cached) return res.json(cached);

      // Note: Rich list requires iterating UTXO set
      // This is a placeholder that queries the blockchain
      const richList: any[] = [];
      
      await this.cache.set(this.cache.richListKey(), richList, 300);
      res.json(richList);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch rich list', message: error.message });
    }
  }
}