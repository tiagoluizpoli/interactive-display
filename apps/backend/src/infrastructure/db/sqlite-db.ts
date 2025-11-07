import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'node:path';

const DB_PATH = path.resolve(__dirname, '../../../../../logs.sqlite');

export const initializeDatabase = async () => {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      meta TEXT
    );
  `);

  return db;
};
