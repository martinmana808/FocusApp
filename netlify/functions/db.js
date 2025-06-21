
import Database from 'better-sqlite3';
import fs from 'fs';

const dbPath = process.env.SQLITE_PATH || '/tmp/videos.db';

/* crea archivo si no existe */
if (!fs.existsSync(dbPath)) fs.closeSync(fs.openSync(dbPath, 'w'));

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id           TEXT PRIMARY KEY,
    title        TEXT,
    published_at TEXT,
    source       TEXT,
    watched      INTEGER DEFAULT 0,
    fetched_on   DATE
  )
`);
export default db;

