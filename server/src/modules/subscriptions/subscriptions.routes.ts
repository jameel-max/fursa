import { Router } from 'express';
import { errorHandler } from '../../lib/errors';
import { subscriptionsLimiter } from '../../lib/rateLimit';
import { authenticate } from '../../lib/auth';
import { listPlansHandler, getMySubscriptionHandler, checkoutHandler, cancelSubscriptionHandler } from './subscriptions.controller';

export const subscriptionsRouter = Router();

subscriptionsRouter.get('/plans', listPlansHandler);
subscriptionsRouter.get('/me', authenticate, getMySubscriptionHandler);
subscriptionsRouter.post('/checkout', authenticate, subscriptionsLimiter, checkoutHandler);
subscriptionsRouter.post('/cancel', authenticate, cancelSubscriptionHandler);

export { errorHandler };
