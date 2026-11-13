import { Router } from 'express';
import { errorHandler } from '../../lib/errors';
import { notificationsLimiter } from '../../lib/rateLimit';
import { authenticate } from '../../lib/auth';
import { listNotificationsHandler, markReadHandler, markAllReadHandler } from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticate, notificationsLimiter, listNotificationsHandler);
notificationsRouter.post('/:id/read', authenticate, markReadHandler);
notificationsRouter.post('/read-all', authenticate, markAllReadHandler);

export { errorHandler };
