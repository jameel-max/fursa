import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendError } from '../../lib/response';
import { errorHandler } from '../../lib/errors';

export const healthRouter = Router();

healthRouter.get('/', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok' } });
}));

export { errorHandler };
