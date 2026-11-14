import express, { type Express } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { errorHandler, notFoundHandler } from './lib/errors';
import { asyncHandler } from './lib/asyncHandler';
import { sendSuccess } from './lib/response';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { listingsRouter } from './modules/listings/listings.routes';
import { offersRouter } from './modules/offers/offers.routes';
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes';
import { messagesRouter } from './modules/messages/messages.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { favoritesRouter } from './modules/favorites/favorites.routes';
import { catalogRouter } from './modules/catalog/catalog.routes';
import { adsRouter } from './modules/ads/ads.routes';
import { reviewsRouter } from './modules/reviews/reviews.routes';
import { adminRouter } from './modules/admin/admin.routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          imgSrc: ["'self'", 'data:', 'blob:'],
        },
      },
    }),
  );
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.get('/api/health', asyncHandler(async (_req, res) => {
    return sendSuccess(res, { status: 'ok' });
  }));

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/listings', listingsRouter);
  app.use('/api/offers', offersRouter);
  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/ads', adsRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/admin', adminRouter);

  app.use('/api/uploads', (req, res) => {
    const file = path.resolve(config.uploadDir, req.path.replace(/^\/+/, ''));
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return res.sendFile(file);
    }
    return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'File not found' } });
  });

  const clientDist = path.resolve(process.cwd(), 'client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
