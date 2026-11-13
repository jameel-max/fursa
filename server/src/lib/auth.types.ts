import type { Request } from 'express';

export interface AuthUser {
  id: number;
  fullName: string;
  phone: string;
  accountStatus: string;
  role: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
