import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import { uploadImages } from '../../lib/multer';
import * as adsService from './ads.service';

function fileToDataUrl(req: Request): string | undefined {
  const files = req.files as Array<{ buffer?: Buffer; mimetype?: string }> | undefined;
  const file = Array.isArray(files) ? files[0] : undefined;
  if (file?.buffer && file.mimetype) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }
  return undefined;
}

export const adImageUpload = uploadImages('image');

export const listAdsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adsService.listActiveAds();
  return sendSuccess(res, { items: data });
});

export const listAdminAdsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adsService.listAllAds();
  return sendSuccess(res, { items: data });
});

export const createAdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adsService.createAd(req.user!.id, req.body, fileToDataUrl(req));
  return sendSuccess(res, data, 201);
});

export const updateAdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adsService.updateAd(req.user!.id, Number(req.params.id), req.body, fileToDataUrl(req));
  return sendSuccess(res, data);
});

export const deleteAdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adsService.deleteAd(req.user!.id, Number(req.params.id));
  return sendSuccess(res, data);
});
