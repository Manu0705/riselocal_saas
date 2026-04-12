import dotenv from "dotenv";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import type {} from './types/express';
import { prisma } from '@saas/database';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/error-handler.middleware';
import { env } from './config/env';
import { requestContextMiddleware } from './middleware/request-context.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { inputSanitizeMiddleware } from './middleware/input-sanitize.middleware';

const startupAdminPassword = process.env.ADMIN_PASSWORD?.trim();

if (!startupAdminPassword) {
  console.error('[startup] Missing ADMIN_PASSWORD. Refusing to start API server.');
  process.exit(1);
}

if (startupAdminPassword.length < 12) {
  console.error('[startup] ADMIN_PASSWORD must be at least 12 characters. Refusing to start API server.');
  process.exit(1);
}

const app = express();

const vercelPreviewPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const riseLocalSubdomainPattern = /^https:\/\/([a-z0-9-]+\.)*riselocal\.in$/i;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (env.FRONTEND_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      if (riseLocalSubdomainPattern.test(origin)) {
        return callback(null, true);
      }

      if (vercelPreviewPattern.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  }),
);

app.use(requestContextMiddleware);
app.use(rateLimitMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(inputSanitizeMiddleware);

if (env.APP_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', routes);
app.use(errorHandler);

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});

async function gracefulShutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
