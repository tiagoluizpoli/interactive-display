import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'node:path';
import Transport from 'winston-transport';

const DB_PATH = path.resolve(__dirname, '../../../../logs.sqlite');

class SQLiteTransport extends Transport {
  private db: Promise<Database>;

  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    this.db = this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<Database> {
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_SHAREDCACHE,
    });
    await db.exec('PRAGMA journal_mode = WAL;');

    await db.exec('PRAGMA busy_timeout = 5000;'); // Set a busy timeout of 5 seconds
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
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      super.emit('logged', info);
    });

    try {
      const db = await this.db;
      const { timestamp, level, message, ...meta } = info;
      await db.run(
        'INSERT INTO logs (timestamp, level, message, meta) VALUES (?, ?, ?, ?)',
        timestamp,
        level,
        message,
        JSON.stringify(meta),
      );
    } catch (error) {
      super.emit('error', error);
    }

    callback();
  }
}

export default SQLiteTransport;
