import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const recipeStatusEnum = pgEnum('recipe_status', ['draft', 'published', 'archived']);
export const recipeDifficultyEnum = pgEnum('recipe_difficulty', ['easy', 'medium', 'hard']);
export const visibilityEnum = pgEnum('visibility', ['visibility', 'public', 'followers', 'private']);

export const aiInputTypeEnum = pgEnum('ai_input_type', [
  'image_to_ingredients',
  'ingredients_to_recipe',
  'dish_to_recipe',
  'substitution',
  'cook_qa'
]);

export const aiGenerations = pgTable('ai_generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  inputType: aiInputTypeEnum('input_type').notNull(),
  inputImageUrl: text('input_image_url'),
  inputIngredients: jsonb('input_ingredients').$type<string[]>(),
  inputPrompt: text('input_prompt'),
  outputRecipeId: uuid('output_recipe_id'), // Reference added below or via relations
  modelVersion: text('model_version').notNull().default('gemini-2.5-flash'),
  tokensUsed: integer('tokens_used'),
  latencyMs: integer('latency_ms'),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('ai_generations_user_id_idx').on(table.userId),
  index('ai_generations_input_type_idx').on(table.inputType),
  index('ai_generations_created_at_idx').on(table.createdAt),
]);

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  cuisine: text('cuisine'),
  difficulty: recipeDifficultyEnum('difficulty').default('medium'),
  prepMinutes: integer('prep_minutes').default(0),
  cookMinutes: integer('cook_minutes').default(0),
  servings: integer('servings').default(2),
  coverImageUrl: text('cover_image_url'),
  heroImageUrl: text('hero_image_url'),
  isAiGenerated: boolean('is_ai_generated').default(false),
  aiGenerationId: uuid('ai_generation_id').references(() => aiGenerations.id),
  status: recipeStatusEnum('status').default('draft'),
  visibility: visibilityEnum('visibility').default('public'),
  likeCount: integer('like_count').default(0),
  saveCount: integer('save_count').default(0),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('recipes_user_id_idx').on(table.userId),
  index('recipes_status_idx').on(table.status),
  index('recipes_visibility_idx').on(table.visibility),
  index('recipes_is_ai_generated_idx').on(table.isAiGenerated),
  index('recipes_created_at_idx').on(table.createdAt),
]);

export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: text('quantity'),
  unit: text('unit'),
  notes: text('notes'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('ingredients_recipe_id_idx').on(table.recipeId),
]);

export const steps = pgTable('steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  instruction: text('instruction').notNull(),
  imageUrl: text('image_url'),
  timerSeconds: integer('timer_seconds'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('steps_recipe_id_idx').on(table.recipeId),
]);

export const nutrition = pgTable('nutrition', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().unique().references(() => recipes.id, { onDelete: 'cascade' }),
  calories: integer('calories'),
  proteinG: integer('protein_g'),
  carbsG: integer('carbs_g'),
  fatG: integer('fat_g'),
  fibreG: integer('fibre_g'),
  isEstimated: boolean('is_estimated').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});
