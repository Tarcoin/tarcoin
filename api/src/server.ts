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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://tarcoin.org',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Rate limit exceeded' },
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
  apis: ['./src/routes/*.ts'],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TARCOIN API'
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), version: '1.0.0' });
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