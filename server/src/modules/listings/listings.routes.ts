import { Router } from 'express';
import { errorHandler } from '../../lib/errors';
import { listingsLimiter } from '../../lib/rateLimit';
import { authenticate } from '../../lib/auth';
import { uploadImages } from '../../lib/multer';
import { listListingsHandler, getListingHandler, createListingHandler, updateListingHandler, setListingStatusHandler, deleteListingHandler, deleteListingImageHandler, listMyListingsHandler } from './listings.controller';
import { createOfferHandler } from '../offers/offers.controller';
import { offersLimiter } from '../../lib/rateLimit';

export const listingsRouter = Router();

listingsRouter.get('/', listListingsHandler);
listingsRouter.get('/me', authenticate, listMyListingsHandler);
listingsRouter.get('/:id', getListingHandler);
listingsRouter.post('/', authenticate, listingsLimiter, uploadImages('images'), createListingHandler);
listingsRouter.post('/:id/offers', authenticate, offersLimiter, createOfferHandler);
listingsRouter.patch('/:id', authenticate, uploadImages('images'), updateListingHandler);
listingsRouter.post('/:id/status', authenticate, setListingStatusHandler);
listingsRouter.delete('/:id/images/:imageId', authenticate, deleteListingImageHandler);
listingsRouter.delete('/:id', authenticate, deleteListingHandler);

export { errorHandler };
