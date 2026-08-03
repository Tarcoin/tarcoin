import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Logger
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'api-error.log', level: 'error' }),
    new transports.File({ filename: 'api-combined.log' }),
  ],
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS: support comma-separated origins via CORS_ORIGIN env var
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://tarcoin.org').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Swagger documentation
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TARCOIN API',
      version: '1.0.0',
      description: 'REST API for TARCOIN blockchain ecosystem',
      contact: { name: 'TARCOIN Developers' },
    },
    servers: [{ url: 'https://api.tarcoin.org', description: 'Mainnet' }],
  },
  apis: ['./src/**/*.ts', './dist/**/*.js', './src/routes/*.ts', './dist/routes/*.js'],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none !important; }',
  customSiteTitle: 'TARCOIN API'
}));

// Health check with node connectivity status
app.get('/health', async (req, res) => {
  let nodeStatus = 'unknown';
  try {
    const { rpcCall } = await import('./lib/rpc');
    await rpcCall('getblockchaininfo');
    nodeStatus = 'connected';
  } catch {
    nodeStatus = 'disconnected';
  }
  res.json({ status: 'ok', node: nodeStatus, timestamp: Date.now(), version: '1.0.0' });
});

// Root redirect to docs
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// API Routes
import blockchainRoutes from './routes/blockchain';
import walletRoutes from './routes/wallet';
import miningRoutes from './routes/mining';
import transactionRoutes from './routes/transactions';

app.use('/api/v1/blockchain', blockchainRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/mining', miningRoutes);
app.use('/api/v1/transactions', transactionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('API error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`TARCOIN API server running on port ${PORT}`);
});

export default app;