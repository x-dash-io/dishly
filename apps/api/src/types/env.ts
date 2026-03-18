export interface CloudflareEnv {
  ENVIRONMENT: 'development' | 'production';
  DATABASE_URL: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  GEMINI_API_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_ACCOUNT_ID: string;
  DISHLY_BUCKET: R2Bucket;
}

export interface Variables {
  user?: unknown; // Will refine this later with the actual User type from Drizzle
  clerkId?: string;
}
