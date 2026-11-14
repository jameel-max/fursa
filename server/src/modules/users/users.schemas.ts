import { z } from 'zod';

export const updateSchema = z.object({
  fullName: z.string().min(3).max(80),
  businessName: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  governorateId: z.number().int().positive().optional(),
  area: z.string().max(120).optional(),
  specialties: z.array(z.union([z.string(), z.number()])).min(1).max(3).optional(),
  customSpecialty: z.string().trim().min(2).max(60).optional(),
});

export const updateContactPreferencesSchema = z.object({
  showPhone: z.boolean(),
  whatsappEnabled: z.boolean(),
  internalMessagesEnabled: z.boolean(),
});
