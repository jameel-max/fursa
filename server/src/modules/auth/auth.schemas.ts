import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(8, 'Phone number must be at least 8 digits')
  .max(14, 'Phone number is too long')
  .regex(/^(?:\+962|0)?7\d{7,8}$/, 'Phone number must be a valid Jordanian mobile number');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password must be at most 64 characters')
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must contain both letters and numbers');

export const registerSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters').max(80, 'Full name is too long'),
  phone: phoneSchema,
  password: passwordSchema,
  passwordConfirm: z.string(),
  termsAccepted: z.boolean().refine((value) => value === true, 'You must accept the terms and conditions'),
  specialties: z.array(z.union([z.string(), z.number()])).min(1, 'Select at least one specialty').max(3, 'You can select up to 3 specialties'),
  customSpecialty: z.string().trim().min(2, 'Describe your field').max(60).optional(),
  // Optional profile fields (validated conditionally in the service)
  businessName: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  governorateId: z.number().int().positive().optional(),
  area: z.string().max(120).optional(),
});

export const verifyPhoneSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

export const resendOtpSchema = z.object({
  phone: phoneSchema,
});

export const resetPasswordSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword'],
});
