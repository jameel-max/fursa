import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { errorHandler } from '../../lib/errors';
import { messagesLimiter } from '../../lib/rateLimit';
import { authenticate } from '../../lib/auth';
import { listConversations, startConversation, listMessages, sendMessage } from './messages.service';

export const messagesRouter = Router();

messagesRouter.use(authenticate);

messagesRouter.get('/', messagesLimiter, asyncHandler(async (req, res) => {
  const items = await listConversations(req.user!.id);
  return res.json({ success: true, data: { items } });
}));

messagesRouter.post('/', messagesLimiter, asyncHandler(async (req, res) => {
  const data = await startConversation(req.user!.id, req.body);
  return res.status(201).json({ success: true, data });
}));

messagesRouter.get('/:id', asyncHandler(async (req, res) => {
  const items = await listMessages(Number(req.params.id), req.user!.id);
  return res.json({ success: true, data: { items } });
}));

messagesRouter.post('/:id/messages', messagesLimiter, asyncHandler(async (req, res) => {
  const data = await sendMessage(Number(req.params.id), req.user!.id, String(req.body.content ?? ''));
  return res.status(201).json({ success: true, data });
}));

export { errorHandler };
