import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import { validate } from '../../lib/validate';
import { userStatusSchema, listingStatusSchema, settingsSchema } from './admin.schemas';
import * as adminService from './admin.service';

export const getAdminStatsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getAdminStats();
  return sendSuccess(res, data);
});

export const listAdminUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.listAdminUsers({
    status: req.query.status ? String(req.query.status) : undefined,
    specialty: req.query.specialty ? String(req.query.specialty) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  return sendSuccess(res, data);
});

export const setUserStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { status } = validate(userStatusSchema, req.body);
  const data = await adminService.setUserStatus(req.user!.id, Number(req.params.id), status);
  return sendSuccess(res, data);
});

export const setListingStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { status } = validate(listingStatusSchema, req.body);
  const data = await adminService.setListingStatus(req.user!.id, Number(req.params.id), status);
  return sendSuccess(res, data);
});

export const setListingFeaturedHandler = asyncHandler(async (req: Request, res: Response) => {
  const featured = req.body?.featured === true || req.body?.featured === 1 || req.body?.featured === '1';
  const data = await adminService.setListingFeatured(req.user!.id, Number(req.params.id), featured);
  return sendSuccess(res, data);
});

export const getAdminUserDetailHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.getAdminUserDetail(Number(req.params.id));
  return sendSuccess(res, data);
});

export const deleteAdminUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.deleteAdminUser(req.user!.id, Number(req.params.id));
  return sendSuccess(res, data);
});

export const deleteAdminListingHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.deleteAdminListing(req.user!.id, Number(req.params.id));
  return sendSuccess(res, data);
});

export const cancelAdminSubscriptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.cancelAdminSubscription(req.user!.id, Number(req.params.id));
  return sendSuccess(res, data);
});

export const listAdminSubscriptionsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listAdminSubscriptions();
  return sendSuccess(res, { items: data });
});

export const listAdminListingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.listAdminListings({
    status: req.query.status ? String(req.query.status) : undefined,
    type: req.query.type ? String(req.query.type) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  return sendSuccess(res, data);
});

export const getAdminSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getAdminSettings();
  return sendSuccess(res, { items: data });
});

export const updateAdminSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const values = validate(settingsSchema, req.body);
  const data = await adminService.updateAdminSettings(req.user!.id, values);
  return sendSuccess(res, data);
});

export const listAdminSpecialtiesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listAdminSpecialties();
  return sendSuccess(res, data);
});

export const createAdminSpecialtyHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.createAdminSpecialty(req.user!.id, req.body);
  return sendSuccess(res, result);
});

export const updateAdminSpecialtyHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.updateAdminSpecialty(req.user!.id, Number(req.params.id), req.body);
  return sendSuccess(res, result);
});

export const setSpecialtyPermissionHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.setSpecialtyPermission(req.user!.id, String(req.params.code), req.body);
  return sendSuccess(res, result);
});
