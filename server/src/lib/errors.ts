import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { ApiError, badRequest } from './ApiError';
import { sendError } from './response';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.code, err.message);
  }
  if (err instanceof multer.MulterError) {
    const status = (err as multer.MulterError & { statusCode?: number }).statusCode || 400;
    return sendError(res, status, 'UPLOAD_FAILED', err.message);
  }
  const statusCode = (err as Error & { statusCode?: number })?.statusCode || 500;
  const code = (err as Error & { code?: string })?.code;
  const message = (err as Error & { message?: string })?.message;
  if (statusCode === 500) {
    console.error('[error]', err);
  }
  if (statusCode >= 500) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  }
  const status = statusCode;
  const errCode = code && !['ERR_BAD_REQUEST', 'ERR_INVALID_ARG_TYPE'].includes(code) ? code : 'BAD_REQUEST';
  const errMessage = message && !message.startsWith('JWT') ? message : 'Request failed';
  return sendError(res, status, errCode, errMessage);
};

export const notFoundHandler: RequestHandler = (req, res) => {
  return res.status(404).json({ success: false, error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } });
};
