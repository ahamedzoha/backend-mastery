import { z } from 'zod';

// description and stock are optional, not .default(): the database fills them on create,
// and a .default() would also kick in on PATCH and silently reset them.
export const productBody = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priceCents: z.number().int().positive(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.number().int().positive(),
});
export type ProductBody = z.infer<typeof productBody>;

// PATCH: every field optional. Keys left out stay out, so they are not touched.
export const productPatch = productBody.partial();
export type ProductPatch = z.infer<typeof productPatch>;

// Query strings are always strings, so numbers need z.coerce and booleans need z.stringbool()
// (z.coerce.boolean() turns "false" into true).
export const listQuery = z
  .object({
    q: z.string().trim().min(1).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    inStock: z.stringbool().optional(),
    sort: z
      .enum(['newest', 'price_asc', 'price_desc', 'name'])
      .default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (q) =>
      q.minPrice === undefined ||
      q.maxPrice === undefined ||
      q.minPrice <= q.maxPrice,
    { message: 'minPrice must not exceed maxPrice', path: ['minPrice'] },
  );
export type ListQuery = z.infer<typeof listQuery>;
