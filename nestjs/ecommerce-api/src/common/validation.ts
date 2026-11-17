import { z } from 'zod';

/** `:id`-style route params arrive as strings; coerce to a positive integer or fail with 400. */
export const idParam = z.coerce.number().int().positive();

/** Thrown by the global validation pipe; the exception filter turns it into a 400. */
export class ValidationException extends Error {
  constructor(readonly issues: readonly unknown[]) {
    super('Validation failed');
  }
}
