import { z } from "zod";

/** `:id` route params arrive as strings; coerce to a positive integer or fail with 400. */
export const idParams = z.object({ id: z.coerce.number().int().positive() });
