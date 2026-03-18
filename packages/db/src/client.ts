import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const createDb = (databaseUrl: string) => {
  const neonClient = neon(databaseUrl);
  return drizzle(neonClient, { schema });
};

export type Db = ReturnType<typeof createDb>;
