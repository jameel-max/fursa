import { Router } from 'express';
import { errorHandler } from '../../lib/errors';
import { authenticate } from '../../lib/auth';
import { listFavoritesHandler, toggleFavoriteHandler } from './favorites.controller';

export const favoritesRouter = Router();

favoritesRouter.get('/', authenticate, listFavoritesHandler);
favoritesRouter.post('/:listingId', authenticate, toggleFavoriteHandler);

export { errorHandler };
