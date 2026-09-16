import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';

export class AddressController {
  // A lock map to prevent overlapping scantxoutset calls for the same address
  private activeScans = new Map<string, Promise<any>>();

  constructor(
    private rpc: RpcClient,
    private cache: CacheManager
  ) {}

  // Centralized scantxoutset to prevent RPC node overload (fixes balance dropping to 0)
  private async getScanResult(address: string): Promise<any> {
    const cacheKey = `scan_raw_deduped_${address}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    if (this.activeScans.has(address)) {
      return this.activeScans.get(address);
    }

    const promise = (async () => {
      let scanResult = null;
      try {
        const descriptors: string[] = [`addr(${address})`];
        try {
          const addrInfo = await this.rpc.call<any>('getaddressinfo', [address]);
          if (addrInfo?.scriptPubKey) {
            descriptors.push(`raw(${addrInfo.scriptPubKey})`);
          }
        } catch { /* ignore */ }
        
        scanResult = await this.rpc.call<any>('scantxoutset', ['start', descriptors]);
        if (scanResult && scanResult.success) {
          // Deduplicate UTXOs immediately
          const seen = new Set<string>();
          scanResult.unspents = (scanResult.unspents || []).filter((u: any) => {
            const key = `${u.txid}:${u.vout}`;
            return seen.has(key) ? false : (seen.add(key), true);
          });
          await this.cache.set(cacheKey, scanResult, 60); // Cache the raw scan for 60s
        } else {
          throw new Error("scantxoutset returned false");
        }
      } catch (err) {
        throw err;
      } finally {
        this.activeScans.delete(address);
      }
      return scanResult;
    })();

    this.activeScans.set(address, promise);
    return promise;
  }

  async getByAddress(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const cached = await this.cache.get(this.cache.addressKey(address));
      if (cached) return res.json(cached);

      const info = await this.rpc.validateAddress(address);
      if (!info.isvalid) {
        return res.status(404).json({ error: 'Address not found', message: 'Invalid address' });
      }

      let balance = 0;
      let totalReceived = 0;
      let txCount = 0;
      let utxos: any[] = [];

      try {
        const scanResult = await this.getScanResult(address);
        utxos = scanResult.unspents || [];
        balance = utxos.reduce((s: number, u: any) => s + (u.amount || 0), 0);
        txCount = utxos.length;
        totalReceived = balance;
      } catch (scanErr: any) {
        const safeAddress = JSON.stringify(String(address || '').slice(0, 64));
        console.error('scantxoutset failed for address %s :', safeAddress, scanErr?.message || scanErr);
        
        // FAST FALLBACK: Since scantxoutset timed out, we fallback to listtransactions
        try {
          const txs = await this.rpc.call<any[]>('listtransactions', ['*', 1000, 0, true]);
          if (Array.isArray(txs)) {
            const addrTxs = txs.filter((tx: any) => tx.address === address);
            txCount = addrTxs.length;
            for (const tx of addrTxs) {
              if (tx.amount > 0) {
                 totalReceived += tx.amount;
              }
              balance += tx.amount;
              if (tx.fee && tx.amount < 0) {
                 balance += tx.fee; // account for network fees
              }
            }
          }
        } catch (fbErr) {
           console.error('Fallback listtransactions failed for %s', safeAddress);
        }
      }

      const result = {
        address,
        balance,
        totalReceived,
        totalSent: 0,
        unconfirmedBalance: 0,
        txCount, // This is technically UTXO count now unless fallback is used
        scriptType: info.isscript ? 'script' : 'pubkey',
        isWatchOnly: info.iswatchonly || false,
        isMine: info.ismine || false,
      };

      await this.cache.set(this.cache.addressKey(address), result, 60);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: 'Address not found' });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const count = parseInt(req.query.count as string) || 999999;
      const skip = parseInt(req.query.skip as string) || 0;

      const cached = await this.cache.get(this.cache.addressTxsKey(address));
      if (cached) return res.json(cached);

      let result: any[] = [];
      try {
        const scanResult = await this.getScanResult(address);
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

        // --- CUSTOM MEMPOOL SCANNER FOR UNCONFIRMED TXS ---
        try {
          const rawMempool = await this.rpc.getRawMempool(false); // Array of txids
          const limit = Math.min(rawMempool.length, 250); // limit to 250 txs to prevent CPU overload
          for (let i = 0; i < limit; i++) {
            try {
              const txid = rawMempool[i];
              const tx = await this.rpc.getRawTransaction(txid, true);
              let isMatch = false;
              let amount = 0;
              if (tx.vout) {
                for (const vout of tx.vout) {
                  const outAddr = vout.scriptPubKey?.address || (vout.scriptPubKey?.addresses ? vout.scriptPubKey.addresses[0] : null);
                  if (outAddr === address) {
                    isMatch = true;
                    amount = vout.value;
                  }
                }
              }
              if (isMatch) {
                result.unshift({
                  txid: tx.txid,
                  amount: amount,
                  height: -1, // Pending
                  confirmations: 0,
                  coinbase: false,
                  blockhash: '',
                  time: tx.time || Math.floor(Date.now() / 1000),
                });
              }
            } catch (e) {}
          }
        } catch (e) {
          console.error('Mempool scanner error:', e);
        }
        // --- END MEMPOOL SCANNER ---

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

      let utxos: any[] = [];
      try {
        const scanResult = await this.getScanResult(address);
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
