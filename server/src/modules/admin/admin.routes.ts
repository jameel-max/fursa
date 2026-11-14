import { Router } from 'express';
import { errorHandler } from '../../lib/errors';
import { adImageUpload, listAdminAdsHandler, createAdHandler, updateAdHandler, deleteAdHandler } from '../ads/ads.controller';
import { adminLimiter } from '../../lib/rateLimit';
import { authenticate, requireAdmin } from '../../lib/auth';
import {
  getAdminStatsHandler,
  listAdminUsersHandler,
  getAdminUserDetailHandler,
  deleteAdminUserHandler,
  deleteAdminListingHandler,
  cancelAdminSubscriptionHandler,
  setUserStatusHandler,
  setListingStatusHandler,
  setListingFeaturedHandler,
  listAdminListingsHandler,
  listAdminSubscriptionsHandler,
  getAdminSettingsHandler,
  updateAdminSettingsHandler,
} from './admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/stats', getAdminStatsHandler);
adminRouter.get('/users', adminLimiter, listAdminUsersHandler);
adminRouter.get('/users/:id', adminLimiter, getAdminUserDetailHandler);
adminRouter.delete('/users/:id', adminLimiter, deleteAdminUserHandler);
adminRouter.patch('/users/:id/status', adminLimiter, setUserStatusHandler);
adminRouter.get('/listings', adminLimiter, listAdminListingsHandler);
adminRouter.delete('/listings/:id', adminLimiter, deleteAdminListingHandler);
adminRouter.patch('/listings/:id/status', adminLimiter, setListingStatusHandler);
adminRouter.patch('/listings/:id/feature', adminLimiter, setListingFeaturedHandler);
adminRouter.get('/subscriptions', adminLimiter, listAdminSubscriptionsHandler);
adminRouter.post('/subscriptions/:id/cancel', adminLimiter, cancelAdminSubscriptionHandler);
adminRouter.get('/ads', listAdminAdsHandler);
adminRouter.post('/ads', adImageUpload, createAdHandler);
adminRouter.patch('/ads/:id', adImageUpload, updateAdHandler);
adminRouter.delete('/ads/:id', deleteAdHandler);
adminRouter.get('/settings', getAdminSettingsHandler);
adminRouter.patch('/settings', adminLimiter, updateAdminSettingsHandler);

export { errorHandler };
