import { Router } from 'express';
import { errorHandler } from '../../lib/errors';
import { authenticate } from '../../lib/auth';
import { createReviewHandler, listUserReviewsHandler } from './reviews.controller';

export const reviewsRouter = Router();

reviewsRouter.post('/', authenticate, createReviewHandler);
reviewsRouter.get('/user/:userId', listUserReviewsHandler);

export { errorHandler };
