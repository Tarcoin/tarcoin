import { createClient } from 'redis';
type RedisClient = ReturnType<typeof createClient>;
export declare class CacheManager {
    private client;
    private defaultTTL;
    constructor(client: RedisClient | null);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    flush(): Promise<void>;
    blockKey(hash: string): string;
    blockHeightKey(height: number): string;
    recentBlocksKey(): string;
    txKey(txid: string): string;
    addressKey(address: string): string;
    addressTxsKey(address: string): string;
    addressUtxoKey(address: string): string;
    mempoolKey(): string;
    mempoolStatsKey(): string;
    supplyKey(): string;
    networkStatsKey(): string;
    richListKey(): string;
}
export {};
//# sourceMappingURL=CacheManager.d.ts.map