import { drizzle } from 'drizzle-orm/better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import * as schema from './schema';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { env } from '@/config';

const { db: dbConfig } = env;

// Ensure the directory for the database exists
const dbDir = path.dirname(dbConfig.sqlitePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new BetterSqlite3(dbConfig.sqlitePath);
export const db = drizzle(sqlite, { schema });
