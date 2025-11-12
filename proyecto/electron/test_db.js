// electron/test_db.js
const { getDB } = require('./db');

try {
  const db = getDB();

  // Crear tabla de prueba si no existe
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    );
  `);

  // Insertar un usuario
  const stmt = db.prepare('INSERT INTO users (name, role) VALUES (?, ?)');
  stmt.run('Pame', 'teacher');

  // Leer todos los usuarios
  const rows = db.prepare('SELECT * FROM users').all();

  console.log(' Base de datos conectada y funcional.');
  console.log(' Usuarios registrados:', rows);
} catch (err) {
  console.error(' Error al probar la base de datos:', err.message);
}
