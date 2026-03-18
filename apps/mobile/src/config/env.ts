import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  EXPO_PUBLIC_API_URL: z.string().url(),
});

export const env = envSchema.parse({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});
