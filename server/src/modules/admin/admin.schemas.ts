import { z } from 'zod';

export const userStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']),
});

export const listingStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'closed', 'expired']),
});

export const settingsSchema = z.record(z.string().min(1).max(80), z.string().max(500));

export const createSpecialtySchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().regex(/^[a-z0-9_]+$/).max(40).optional(),
  nameEn: z.string().trim().max(80).optional(),
  description: z.string().trim().max(300).optional(),
  icon: z.string().trim().max(40).optional(),
});

export const updateSpecialtySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  nameEn: z.string().trim().max(80).optional(),
  description: z.string().trim().max(300).optional(),
  icon: z.string().trim().max(40).optional(),
  isActive: z.boolean().optional(),
});

export const setSpecialtyPermissionSchema = z.object({
  permissionCode: z.string().min(1).max(80),
  enabled: z.boolean(),
});
