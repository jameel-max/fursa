import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { errorHandler } from '../../lib/errors';
import { catalogLimiter } from '../../lib/rateLimit';
import { listCategories, listUnits, listSpecialties, listGovernorates } from './catalog.service';

export const catalogRouter = Router();

catalogRouter.get('/categories', catalogLimiter, asyncHandler(async (_req, res) => {
  const data = await listCategories();
  return res.json({ success: true, data: { items: data } });
}));
catalogRouter.get('/units', catalogLimiter, asyncHandler(async (_req, res) => {
  const data = await listUnits();
  return res.json({ success: true, data: { items: data } });
}));
catalogRouter.get('/specialties', catalogLimiter, asyncHandler(async (_req, res) => {
  const data = await listSpecialties();
  return res.json({ success: true, data: { items: data } });
}));
catalogRouter.get('/governorates', catalogLimiter, asyncHandler(async (_req, res) => {
  const data = await listGovernorates();
  return res.json({ success: true, data: { items: data } });
}));

export { errorHandler };
