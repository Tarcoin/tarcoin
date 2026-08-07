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

      const info = await this.rpc.validateAddress(address);
      if (!info.isvalid) {
        return res.status(404).json({ error: 'Address not found', message: 'Invalid address' });
      }

      // Use scantxoutset to get real UTXO balance — works without addressindex
      let balance = 0;
      let totalReceived = 0;
      let txCount = 0;
      let utxos: any[] = [];

      try {
        const scanResult = await this.rpc.call<any>('scantxoutset', ['start', [`addr(${address})`]]);
        if (scanResult && scanResult.success) {
          balance = scanResult.total_amount || 0;
          utxos = scanResult.unspents || [];
          txCount = utxos.length;
          totalReceived = balance;
        } else {
          console.error('scantxoutset returned no success:', JSON.stringify(scanResult));
        }
      } catch (scanErr: any) {
        const safeAddress = encodeURIComponent(String(address || '').slice(0, 64));
        console.error('scantxoutset failed for address %s :', safeAddress, scanErr?.message || scanErr);
      }

      const result = {
        address,
        balance,
        totalReceived,
        totalSent: 0,
        unconfirmedBalance: 0,
        txCount,
        scriptType: info.isscript ? 'script' : 'pubkey',
        isWatchOnly: info.iswatchonly || false,
        isMine: info.ismine || false,
      };

      // Cache for 60 seconds (balance changes slowly)
      await this.cache.set(this.cache.addressKey(address), result, 60);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: 'Address not found' });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const count = parseInt(req.query.count as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;

      const cached = await this.cache.get(this.cache.addressTxsKey(address));
      if (cached) return res.json(cached);

      // Use scantxoutset to find UTXOs and their transaction IDs
      let result: any[] = [];
      try {
        const scanResult = await this.rpc.call<any>('scantxoutset', ['start', [`addr(${address})`]]);
        if (scanResult && scanResult.success && scanResult.unspents) {
          // Fetch full transaction details for each UTXO
          const txDetails = await Promise.all(
            scanResult.unspents.slice(skip, skip + count).map(async (utxo: any) => {
              try {
                const tx = await this.rpc.getRawTransaction(utxo.txid, true);
                return {
                  txid: utxo.txid,
                  amount: utxo.amount,
                  height: utxo.height,
                  confirmations: utxo.confirmations,
                  coinbase: utxo.coinbase || false,
                  blockhash: utxo.blockhash,
                  time: tx?.time || tx?.blocktime || null,
                };
              } catch {
                return {
                  txid: utxo.txid,
                  amount: utxo.amount,
                  height: utxo.height,
                  confirmations: utxo.confirmations,
                  coinbase: utxo.coinbase || false,
                  blockhash: utxo.blockhash,
                };
              }
            })
          );
          result = txDetails;
        }
      } catch (scanErr) {
        // fallback: try listtransactions
        try {
          const txs = await this.rpc.call<any[]>('listtransactions', ['*', count, skip, true]);
          result = Array.isArray(txs) ? txs.filter((tx: any) => tx.address === address) : [];
        } catch {
          result = [];
        }
      }

      await this.cache.set(this.cache.addressTxsKey(address), result, 60);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  async getUtxo(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const cached = await this.cache.get(this.cache.addressUtxoKey(address));
      if (cached) return res.json(cached);

      // Use scantxoutset for reliable UTXO lookup without addressindex
      let utxos: any[] = [];
      try {
        const scanResult = await this.rpc.call<any>('scantxoutset', ['start', [`addr(${address})`]]);
        if (scanResult && scanResult.success) {
          utxos = scanResult.unspents || [];
        }
      } catch {
        // fallback to listunspent (only works for wallet addresses)
        try {
          utxos = await this.rpc.call('listunspent', [0, 9999999, [address]]);
        } catch {
          utxos = [];
        }
      }

      await this.cache.set(this.cache.addressUtxoKey(address), utxos, 60);
      res.json(utxos);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch UTXOs' });
    }
  }
}