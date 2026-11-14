import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import * as listingsService from './listings.service';
import { validate } from '../../lib/validate';
import { createListingSchema, updateListingSchema, listingStatusSchema, offerSchema, offerStatusSchema } from './listings.schemas';

export const listListingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listingsService.listListings({
    listingType: req.query.listingType as 'offer' | 'request' | undefined,
    categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
    governorateId: req.query.governorateId ? Number(req.query.governorateId) : undefined,
    area: req.query.area ? String(req.query.area) : undefined,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined,
    status: req.query.status ? String(req.query.status) : 'active',
    sort: req.query.sort ? (String(req.query.sort) as 'newest' | 'price_low' | 'price_high' | 'quantity' | 'rating') : undefined,
    featured: req.query.featured === '1' ? true : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 12,
  });
  return sendSuccess(res, data);
});

export const getListingHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listingsService.getListingById(Number(req.params.id), req.user?.id);
  return sendSuccess(res, data);
});

function filesToDataUrls(files: unknown): string[] {
  const imageUrls: string[] = [];
  if (Array.isArray(files)) {
    for (const file of files as Array<{ buffer?: Buffer; mimetype?: string }>) {
      if (file?.buffer && file.mimetype) {
        imageUrls.push(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
      }
    }
  }
  return imageUrls;
}

export const createListingHandler = asyncHandler(async (req: Request, res: Response) => {
  const imageUrls = filesToDataUrls(req.files);
  const data = await listingsService.createListing(req.user!.id, req.body, imageUrls);
  return sendSuccess(res, data, 201);
});

export const updateListingHandler = asyncHandler(async (req: Request, res: Response) => {
  const imageUrls = filesToDataUrls(req.files);
  const data = await listingsService.updateListing(req.user!.id, Number(req.params.id), req.body, imageUrls);
  return sendSuccess(res, data);
});

export const deleteListingImageHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await listingsService.deleteListingImage(req.user!.id, Number(req.params.id), Number(req.params.imageId));
  return sendSuccess(res, result);
});

export const setListingStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = validate(listingStatusSchema, req.body);
  const result = await listingsService.setListingStatus(req.user!.id, Number(req.params.id), data.status);
  return sendSuccess(res, result);
});

export const deleteListingHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await listingsService.deleteListing(req.user!.id, Number(req.params.id));
  return sendSuccess(res, result);
});

export const listMyListingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const status = (req.query.status as string) || 'active';
  const items = await listingsService.listMyListings(req.user!.id, status);
  return sendSuccess(res, { items });
});
