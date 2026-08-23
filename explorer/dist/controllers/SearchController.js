"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const GENESIS_HASH = '0000e37ee7aa8a88d1254ee3fe7c497c8fdaff36b29747eb64d8da68fbd9939e';
class SearchController {
    constructor(rpc, cache) {
        this.rpc = rpc;
        this.cache = cache;
    }
    async search(req, res) {
        try {
            const query = (req.query.q || '').trim();
            if (!query) {
                return res.status(400).json({ error: 'Query parameter q is required' });
            }
            // Block height (numeric)
            if (/^\d+$/.test(query)) {
                const height = parseInt(query);
                try {
                    const hash = await this.rpc.getBlockHash(height);
                    return res.json({ type: 'block', data: { height, hash }, redirect: `/block/${hash}` });
                }
                catch {
                    return res.status(404).json({ error: `No block at height ${height}` });
                }
            }
            // Block hash (64 hex chars starting with 0s typically)
            if (/^[a-fA-F0-9]{64}$/.test(query)) {
                // Try block first
                try {
                    const block = await this.rpc.getBlock(query, 1);
                    return res.json({ type: 'block', data: block, redirect: `/block/${query}` });
                }
                catch { }
                // Try transaction
                try {
                    const tx = await this.rpc.getRawTransaction(query, true);
                    return res.json({ type: 'transaction', data: tx, redirect: `/tx/${query}` });
                }
                catch { }
                return res.status(404).json({ error: 'Hash not found as block or transaction' });
            }
            // TARCOIN address — bech32 (tar1...) or legacy (T...)
            if (query.startsWith('tar1') || (query.startsWith('T') && query.length >= 26)) {
                try {
                    const info = await this.rpc.validateAddress(query);
                    return res.json({
                        type: 'address',
                        data: { address: query, isValid: info.isvalid },
                        redirect: `/address/${query}`,
                    });
                }
                catch {
                    return res.status(404).json({ error: 'Invalid address' });
                }
            }
            return res.status(400).json({
                error: 'Unrecognized query format. Enter a block height, block hash, txid, or address.',
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Search failed' });
        }
    }
}
exports.SearchController = SearchController;
//# sourceMappingURL=SearchController.js.map