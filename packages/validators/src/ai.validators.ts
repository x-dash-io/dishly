import { z } from 'zod';

export const ImageToIngredientsSchema = z.object({
  image_url: z.string().url(),   // R2 URL after upload
});

export const IngredientsToRecipeSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1).max(30),
  dietary_filters: z.array(
    z.enum(['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'halal', 'keto'])
  ).optional(),
  servings: z.number().int().min(1).max(12).default(2),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
});

export const DishToRecipeSchema = z.object({
  image_url: z.string().url(),
});

export const CookQASchema = z.object({
  recipe_id: z.string().uuid(),
  current_step_index: z.number().int().min(0),
  question: z.string().min(1).max(500),
});

export const SubstitutionSchema = z.object({
  recipe_id: z.string().uuid(),
  ingredient_name: z.string().min(1).max(100),
});
