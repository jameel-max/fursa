import type { ZodTypeAny, z } from 'zod';
import { badRequest } from './ApiError';

export function validate<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    throw badRequest('VALIDATION_ERROR', issues[0]?.message || 'Invalid input', issues);
  }
  return result.data;
}

export function validateOptional<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> | undefined {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest('VALIDATION_ERROR', result.error.issues[0]?.message || 'Invalid input');
  }
  const value = result.data;
  return value === undefined ? undefined : value;
}
