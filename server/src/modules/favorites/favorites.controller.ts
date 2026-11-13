import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import * as favoritesService from './favorites.service';

export const listFavoritesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await favoritesService.listFavorites(req.user!.id);
  return sendSuccess(res, { items: data });
});

export const toggleFavoriteHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await favoritesService.toggleFavorite(Number(req.params.listingId), req.user!.id);
  return sendSuccess(res, data);
});
