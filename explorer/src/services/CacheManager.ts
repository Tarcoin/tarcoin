import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

export class CacheManager {
  private client: RedisClient | null;
  private defaultTTL: number = 60;

  constructor(client: RedisClient | null) {
    this.client = client;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttl });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  async flush(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  // Block cache keys
  blockKey(hash: string): string { return `block:${hash}`; }
  blockHeightKey(height: number): string { return `block:height:${height}`; }
  recentBlocksKey(): string { return 'blocks:recent'; }

  // Transaction cache keys
  txKey(txid: string): string { return `tx:${txid}`; }

  // Address cache keys
  addressKey(address: string): string { return `addr:${address}`; }
  addressTxsKey(address: string): string { return `addr:${address}:txs`; }
  addressUtxoKey(address: string): string { return `addr:${address}:utxo`; }

  // Mempool cache keys
  mempoolKey(): string { return 'mempool:all'; }
  mempoolStatsKey(): string { return 'mempool:stats'; }

  // Supply cache keys
  supplyKey(): string { return 'supply'; }
  networkStatsKey(): string { return 'network:stats'; }
  richListKey(): string { return 'richlist'; }
}