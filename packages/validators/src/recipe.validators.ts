import { z } from 'zod';

export const IngredientSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.string().max(20).optional(),
  unit: z.string().max(20).optional(),
  notes: z.string().max(200).optional(),
  order_index: z.number().int().min(0),
});

export const StepSchema = z.object({
  instruction: z.string().min(1).max(1000),
  image_url: z.string().url().optional(),
  timer_seconds: z.number().int().min(0).max(86400).optional(),
  order_index: z.number().int().min(0),
});

export const CreateRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  description: z.string().max(500).optional(),
  cuisine: z.string().max(60).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  prep_minutes: z.number().int().min(0).max(1440).default(0),
  cook_minutes: z.number().int().min(0).max(1440).default(0),
  servings: z.number().int().min(1).max(100).default(2),
  cover_image_url: z.string().url().optional(),
  hero_image_url: z.string().url().optional(),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
  ingredients: z.array(IngredientSchema).min(1, 'At least one ingredient required'),
  steps: z.array(StepSchema).min(1, 'At least one step required'),
});

export const UpdateRecipeSchema = CreateRecipeSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const PublishRecipeSchema = z.object({
  hero_image_url: z.string().url('Final dish photo is required to publish'),
  visibility: z.enum(['public', 'followers', 'private']),
});

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;
