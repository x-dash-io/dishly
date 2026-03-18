import { pgTable, pgEnum, uuid, text, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const skillLevelEnum = pgEnum('skill_level', ['beginner', 'intermediate', 'advanced']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  dietaryPrefs: jsonb('dietary_prefs').$type<string[]>(),
  skillLevel: skillLevelEnum('skill_level').default('beginner'),
  pushToken: text('push_token'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('clerk_id_idx').on(table.clerkId),
  uniqueIndex('username_idx').on(table.username),
]);
