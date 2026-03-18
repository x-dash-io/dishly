import { pgTable, uuid, text, integer, boolean, timestamp, index, primaryKey, AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from './users';
import { recipes } from './recipes';

export const follows = pgTable('follows', {
  followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followingId] }),
  index('follows_follower_id_idx').on(table.followerId),
  index('follows_following_id_idx').on(table.followingId),
]);

export const likes = pgTable('likes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.recipeId] }),
  index('likes_recipe_id_idx').on(table.recipeId),
]);

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isPublic: boolean('is_public').default(false),
  coverImageUrl: text('cover_image_url'),
  recipeCount: integer('recipe_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('collections_user_id_idx').on(table.userId),
]);

export const saves = pgTable('saves', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  collectionId: uuid('collection_id').references(() => collections.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('saves_user_id_recipe_id_idx').on(table.userId, table.recipeId),
]);

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references((): AnyPgColumn => comments.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('comments_recipe_id_idx').on(table.recipeId),
  index('comments_user_id_idx').on(table.userId),
  index('comments_parent_id_idx').on(table.parentId),
]);
