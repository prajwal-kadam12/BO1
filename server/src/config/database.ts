import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL not set. Database features will be unavailable.');
}

export const pool = connectionString ? new Pool({ connectionString }) : null;
export const db = pool ? drizzle(pool) : null;

export const getDb = () => {
  if (!db) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }
  return db;
};

export default db;
