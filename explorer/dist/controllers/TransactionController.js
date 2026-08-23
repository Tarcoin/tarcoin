"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
class TransactionController {
    constructor(rpc, cache) {
        this.rpc = rpc;
        this.cache = cache;
    }
    async getByTxid(req, res) {
        try {
            const { txid } = req.params;
            if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
                return res.status(400).json({ error: 'Invalid txid format' });
            }
            const cached = await this.cache.get(this.cache.txKey(txid));
            if (cached)
                return res.json(cached);
            const tx = await this.rpc.getRawTransaction(txid, true);
            // Enrich with value totals
            const totalOut = tx.vout?.reduce((sum, o) => sum + (o.value || 0), 0) || 0;
            const enriched = {
                ...tx,
                totalOut,
                confirmations: tx.confirmations || 0,
            };
            // Cache confirmed txs longer
            const ttl = enriched.confirmations > 0 ? 300 : 10;
            await this.cache.set(this.cache.txKey(txid), enriched, ttl);
            res.json(enriched);
        }
        catch (error) {
            res.status(404).json({ error: 'Transaction not found' });
        }
    }
    async broadcast(req, res) {
        try {
            const { rawtx } = req.body;
            if (!rawtx || typeof rawtx !== 'string') {
                return res.status(400).json({ error: 'Missing rawtx string' });
            }
            // Use the generic call method for sendrawtransaction
            const txid = await this.rpc.call('sendrawtransaction', [rawtx]);
            res.json({ success: true, txid });
        }
        catch (error) {
            console.error('Broadcast failed:', error.message || error);
            res.status(500).json({ error: 'Broadcast failed', details: error.message || error });
        }
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=TransactionController.js.map