"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
class CacheManager {
    constructor(client) {
        this.defaultTTL = 60;
        this.client = client;
    }
    async get(key) {
        if (!this.client)
            return null;
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttl = this.defaultTTL) {
        if (!this.client)
            return;
        try {
            await this.client.set(key, JSON.stringify(value), { EX: ttl });
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    }
    async del(key) {
        if (!this.client)
            return;
        try {
            await this.client.del(key);
        }
        catch (error) {
            console.error('Cache del error:', error);
        }
    }
    async flush() {
        if (!this.client)
            return;
        try {
            await this.client.flushAll();
        }
        catch (error) {
            console.error('Cache flush error:', error);
        }
    }
    // Block cache keys
    blockKey(hash) { return `block:${hash}`; }
    blockHeightKey(height) { return `block:height:${height}`; }
    recentBlocksKey() { return 'blocks:recent'; }
    // Transaction cache keys
    txKey(txid) { return `tx:${txid}`; }
    // Address cache keys
    addressKey(address) { return `addr:${address}`; }
    addressTxsKey(address) { return `addr:${address}:txs`; }
    addressUtxoKey(address) { return `addr:${address}:utxo`; }
    // Mempool cache keys
    mempoolKey() { return 'mempool:all'; }
    mempoolStatsKey() { return 'mempool:stats'; }
    // Supply cache keys
    supplyKey() { return 'supply'; }
    networkStatsKey() { return 'network:stats'; }
    richListKey() { return 'richlist'; }
}
exports.CacheManager = CacheManager;
//# sourceMappingURL=CacheManager.js.map