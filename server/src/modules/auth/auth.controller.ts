import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import * as authService from './auth.service';
import * as usersService from '../users/users.service';
import { signToken, logAudit, verifyToken } from '../../lib/auth';

async function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function clearAuthCookie(res: Response) {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
}

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  const user = result.user;
  setAuthCookie(res, signToken({ id: user.id, phone: user.phone, role: user.role }));
  return sendSuccess(
    res,
    {
      user: { id: user.id, fullName: user.fullName, phone: user.phone, accountStatus: user.accountStatus, role: user.role },
      devCode: result.devCode,
    },
    201,
  );
});

export const resendOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resendOtp(req.body);
  return sendSuccess(res, result);
});

export const verifyPhoneHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyPhone(req.body.phone, req.body.code);
  return sendSuccess(res, { user: result.user });
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  setAuthCookie(res, result.token);
  return sendSuccess(res, { user: result.user, token: result.token });
});

export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return sendSuccess(res, { success: true });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : undefined;
  const cookieHeader = req.headers.cookie;
  let current: string | undefined;
  if (cookieHeader) {
    const match = /(?:^|;\s*)token=([^;]+)/.exec(cookieHeader);
    if (match) current = decodeURIComponent(match[1]);
  }
  const tokenValue = token || current;
  if (!tokenValue) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
  const payload = verifyToken(tokenValue);
  const user = await authService.findAuthUserById(payload.sub);
  const newToken = signToken({ id: user.id, phone: user.phone, role: user.role });
  setAuthCookie(res, newToken);
  return sendSuccess(res, { user });
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = await usersService.getProfileWithUser(userId);
  return sendSuccess(res, { user: data });
});

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body);
  return sendSuccess(res, { phone: result.phone, devCode: result.devCode });
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body);
  return sendSuccess(res, result);
});

export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.changePassword(req.user!.id, req.body);
  logAudit(req.user!.id, 'PASSWORD_CHANGE', 'user', req.user!.id);
  return sendSuccess(res, result);
});
