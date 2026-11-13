import { Router } from 'express';
import { sendError } from '../../lib/response';
import { errorHandler } from '../../lib/errors';
import { authLimiter } from '../../lib/rateLimit';
import { authenticate } from '../../lib/auth';
import {
  registerHandler,
  verifyPhoneHandler,
  resendOtpHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  meHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  changePasswordHandler,
} from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authLimiter, registerHandler);
authRouter.post('/verify-phone', verifyPhoneHandler);
authRouter.post('/resend-otp', authLimiter, resendOtpHandler);
authRouter.post('/login', authLimiter, loginHandler);
authRouter.post('/logout', logoutHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.get('/me', authenticate, meHandler);
authRouter.post('/forgot-password', authLimiter, forgotPasswordHandler);
authRouter.post('/reset-password', resetPasswordHandler);
authRouter.post('/change-password', authenticate, changePasswordHandler);

export { errorHandler, sendError };
