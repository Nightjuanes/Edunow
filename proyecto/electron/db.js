const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

let db;

function getDB() {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'app.sqlite');
  db = new Database(dbPath);
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { getDB, initSchema };
