import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getDb, queryOne } from '../db';
import { config } from '../config';
import { badRequest } from './ApiError';

export interface TokenPayload {
  sub: number;
  phone: string;
  role: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  phone: string;
  accountStatus: string;
  role: string;
}

export function signToken(user: { id: number; phone: string; role: string }): string {
  const payload: TokenPayload = { sub: user.id, phone: user.phone, role: user.role };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret) as unknown as TokenPayload;
  if (!decoded.sub) {
    throw badRequest('INVALID_TOKEN', 'Token is invalid');
  }
  return decoded;
}

export async function findUserById(id: number): Promise<AuthUser | undefined> {  const user = await queryOne<{
    id: number;
    full_name: string;
    phone: string;
    account_status: string;
    role: string;
  }>(
    'SELECT id, full_name, phone, account_status, role FROM users WHERE id = ?',
    [id],
  );
  if (!user) return undefined;
  return {
    id: user.id,
    fullName: user.full_name,
    phone: user.phone,
    accountStatus: user.account_status,
    role: user.role,
  };
}

export function extractTokenFromHeader(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = /(?:^|;\s*)token=([^;]+)/.exec(cookieHeader);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
  try {
    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_TOKEN_INVALID', message: 'Token is invalid' } });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: { code: 'AUTH_TOKEN_INVALID', message: 'Token is invalid' } });
  }
}

export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    const err = new Error('AUTH_REQUIRED') as Error & { statusCode?: number; code?: string };
    err.statusCode = 401;
    err.code = 'AUTH_REQUIRED';
    return next(err);
  }
  return next();
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    const err = new Error('AUTH_REQUIRED') as Error & { statusCode?: number; code?: string };
    err.statusCode = 401;
    err.code = 'AUTH_REQUIRED';
    return next(err);
  }
  if (req.user.role !== 'admin') {
    const err = new Error('FORBIDDEN_ADMIN') as Error & { statusCode?: number; code?: string };
    err.statusCode = 403;
    err.code = 'FORBIDDEN_ADMIN';
    return next(err);
  }
  return next();
}

export async function logAudit(
  actorId: number | undefined,
  action: string,
  entityType: string,
  entityId: number | undefined,
  metadata?: Record<string, unknown>,
) {
  const database = getDb();
  database.prepare(
    'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    actorId ?? null,
    action,
    entityType,
    entityId ?? null,
    metadata ? JSON.stringify(metadata) : null,
    Math.floor(Date.now() / 1000),
  );
}
