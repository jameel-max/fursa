import { Router } from 'express';
import { errorHandler } from '../../lib/errors';
import { offersLimiter } from '../../lib/rateLimit';
import { authenticate } from '../../lib/auth';
import { createOfferHandler, listOffersReceivedHandler, listOffersMadeHandler, updateOfferStatusHandler, closeRequestHandler } from './offers.controller';

export const offersRouter = Router();

offersRouter.post('/:id/offers', authenticate, offersLimiter, createOfferHandler);
offersRouter.get('/mine/received', authenticate, listOffersReceivedHandler);
offersRouter.get('/mine/made', authenticate, listOffersMadeHandler);
offersRouter.post('/:id/status', authenticate, updateOfferStatusHandler);
offersRouter.post('/:id/close', authenticate, closeRequestHandler);

export { errorHandler };
