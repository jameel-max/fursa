import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import * as offersService from './offers.service';

export const createOfferHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await offersService.createOffer(Number(req.params.id), req.user!.id, req.body);
  return sendSuccess(res, data, 201);
});

export const listOffersReceivedHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await offersService.listOffersReceived(req.user!.id);
  return sendSuccess(res, { items: data });
});

export const listOffersMadeHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await offersService.listOffersMade(req.user!.id);
  return sendSuccess(res, { items: data });
});

export const updateOfferStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await offersService.updateOfferStatus(req.user!.id, Number(req.params.id), req.body.status);
  return sendSuccess(res, data);
});

export const closeRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await offersService.closeRequest(req.user!.id, Number(req.params.id));
  return sendSuccess(res, data);
});
