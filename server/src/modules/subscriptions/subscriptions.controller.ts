import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import * as subscriptionsService from './subscriptions.service';

export const listPlansHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await subscriptionsService.listPlans();
  return sendSuccess(res, { items: data });
});

export const getMySubscriptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await subscriptionsService.getMySubscription(req.user!.id);
  return sendSuccess(res, data);
});

export const checkoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const planId = Number(req.body.planId);
  const data = await subscriptionsService.createCheckout(req.user!.id, planId);
  return sendSuccess(res, data);
});

export const cancelSubscriptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await subscriptionsService.cancelSubscription(req.user!.id);
  return sendSuccess(res, data);
});
