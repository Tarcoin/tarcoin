"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcClient = void 0;
const axios_1 = __importDefault(require("axios"));
const http_1 = __importDefault(require("http"));
const logger_1 = require("../utils/logger");
class RpcClient {
    constructor(config) {
        this.nodeDown = false;
        this.lastNodeDownLog = 0;
        // Keep-alive agent to reuse TCP connections
        const keepAliveAgent = new http_1.default.Agent({ keepAlive: true, maxSockets: 10 });
        this.client = axios_1.default.create({
            baseURL: `http://${config.host}:${config.port}`,
            auth: {
                username: config.username,
                password: config.password,
            },
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 120000,
            httpAgent: keepAliveAgent,
        });
    }
    async call(method, params = []) {
        try {
            const response = await this.client.post('', {
                jsonrpc: '2.0',
                id: Date.now(),
                method,
                params,
            });
            // Node is reachable again — log recovery once
            if (this.nodeDown) {
                this.nodeDown = false;
                logger_1.logger.info('Node connection restored');
            }
            if (response.data.error) {
                throw new Error(response.data.error.message);
            }
            return response.data.result;
        }
        catch (error) {
            // Differentiate between node-down (connection refused) and RPC errors
            const isConnectionError = error.code === 'ECONNREFUSED' ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' ||
                error.message?.includes('ECONNREFUSED');
            if (isConnectionError) {
                // Rate-limit node-down logs to once every 60 seconds
                const now = Date.now();
                if (!this.nodeDown || now - this.lastNodeDownLog > 60000) {
                    this.nodeDown = true;
                    this.lastNodeDownLog = now;
                    logger_1.logger.warn('Node unreachable — RPC calls will fail until connection is restored');
                }
                throw new Error('Node unreachable');
            }
            // Actual RPC error — log at error level
            logger_1.logger.error(`RPC call failed: ${method}`, error.message);
            throw new Error(`RPC error: ${error.message}`);
        }
    }
    // Blockchain methods
    async getBlockCount() {
        return this.call('getblockcount');
    }
    async getBlockHash(height) {
        return this.call('getblockhash', [height]);
    }
    async getBlock(hash, verbosity = 1) {
        if (hash === '0000e37ee7aa8a88d1254ee3fe7c497c8fdaff36b29747eb64d8da68fbd9939e') {
            return { hash, height: 0, time: 1782181262, confirmations: 999, tx: [], size: 233, weight: 932, difficulty: 0.00001526, bits: '1f00ffff', nonce: 65067, previousblockhash: null, merkleroot: 'eaf980618b3cde94360d83c4937c3bcebcba7cc1db9f3276eb8b180da3a2e921' };
        }
        return this.call('getblock', [hash, verbosity]);
    }
    async getBlockHeader(hash) {
        return this.call('getblockheader', [hash]);
    }
    // Transaction methods
    async getRawTransaction(txid, verbose = true) {
        return this.call('getrawtransaction', [txid, verbose ? 1 : 0]);
    }
    async getTxOut(txid, n, includemempool = true) {
        return this.call('gettxout', [txid, n, includemempool]);
    }
    // Address methods
    async validateAddress(address) {
        return this.call('validateaddress', [address]);
    }
    async getAddressInfo(address) {
        return this.call('getaddressinfo', [address]);
    }
    // Mempool methods
    async getRawMempool(verbose = true) {
        return this.call('getrawmempool', [verbose]);
    }
    async getMempoolInfo() {
        return this.call('getmempoolinfo');
    }
    // Network methods
    async getNetworkInfo() {
        return this.call('getnetworkinfo');
    }
    async getBlockchainInfo() {
        return this.call('getblockchaininfo');
    }
    async getDifficulty() {
        return this.call('getdifficulty');
    }
    async getNetworkHashrate() {
        return this.call('getnetworkhashps');
    }
    // Supply methods
    async getTxOutSetInfo() {
        return this.call('gettxoutsetinfo');
    }
}
exports.RpcClient = RpcClient;
//# sourceMappingURL=RpcClient.js.map