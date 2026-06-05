import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';

export class BlockController {
  constructor(
    private rpc: RpcClient,
    private cache: CacheManager
  ) {}

  async getByHash(req: Request, res: Response) {
    try {
      const { hash } = req.params;
      const cached = await this.cache.get(this.cache.blockKey(hash));
      if (cached) return res.json(cached);

      const block = await this.rpc.getBlock(hash, 2);
      await this.cache.set(this.cache.blockKey(hash), block, 30);
      res.json(block);
    } catch (error: any) {
      res.status(404).json({ error: 'Block not found', message: error.message });
    }
  }

  async getByHeight(req: Request, res: Response) {
    try {
      const height = parseInt(req.params.height);
      const cached = await this.cache.get(this.cache.blockHeightKey(height));
      if (cached) return res.json(cached);

      const hash = await this.rpc.getBlockHash(height);
      const block = await this.rpc.getBlock(hash, 2);
      await this.cache.set(this.cache.blockHeightKey(height), block, 30);
      res.json(block);
    } catch (error: any) {
      res.status(404).json({ error: 'Block not found', message: error.message });
    }
  }

  async getRecent(req: Request, res: Response) {
    try {
      const count = parseInt(req.query.count as string) || 10;
      const cached = await this.cache.get(this.cache.recentBlocksKey());
      if (cached) return res.json(cached);

      const currentHeight = await this.rpc.getBlockCount();
      const blocks = [];
      
      for (let i = 0; i < Math.min(count, 100); i++) {
        const hash = await this.rpc.getBlockHash(currentHeight - i);
        const block = await this.rpc.getBlock(hash, 1);
        if (block) blocks.push(block);
      }

      await this.cache.set(this.cache.recentBlocksKey(), blocks, 15);
      res.json(blocks);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch blocks', message: error.message });
    }
  }
}