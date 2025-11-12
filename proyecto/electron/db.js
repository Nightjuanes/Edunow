const path = require('path');
const { app } = require('electron');
const fs = require ('fs')
const Database = require('better-sqlite3');


let db;

function getDB() {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'app.sqlite');
  console.log('📂 Base de datos creada o abierta en:', dbPath);
  const firstTime = !fs.existsSync(dbPath);

  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  if (firstTime){
    console.log("Creando base de datos y aplicando esquemas...");
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log("Esquema de base de datos inicializado correctamente");
}

module.exports = { getDB, initSchema };



