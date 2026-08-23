"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MempoolController = void 0;
class MempoolController {
    constructor(rpc, cache) {
        this.rpc = rpc;
        this.cache = cache;
    }
    async getAll(req, res) {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 50, 500);
            const cached = await this.cache.get(this.cache.mempoolKey());
            if (cached)
                return res.json(cached);
            const rawMempool = await this.rpc.getRawMempool(true);
            // Convert to array and sort by fee rate descending
            const txs = Object.entries(rawMempool)
                .map(([txid, info]) => ({
                txid,
                size: info.size || info.vsize || 0,
                fee: info.fees?.base || info.fee || 0,
                feeRate: info.fees?.base ? (info.fees.base / (info.vsize || info.size || 1)) * 1000 : 0,
                time: info.time,
                depends: info.depends || [],
            }))
                .sort((a, b) => b.feeRate - a.feeRate)
                .slice(0, limit);
            const result = { count: txs.length, transactions: txs };
            await this.cache.set(this.cache.mempoolKey(), result, 10);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch mempool' });
        }
    }
    async getStats(req, res) {
        try {
            const cached = await this.cache.get(this.cache.mempoolStatsKey());
            if (cached)
                return res.json(cached);
            const info = await this.rpc.getMempoolInfo();
            const stats = {
                size: info.size,
                bytes: info.bytes,
                usage: info.usage,
                maxMempool: info.maxmempool,
                mempoolMinFee: info.mempoolminfee,
                minRelayTxFee: info.minrelaytxfee,
                unbroadcastCount: info.unbroadcastcount || 0,
            };
            await this.cache.set(this.cache.mempoolStatsKey(), stats, 10);
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch mempool stats' });
        }
    }
}
exports.MempoolController = MempoolController;
//# sourceMappingURL=MempoolController.js.map