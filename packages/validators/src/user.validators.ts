import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  display_name: z.string().min(1).max(60),
  bio: z.string().max(300).optional(),
  dietary_prefs: z.array(
    z.enum(['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'halal', 'kosher', 'keto', 'paleo'])
  ).optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export const OnboardingSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  display_name: z.string().min(1).max(60),
  dietary_prefs: z.array(
    z.enum(['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'halal', 'kosher', 'keto', 'paleo'])
  ).optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  cuisine_preferences: z.array(z.string()).min(1, 'Select at least one cuisine').max(10),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
