import { drizzle } from 'drizzle-orm/better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const sqlite = new BetterSqlite3('./src/db/sqlite.db');
export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: './src/db/migrations' });
