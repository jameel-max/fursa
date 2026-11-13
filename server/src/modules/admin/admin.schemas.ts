import { z } from 'zod';

export const userStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']),
});

export const listingStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'closed', 'expired']),
});

export const settingsSchema = z.record(z.string().min(1).max(80), z.string().max(500));
