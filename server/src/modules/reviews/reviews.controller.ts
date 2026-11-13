import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import * as reviewsService from './reviews.service';

export const createReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await reviewsService.createReview(req.user!.id, req.body);
  return sendSuccess(res, data, 201);
});

export const listUserReviewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await reviewsService.listUserReviews(Number(req.params.userId), req.query.limit ? Number(req.query.limit) : 20);
  return sendSuccess(res, data);
});
