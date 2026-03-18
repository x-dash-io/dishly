import { pgTable, pgEnum, uuid, text, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { recipes } from './recipes';

export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);

export const mealPlans = pgTable('meal_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  weekStartDate: text('week_start_date').notNull(), // ISO date string "2026-03-17"
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('meal_plans_user_week_idx').on(table.userId, table.weekStartDate),
  index('meal_plans_user_id_idx').on(table.userId),
]);

export const mealPlanItems = pgTable('meal_plan_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealPlanId: uuid('meal_plan_id').notNull().references(() => mealPlans.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').references(() => recipes.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Mon ... 6=Sun
  mealType: mealTypeEnum('meal_type').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('meal_plan_items_meal_plan_id_idx').on(table.mealPlanId),
]);
