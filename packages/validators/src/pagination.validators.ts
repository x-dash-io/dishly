import { z } from 'zod';

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
  cursor: z.string().optional(),   // cursor-based pagination (recipe id)
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
