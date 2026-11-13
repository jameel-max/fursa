import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later' } },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});

export const catalogLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});

export const listingsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});

export const offersLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});

export const messagesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});

export const notificationsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});

export const favoritesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});

export const usersLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});

export const subscriptionsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  skip: () => process.env.NODE_ENV === 'test',
  legacyHeaders: false,
});
