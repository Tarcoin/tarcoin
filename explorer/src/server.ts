import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { logger } from './utils/logger';
import { RpcClient } from './services/RpcClient';
import { BlockController } from './controllers/BlockController';
import { TransactionController } from './controllers/TransactionController';
import { AddressController } from './controllers/AddressController';
import { MempoolController } from './controllers/MempoolController';
import { SupplyController } from './controllers/SupplyController';
import { SearchController } from './controllers/SearchController';
import { WebSocketManager } from './services/WebSocketManager';
import { CacheManager } from './services/CacheManager';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server first (needed for WebSocket)
const server = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tarcoin-explorer', timestamp: Date.now() });
});

// Genesis block info (always available even without RPC)
app.get('/api/genesis', (_req, res) => {
  res.json({
    hash: '000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0',
    merkleRoot: '1fa777a38f96e44bb26591573ed2b22d5b40d7a63067201a40ad3b214152b749',
    timestamp: 1748304000,
    nBits: '1f00ffff',
    nonce: 15878,
    height: 0,
    reward: 50000,
  });
});

// Initialize services
async function initialize() {
  try {
    // Redis cache — disable auto-reconnect so it never spams errors
    const redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: false,   // do NOT retry — log once and move on
        connectTimeout: 3000,
      },
    });

    let redisOk = false;
    let redisErrLogged = false;
    redisClient.on('error', () => {
      if (!redisErrLogged) {
        logger.warn('Redis unavailable — running without cache (no further warnings)');
        redisErrLogged = true;
      }
    });

    try {
      await redisClient.connect();
      redisOk = true;
      logger.info('Redis connected');
    } catch {
      // already logged via the error event; quit immediately to stop retries
      try { await redisClient.quit(); } catch { /* ignore */ }
    }

    const cacheManager = new CacheManager(redisOk ? redisClient : null as any);


    // RPC client
    const rpcClient = new RpcClient({
      host: process.env.RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.RPC_PORT || '19332'),
      username: process.env.RPC_USER || 'tarcoin',
      password: process.env.RPC_PASSWORD || 'tarcoin',
    });

    // WebSocket manager (uses server created above)
    const wsManager = new WebSocketManager(server);

    // Controllers
    const blockController = new BlockController(rpcClient, cacheManager);
    const transactionController = new TransactionController(rpcClient, cacheManager);
    const addressController = new AddressController(rpcClient, cacheManager);
    const mempoolController = new MempoolController(rpcClient, cacheManager);
    const supplyController = new SupplyController(rpcClient, cacheManager);
    const searchController = new SearchController(rpcClient, cacheManager);

    // Block routes
    app.get('/api/blocks', blockController.getRecent.bind(blockController));
    app.get('/api/block/height/:height', blockController.getByHeight.bind(blockController));
    app.get('/api/block/:hash', blockController.getByHash.bind(blockController));

    // Transaction routes
    app.get('/api/tx/:txid', transactionController.getByTxid.bind(transactionController));

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

    logger.info('TARCOIN Explorer API initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize:', error);
    process.exit(1);
  }
}

// Poll for new blocks every 15 seconds and broadcast via WebSocket
let lastKnownHeight = -1;
function startBlockPolling(rpc: RpcClient, ws: WebSocketManager, cache: CacheManager) {
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
    } catch {
      // Silently continue if node is temporarily unreachable
    }
  }, 15000);
}

// Start the server
server.listen(PORT, () => {
  logger.info(`TARCOIN Explorer API running on port ${PORT}`);
  initialize();
});

export default app;