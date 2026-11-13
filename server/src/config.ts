import { config as loadEnv } from 'dotenv';

loadEnv();

const env = process.env;

export const config = {
  port: Number(env.PORT) || 4000,
  nodeEnv: env.NODE_ENV || 'development',
  isProduction: env.NODE_ENV === 'production',
  databasePath: env.DATABASE_PATH || 'data/app.db',
  databaseUrl: env.DATABASE_URL || '',
  jwtSecret: env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
  uploadDir: env.UPLOAD_DIR || 'server/uploads',
  clientUrl: env.CLIENT_URL || 'http://localhost:5173',
};

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
