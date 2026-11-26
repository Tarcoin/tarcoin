import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';

const COLD_STORAGE_BALANCE = 9742439000;
const FALLBACK_TOTAL_MINTED = 10717500000;
const MAX_SUPPLY = 50000000000;

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
      let totalMinted: number = FALLBACK_TOTAL_MINTED;
      try {
        const txoutset = await this.rpc.getTxOutSetInfo();
        if (txoutset && txoutset.total_amount != null) {
          totalMinted = Math.floor(txoutset.total_amount);
        }
      } catch {
        // gettxoutsetinfo can be slow or fail
      }

      const circulating = Math.max(0, totalMinted - COLD_STORAGE_BALANCE);

      const supply = {
        totalSupply: MAX_SUPPLY,
        totalMinted,
        circulating,
        coldStorageLocked: COLD_STORAGE_BALANCE,
        ecosystemTreasuryAllocation: 10000000000,
        publicMiningSupply: 40000000000,
        blockHeight: info.blocks,
        lastUpdated: Date.now(),
      };

      await this.cache.set(this.cache.supplyKey(), supply, 60);
      res.json(supply);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch supply' });
    }
  }

  async getTotal(req: Request, res: Response) {
    try {
      let totalAmount = FALLBACK_TOTAL_MINTED;
      try {
        const txoutset = await this.rpc.getTxOutSetInfo();
        if (txoutset && txoutset.total_amount != null) {
          totalAmount = Math.floor(txoutset.total_amount);
        }
      } catch {
        // Fallback to latest known minted if txoutset times out
      }

      if (req.query.format === 'plain' || req.query.format === 'text' || req.headers['accept']?.includes('text/plain')) {
        return res.setHeader('Content-Type', 'text/plain').send(totalAmount.toString());
      }

      res.json({
        total: totalAmount,
        totalSupply: totalAmount,
        maxSupply: MAX_SUPPLY,
        units: 'TAR',
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch total supply' });
    }
  }

  async getCirculating(req: Request, res: Response) {
    try {
      let totalAmount = FALLBACK_TOTAL_MINTED;
      try {
        const txoutset = await this.rpc.getTxOutSetInfo();
        if (txoutset && txoutset.total_amount != null) {
          totalAmount = Math.floor(txoutset.total_amount);
        }
      } catch {
        // Fallback to latest known minted if txoutset times out
      }

      const circulating = Math.max(0, totalAmount - COLD_STORAGE_BALANCE);

      if (req.query.format === 'plain' || req.query.format === 'text' || req.headers['accept']?.includes('text/plain')) {
        return res.setHeader('Content-Type', 'text/plain').send(circulating.toString());
      }

      res.json({
        circulating,
        circulatingSupply: circulating,
        totalMinted: totalAmount,
        coldStorageLocked: COLD_STORAGE_BALANCE,
        units: 'TAR',
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch circulating supply' });
    }
  }

  async getNetworkStats(req: Request, res: Response) {
    try {
      const cached = await this.cache.get(this.cache.networkStatsKey());
      if (cached) return res.json(cached);

      // Fetch all stats in parallel, with individual error handling
      const [info, difficulty, hashrate, mempool, network] = await Promise.all([
        this.rpc.getBlockchainInfo(),
        this.rpc.getDifficulty(),
        this.rpc.getNetworkHashrate().catch(() => 0),
        this.rpc.getMempoolInfo(),
        this.rpc.getNetworkInfo(),
      ]);

      let circulating: number | null = null;
      try {
        const txoutset = await this.rpc.getTxOutSetInfo();
        if (txoutset && txoutset.total_amount != null) {
          circulating = Math.floor(txoutset.total_amount);
        }
      } catch {
        // gettxoutsetinfo is expensive and may timeout — supply will be null
      }

      const stats = {
        blockHeight: info.blocks,
        difficulty,
        hashrate,
        totalSupply: 50000000000,
        circulating,
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
      res.status(500).json({ error: 'Failed to fetch network stats' });
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
      res.status(500).json({ error: 'Failed to fetch rich list' });
    }
  }
}