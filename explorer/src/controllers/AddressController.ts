import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';

export class AddressController {
  constructor(
    private rpc: RpcClient,
    private cache: CacheManager
  ) {}

  async getByAddress(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const cached = await this.cache.get(this.cache.addressKey(address));
      if (cached) return res.json(cached);

      const info = await this.rpc.getAddressInfo(address);
      const txoutset = await this.rpc.getTxOutSetInfo();
      
      const result = {
        address,
        balance: info.balance || 0,
        totalReceived: info.totalReceived || 0,
        totalSent: info.totalSent || 0,
        unconfirmedBalance: info.unconfirmedBalance || 0,
        txCount: info.txCount || 0,
        scriptType: info.scriptType,
        isWatchOnly: info.isWatchOnly,
        isMine: info.ismine || false,
        hdKeyPath: info.hdKeyPath,
      };

      await this.cache.set(this.cache.addressKey(address), result, 30);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: 'Address not found', message: error.message });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const count = parseInt(req.query.count as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;
      
      const cached = await this.cache.get(this.cache.addressTxsKey(address));
      if (cached) return res.json(cached);

      // Use listtransactions RPC or iterate through blocks
      const txs = await this.rpc.call<any[]>('listtransactions', ['*', count, skip, true]);
      const result = Array.isArray(txs) ? txs.filter((tx: any) => tx.address === address) : [];

      await this.cache.set(this.cache.addressTxsKey(address), result, 30);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch transactions', message: error.message });
    }
  }

  async getUtxo(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const cached = await this.cache.get(this.cache.addressUtxoKey(address));
      if (cached) return res.json(cached);

      const utxos = await this.rpc.call('listunspent', [0, 9999999, [address]]);
      await this.cache.set(this.cache.addressUtxoKey(address), utxos, 30);
      res.json(utxos);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch UTXOs', message: error.message });
    }
  }
}