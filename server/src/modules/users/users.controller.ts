import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import * as usersService from './users.service';

export const getUserByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await usersService.getUserById(Number(req.params.userId));
  return sendSuccess(res, data);
});

export const getProfileWithUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await usersService.getProfileWithUser(req.user!.id);
  return sendSuccess(res, data);
});

export const updateMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await usersService.updateMe(req.user!.id, req.body);
  return sendSuccess(res, data);
});

export const updateContactPreferencesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await usersService.updateContactPreferences(req.user!.id, req.body);
  return sendSuccess(res, data);
});
