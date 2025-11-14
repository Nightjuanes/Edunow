const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

let db;

function getDB() {
  if (db) return db;
  const dbPath = path.join(__dirname, 'edunow.sqlite');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Estudiante (
      id_estudiante INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_usuario TEXT NOT NULL,
      correo TEXT UNIQUE NOT NULL,
      contrasena TEXT NOT NULL,
      vidas INTEGER DEFAULT 4,
      racha_actual INTEGER DEFAULT 0,
      racha_maxima INTEGER DEFAULT 0,
      fecha_ultima_actividad TEXT,
      puntos_totales INTEGER DEFAULT 0,
      nivel_actual INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS Curso (
      id_curso INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      imagen_curso TEXT,
      banner TEXT,
      nivel_dificultad TEXT
    );

    CREATE TABLE IF NOT EXISTS Modulo (
      id_modulo INTEGER PRIMARY KEY AUTOINCREMENT,
      id_curso INTEGER NOT NULL,
      titulo_modulo TEXT NOT NULL,
      descripcion_modulo TEXT,
      orden INTEGER NOT NULL,
      FOREIGN KEY (id_curso) REFERENCES Curso (id_curso)
    );

    CREATE TABLE IF NOT EXISTS Leccion (
      id_leccion INTEGER PRIMARY KEY AUTOINCREMENT,
      id_modulo INTEGER NOT NULL,
      titulo_leccion TEXT NOT NULL,
      contenido TEXT,
      orden INTEGER NOT NULL,
      FOREIGN KEY (id_modulo) REFERENCES Modulo (id_modulo)
    );

    CREATE TABLE IF NOT EXISTS Ejercicio (
      id_ejercicio INTEGER PRIMARY KEY AUTOINCREMENT,
      id_leccion INTEGER NOT NULL,
      pregunta TEXT NOT NULL,
      tipo TEXT NOT NULL,
      respuesta_correcta TEXT NOT NULL,
      puntos INTEGER DEFAULT 0,
      orden INTEGER NOT NULL,
      FOREIGN KEY (id_leccion) REFERENCES Leccion (id_leccion)
    );

    CREATE TABLE IF NOT EXISTS Progreso (
      id_progreso INTEGER PRIMARY KEY AUTOINCREMENT,
      id_estudiante INTEGER NOT NULL,
      id_ejercicio INTEGER NOT NULL,
      estado TEXT NOT NULL,
      intentos INTEGER DEFAULT 0,
      fecha_completado TEXT,
      puntaje_obtenido INTEGER DEFAULT 0,
      FOREIGN KEY (id_estudiante) REFERENCES Estudiante (id_estudiante),
      FOREIGN KEY (id_ejercicio) REFERENCES Ejercicio (id_ejercicio)
    );

    CREATE TABLE IF NOT EXISTS Recompensa (
      id_recompensa INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      icono TEXT
    );

    CREATE TABLE IF NOT EXISTS Estudiante_Recompensa (
      id_estudiante INTEGER NOT NULL,
      id_recompensa INTEGER NOT NULL,
      fecha_obtenida TEXT NOT NULL,
      PRIMARY KEY (id_estudiante, id_recompensa),
      FOREIGN KEY (id_estudiante) REFERENCES Estudiante (id_estudiante),
      FOREIGN KEY (id_recompensa) REFERENCES Recompensa (id_recompensa)
    );

    CREATE TABLE IF NOT EXISTS Chat (
      id_chat INTEGER PRIMARY KEY AUTOINCREMENT,
      id_estudiante INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL,
      FOREIGN KEY (id_estudiante) REFERENCES Estudiante (id_estudiante)
    );

    CREATE TABLE IF NOT EXISTS Mensaje (
      id_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
      id_chat INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      fecha TEXT NOT NULL,
      FOREIGN KEY (id_chat) REFERENCES Chat (id_chat)
    );
  `);
}

function getStudents() {
  const db = getDB();
  return db.prepare('SELECT * FROM Estudiante').all();
}

function getStudent(studentId) {
  const db = getDB();
  return db.prepare('SELECT * FROM Estudiante WHERE id_estudiante = ?').get(studentId);
}

function getCourses() {
  const db = getDB();
  return db.prepare('SELECT * FROM Curso').all();
}

function getModules(courseId) {
  const db = getDB();
  return db.prepare('SELECT * FROM Modulo WHERE id_curso = ? ORDER BY orden').all(courseId);
}

function getLessons(moduleId) {
  const db = getDB();
  return db.prepare('SELECT * FROM Leccion WHERE id_modulo = ? ORDER BY orden').all(moduleId);
}

function getExercises(lessonId) {
  const db = getDB();
  return db.prepare('SELECT * FROM Ejercicio WHERE id_leccion = ? ORDER BY orden').all(lessonId);
}

function getProgress(studentId) {
  const db = getDB();
  return db.prepare('SELECT * FROM Progreso WHERE id_estudiante = ?').all(studentId);
}

function addStudent(data) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO Estudiante (nombre_usuario, correo, contrasena, vidas, racha_actual, racha_maxima, fecha_ultima_actividad, puntos_totales, nivel_actual)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(data.nombre_usuario, data.correo, data.contrasena, data.vidas || data.racha_actual || data.racha_maxima || data.fecha_ultima_actividad, data.puntos_totales || data.nivel_actual );
}

function updateProgress(data) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO Progreso (id_estudiante, id_ejercicio, estado, intentos, fecha_completado, puntaje_obtenido)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(data.id_estudiante, data.id_ejercicio, data.estado, data.intentos, data.fecha_completado, data.puntaje_obtenido);
}

function seedData() {
  const db = getDB();

  // Check if students exist
  const students = db.prepare('SELECT COUNT(*) as count FROM Estudiante').get();
  if (students.count === 0) {
    // Insert default student
    db.prepare(`
      INSERT INTO Estudiante (nombre_usuario, correo, contrasena, vidas, racha_actual, racha_maxima, fecha_ultima_actividad, puntos_totales, nivel_actual)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('UsuarioDemo', 'demo@edunow.com', 'password123', 4, 0, 0, null, 0, 1);
  }

  // Check if courses exist
  const courses = db.prepare('SELECT COUNT(*) as count FROM Curso').get();
  if (courses.count === 0) {
    // Insert sample courses
    db.prepare(`
      INSERT INTO Curso (titulo, descripcion, imagen_curso, banner, nivel_dificultad)
      VALUES (?, ?, ?, ?, ?)
    `).run('Energías Renovables', 'Explora soluciones y aprende cómo las energías renovables cambiarán el futuro. Solar, eólica y tecnologías innovadoras.', '/images/logoenergia.png', '/images/energias.jpg', 'Intermedio');

    db.prepare(`
      INSERT INTO Curso (titulo, descripcion, imagen_curso, banner, nivel_dificultad)
      VALUES (?, ?, ?, ?, ?)
    `).run('Pseudo-código', 'Vuélvete un experto en el arte de la creación de algoritmos y pensamiento lógico.', 'https://cdn-icons-png.flaticon.com/512/2103/2103626.png', 'https://cdn-icons-png.flaticon.com/512/2103/2103626.png', 'Principiante');

    // Insert modules, lessons, exercises for course 1
    db.prepare(`
      INSERT INTO Modulo (id_curso, titulo_modulo, descripcion_modulo, orden)
      VALUES (?, ?, ?, ?)
    `).run(1, 'Introducción a Energías Renovables', 'Conceptos básicos', 1);

    db.prepare(`
      INSERT INTO Leccion (id_modulo, titulo_leccion, contenido, orden)
      VALUES (?, ?, ?, ?)
    `).run(1, '¿Qué son las energías renovables?', 'Contenido sobre energías renovables...', 1);

    db.prepare(`
      INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(1, '¿Cuál es una energía renovable?', 'selección múltiple', 'Solar', 10, 1);
  }
}

function createChat(studentId, title) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO Chat (id_estudiante, titulo, fecha_creacion)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(studentId, title, new Date().toISOString());
  return result.lastInsertRowid;
}

function getChatsForStudent(studentId) {
  const db = getDB();
  return db.prepare('SELECT * FROM Chat WHERE id_estudiante = ? ORDER BY fecha_creacion DESC').all(studentId);
}

function deleteChat(chatId) {
  const db = getDB();
  db.prepare('DELETE FROM Mensaje WHERE id_chat = ?').run(chatId);
  db.prepare('DELETE FROM Chat WHERE id_chat = ?').run(chatId);
}

function addMessage(chatId, role, content) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO Mensaje (id_chat, role, content, fecha)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(chatId, role, content, new Date().toISOString());
}

function getMessagesForChat(chatId) {
  const db = getDB();
  return db.prepare('SELECT * FROM Mensaje WHERE id_chat = ? ORDER BY fecha').all(chatId);
}

function updateChatTitle(chatId, newTitle) {
  const db = getDB();
  const stmt = db.prepare('UPDATE Chat SET titulo = ? WHERE id_chat = ?');
  return stmt.run(newTitle, chatId);
}

module.exports = { getDB, initSchema, seedData, getStudents, getStudent, getCourses, getModules, getLessons, getExercises, getProgress, addStudent, updateProgress, createChat, getChatsForStudent, deleteChat, addMessage, getMessagesForChat, updateChatTitle };
