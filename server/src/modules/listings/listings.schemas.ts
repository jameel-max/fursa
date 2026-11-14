import { z } from 'zod';

export const listingTypeSchema = z.enum(['offer', 'request', 'service']);

export const priceTypeSchema = z.enum(['fixed', 'negotiable', 'at_contact']);

/**
 * Multipart requests deliver every field as a string, while JSON requests
 * deliver real numbers. These helpers normalise both shapes before validation.
 */
function numeric(schema: z.ZodNumber) {
  return z.preprocess((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      return Number(trimmed);
    }
    return value;
  }, schema);
}

function optionalNumeric(schema: z.ZodNumber) {
  return z.preprocess((value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      return Number(trimmed);
    }
    return value;
  }, schema.optional());
}

function nullableNumeric(schema: z.ZodNumber) {
  return z.preprocess((value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return null;
      return Number(trimmed);
    }
    return value;
  }, schema.nullable());
}

const quantityField = numeric(z.number().int().min(1).max(1000000));
const unitIdField = numeric(z.number().int().positive());
const categoryIdField = numeric(z.number().int().positive());
const governorateIdField = numeric(z.number().int().positive());
const priceField = nullableNumeric(z.number().min(0).max(100000000));
const expiresAtField = nullableNumeric(z.number().int().positive());

export const createListingSchema = z
  .object({
    listingType: listingTypeSchema,
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
    categoryId: categoryIdField,
    description: z.string().max(3000).optional(),
    quantity: quantityField,
    unitId: unitIdField,
    price: priceField.optional(),
    priceType: priceTypeSchema.default('fixed'),
    governorateId: governorateIdField,
    area: z.string().max(120).optional(),
    expiresAt: expiresAtField.optional(),
  })
  .refine(
    (value) => {
      if (value.priceType === 'at_contact') return true;
      if (value.listingType !== 'request') return value.price !== undefined && value.price !== null;
      return true;
    },
    { message: 'Price is required unless the price type is "at contact"', path: ['price'] },
  );

export const updateListingSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    categoryId: categoryIdField.optional(),
    description: z.string().max(3000).optional(),
    quantity: quantityField.optional(),
    unitId: unitIdField.optional(),
    price: priceField.optional(),
    priceType: priceTypeSchema.optional(),
    governorateId: governorateIdField.optional(),
    area: z.string().max(120).optional(),
    status: z.enum(['active', 'paused', 'closed', 'expired']).optional(),
    expiresAt: expiresAtField.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: 'No fields provided to update' });

export const listingStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'closed', 'expired']),
});

export const offerSchema = z.object({
  proposedPrice: numeric(z.number().min(0).max(100000000)),
  proposedQuantity: numeric(z.number().int().min(1).max(1000000)),
  notes: z.string().max(1000).optional(),
  availableDate: optionalNumeric(z.number().int().positive()),
});

export const offerStatusSchema = z.object({
  status: z.enum(['new', 'negotiation', 'accepted', 'rejected', 'cancelled']),
});
