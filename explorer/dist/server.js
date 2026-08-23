"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("redis");
const logger_1 = require("./utils/logger");
const RpcClient_1 = require("./services/RpcClient");
const BlockController_1 = require("./controllers/BlockController");
const TransactionController_1 = require("./controllers/TransactionController");
const AddressController_1 = require("./controllers/AddressController");
const MempoolController_1 = require("./controllers/MempoolController");
const SupplyController_1 = require("./controllers/SupplyController");
const SearchController_1 = require("./controllers/SearchController");
const WebSocketManager_1 = require("./services/WebSocketManager");
const CacheManager_1 = require("./services/CacheManager");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;
// Create HTTP server first (needed for WebSocket)
const server = (0, http_1.createServer)(app);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false, // Required for WebSocket compatibility
}));
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://tarcoin.org').split(',').map(s => s.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '1mb' }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Health check
app.get('/health', async (_req, res) => {
    let nodeStatus = 'unknown';
    try {
        const rpc = new RpcClient_1.RpcClient({
            host: process.env.RPC_HOST || '127.0.0.1',
            port: parseInt(process.env.RPC_PORT || '19332'),
            username: process.env.RPC_USER || 'tarcoin',
            password: process.env.RPC_PASS || 'tarcoin',
        });
        await rpc.getBlockCount();
        nodeStatus = 'connected';
    }
    catch {
        nodeStatus = 'disconnected';
    }
    res.json({ status: 'ok', service: 'tarcoin-explorer', node: nodeStatus, timestamp: Date.now() });
});
// Genesis block info (always available even without RPC)
app.get('/api/genesis', (_req, res) => {
    res.json({
        hash: '0000e37ee7aa8a88d1254ee3fe7c497c8fdaff36b29747eb64d8da68fbd9939e',
        merkleRoot: 'eaf980618b3cde94360d83c4937c3bcebcba7cc1db9f3276eb8b180da3a2e921',
        timestamp: 1782181262,
        nBits: '1f00ffff',
        nonce: 65067,
        height: 0,
        reward: 50000,
        version: 1,
        size: 233,
        weight: 932,
    });
});
// Initialize services
async function initialize() {
    try {
        // Redis cache — disable auto-reconnect so it never spams errors
        const redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: false, // do NOT retry — log once and move on
                connectTimeout: 3000,
            },
        });
        let redisOk = false;
        let redisErrLogged = false;
        redisClient.on('error', () => {
            if (!redisErrLogged) {
                logger_1.logger.warn('Redis unavailable — running without cache (no further warnings)');
                redisErrLogged = true;
            }
        });
        try {
            await redisClient.connect();
            redisOk = true;
            logger_1.logger.info('Redis connected');
        }
        catch {
            // already logged via the error event; quit immediately to stop retries
            try {
                await redisClient.quit();
            }
            catch { /* ignore */ }
        }
        const cacheManager = new CacheManager_1.CacheManager(redisOk ? redisClient : null);
        // RPC client
        const rpcClient = new RpcClient_1.RpcClient({
            host: process.env.RPC_HOST || '127.0.0.1',
            port: parseInt(process.env.RPC_PORT || '19332'),
            username: process.env.RPC_USER || 'tarcoin',
            password: process.env.RPC_PASS || 'tarcoin',
        });
        // WebSocket manager (uses server created above)
        const wsManager = new WebSocketManager_1.WebSocketManager(server);
        // Controllers
        const blockController = new BlockController_1.BlockController(rpcClient, cacheManager);
        const transactionController = new TransactionController_1.TransactionController(rpcClient, cacheManager);
        const addressController = new AddressController_1.AddressController(rpcClient, cacheManager);
        const mempoolController = new MempoolController_1.MempoolController(rpcClient, cacheManager);
        const supplyController = new SupplyController_1.SupplyController(rpcClient, cacheManager);
        const searchController = new SearchController_1.SearchController(rpcClient, cacheManager);
        // Block routes
        app.get('/api/blocks', blockController.getRecent.bind(blockController));
        app.get('/api/block/height/:height', blockController.getByHeight.bind(blockController));
        app.get('/api/block/:hash', blockController.getByHash.bind(blockController));
        // Transaction routes
        app.get('/api/tx/:txid', transactionController.getByTxid.bind(transactionController));
        app.post('/api/tx/broadcast', transactionController.broadcast.bind(transactionController));
        // Address routes
        app.get('/api/address/:address', addressController.getByAddress.bind(addressController));
        app.get('/api/address/:address/txs', addressController.getTransactions.bind(addressController));
        app.get('/api/address/:address/utxo', addressController.getUtxo.bind(addressController));
        // Mempool routes
        app.get('/api/mempool', mempoolController.getAll.bind(mempoolController));
        app.get('/api/mempool/stats', mempoolController.getStats.bind(mempoolController));
        // Supply / network routes
        app.get('/api/supply', supplyController.getSupply.bind(supplyController));
        app.get('/api/supply/circulating', supplyController.getCirculating.bind(supplyController));
        app.get('/api/network/stats', supplyController.getNetworkStats.bind(supplyController));
        app.get('/api/richlist', supplyController.getRichList.bind(supplyController));
        // Search
        app.get('/api/search', searchController.search.bind(searchController));
        // 404 handler
        app.use((_req, res) => {
            res.status(404).json({ error: 'Not found' });
        });
        // Start block polling for WebSocket broadcasts
        startBlockPolling(rpcClient, wsManager, cacheManager);
        logger_1.logger.info('TARCOIN Explorer API initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize:', error);
        process.exit(1);
    }
}
// Poll for new blocks every 15 seconds and broadcast via WebSocket
let lastKnownHeight = -1;
function startBlockPolling(rpc, ws, cache) {
    setInterval(async () => {
        try {
            const height = await rpc.getBlockCount();
            if (height > lastKnownHeight) {
                lastKnownHeight = height;
                const hash = await rpc.getBlockHash(height);
                const block = await rpc.getBlock(hash, 1);
                await cache.del(cache.recentBlocksKey());
                ws.broadcastBlock(block);
                // Also broadcast mempool update
                const mempool = await rpc.getMempoolInfo();
                ws.broadcastNetworkStats({ blockHeight: height, mempoolSize: mempool.size });
            }
        }
        catch {
            // Silently continue if node is temporarily unreachable
        }
    }, 15000);
}
// Start the server
server.listen(PORT, () => {
    logger_1.logger.info(`TARCOIN Explorer API running on port ${PORT}`);
    initialize();
});
exports.default = app;
//# sourceMappingURL=server.js.map