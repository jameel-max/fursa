import { Router } from 'express';
import { errorHandler } from '../../lib/errors';
import { authenticate } from '../../lib/auth';
import { getUserByIdHandler, getProfileWithUserHandler, updateMeHandler, updateContactPreferencesHandler } from './users.controller';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, getProfileWithUserHandler);
usersRouter.patch('/me', authenticate, updateMeHandler);
usersRouter.patch('/me/contact', authenticate, updateContactPreferencesHandler);
usersRouter.get('/:userId', getUserByIdHandler);

export { errorHandler };
