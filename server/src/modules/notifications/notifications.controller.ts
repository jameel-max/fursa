import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import * as notificationsService from './notifications.service';

export const listNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await notificationsService.listNotifications(req.user!.id);
  const unreadCount = data.filter((item) => !item.isRead).length;
  return sendSuccess(res, { items: data, unreadCount });
});

export const markReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await notificationsService.markRead(req.user!.id, Number(req.params.id));
  return sendSuccess(res, data);
});

export const markAllReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await notificationsService.markAllRead(req.user!.id);
  return sendSuccess(res, data);
});
