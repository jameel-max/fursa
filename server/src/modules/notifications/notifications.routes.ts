import { Router } from 'express';
import { errorHandler } from '../../lib/errors';
import { notificationsLimiter } from '../../lib/rateLimit';
import { authenticate } from '../../lib/auth';
import {
  listNotificationsHandler,
  notificationsSummaryHandler,
  pushKeyHandler,
  pushSubscribeHandler,
  pushUnsubscribeHandler,
  markReadHandler,
  markAllReadHandler,
} from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticate, notificationsLimiter, listNotificationsHandler);
notificationsRouter.get('/summary', authenticate, notificationsSummaryHandler);
notificationsRouter.get('/push-key', notificationsLimiter, pushKeyHandler);
notificationsRouter.post('/push-subscribe', authenticate, notificationsLimiter, pushSubscribeHandler);
notificationsRouter.delete('/push-subscribe', authenticate, notificationsLimiter, pushUnsubscribeHandler);
notificationsRouter.post('/:id/read', authenticate, markReadHandler);
notificationsRouter.post('/read-all', authenticate, markAllReadHandler);

export { errorHandler };
