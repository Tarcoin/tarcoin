"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplyController = void 0;
class SupplyController {
    constructor(rpc, cache) {
        this.rpc = rpc;
        this.cache = cache;
    }
    async getSupply(req, res) {
        try {
            const cached = await this.cache.get(this.cache.supplyKey());
            if (cached)
                return res.json(cached);
            const info = await this.rpc.getBlockchainInfo();
            let circulating = null;
            try {
                const txoutset = await this.rpc.getTxOutSetInfo();
                if (txoutset && txoutset.total_amount != null) {
                    circulating = Math.floor(txoutset.total_amount);
                }
            }
            catch {
                // gettxoutsetinfo can be slow or fail — circulating will be null
            }
            const supply = {
                totalSupply: 50000000000,
                ecosystemTreasuryAllocation: 10000000000,
                publicMiningSupply: 40000000000,
                circulating,
                blockHeight: info.blocks,
                lastUpdated: Date.now(),
            };
            await this.cache.set(this.cache.supplyKey(), supply, 60);
            res.json(supply);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch supply' });
        }
    }
    async getCirculating(req, res) {
        try {
            const txoutset = await this.rpc.getTxOutSetInfo();
            const circulating = txoutset && txoutset.total_amount != null
                ? Math.floor(txoutset.total_amount)
                : null;
            res.json({
                circulating,
                units: 'TAR',
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch circulating supply' });
        }
    }
    async getNetworkStats(req, res) {
        try {
            const cached = await this.cache.get(this.cache.networkStatsKey());
            if (cached)
                return res.json(cached);
            // Fetch all stats in parallel, with individual error handling
            const [info, difficulty, hashrate, mempool, network] = await Promise.all([
                this.rpc.getBlockchainInfo(),
                this.rpc.getDifficulty(),
                this.rpc.getNetworkHashrate().catch(() => 0),
                this.rpc.getMempoolInfo(),
                this.rpc.getNetworkInfo(),
            ]);
            let circulating = null;
            try {
                const txoutset = await this.rpc.getTxOutSetInfo();
                if (txoutset && txoutset.total_amount != null) {
                    circulating = Math.floor(txoutset.total_amount);
                }
            }
            catch {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch network stats' });
        }
    }
    async getRichList(req, res) {
        try {
            const cached = await this.cache.get(this.cache.richListKey());
            if (cached)
                return res.json(cached);
            // Note: Rich list requires iterating UTXO set
            // This is a placeholder that queries the blockchain
            const richList = [];
            await this.cache.set(this.cache.richListKey(), richList, 300);
            res.json(richList);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch rich list' });
        }
    }
}
exports.SupplyController = SupplyController;
//# sourceMappingURL=SupplyController.js.map