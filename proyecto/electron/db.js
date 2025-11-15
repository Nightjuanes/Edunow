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
      nivel_actual INTEGER DEFAULT 1,
      fecha_bloqueo_vidas TEXT
    );

    CREATE TABLE IF NOT EXISTS Curso (
      id_curso INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      imagen_curso TEXT,
      banner TEXT,
      nivel_dificultad TEXT,
      duracion TEXT
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
      completado_correctamente INTEGER DEFAULT 0,
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

function getCoursesInProgress(studentId) {
  const db = getDB();
  // Get courses where student has progress
  const coursesWithProgress = db.prepare(`
    SELECT DISTINCT c.id_curso, c.titulo, c.descripcion, c.imagen_curso, c.banner, c.nivel_dificultad, c.duracion
    FROM Curso c
    JOIN Modulo m ON c.id_curso = m.id_curso
    JOIN Leccion l ON m.id_modulo = l.id_modulo
    JOIN Ejercicio e ON l.id_leccion = e.id_leccion
    JOIN Progreso p ON e.id_ejercicio = p.id_ejercicio
    WHERE p.id_estudiante = ?
  `).all(studentId);

  // For each course, calculate progress
  const result = coursesWithProgress.map(course => {
    // Total exercises in course
    const totalExercises = db.prepare(`
      SELECT COUNT(*) as count FROM Ejercicio e
      JOIN Leccion l ON e.id_leccion = l.id_leccion
      JOIN Modulo m ON l.id_modulo = m.id_modulo
      WHERE m.id_curso = ?
    `).get(course.id_curso).count;

    // Completed correctly exercises
    const completedExercises = db.prepare(`
      SELECT COUNT(*) as count FROM Progreso p
      JOIN Ejercicio e ON p.id_ejercicio = e.id_ejercicio
      JOIN Leccion l ON e.id_leccion = l.id_leccion
      JOIN Modulo m ON l.id_modulo = m.id_modulo
      WHERE m.id_curso = ? AND p.id_estudiante = ? AND p.completado_correctamente = 1
    `).get(course.id_curso, studentId).count;

    const progressPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

    return {
      ...course,
      progressPercentage
    };
  });

  return result;
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

  // Check if student is blocked
  const student = db.prepare('SELECT vidas, fecha_bloqueo_vidas FROM Estudiante WHERE id_estudiante = ?').get(data.id_estudiante);
  if (student.vidas === 0) {
    const blockTime = new Date(student.fecha_bloqueo_vidas);
    const now = new Date();
    const oneHour = 60 * 60 * 1000; // 1 hour in ms
    if (now - blockTime < oneHour) {
      throw new Error('Student is blocked from doing exercises. Wait 1 hour for life renewal.');
    } else {
      // Renew one life
      db.prepare('UPDATE Estudiante SET vidas = 1, fecha_bloqueo_vidas = NULL WHERE id_estudiante = ?').run(data.id_estudiante);
    }
  }

  // Get the points from the exercise to determine if completed correctly
  const exercise = db.prepare('SELECT puntos FROM Ejercicio WHERE id_ejercicio = ?').get(data.id_ejercicio);
  const completadoCorrectamente = (data.estado === 'completado' && exercise && data.puntaje_obtenido === exercise.puntos) ? 1 : 0;

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO Progreso (id_estudiante, id_ejercicio, estado, intentos, fecha_completado, puntaje_obtenido, completado_correctamente)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(data.id_estudiante, data.id_ejercicio, data.estado, data.intentos, data.fecha_completado, data.puntaje_obtenido, completadoCorrectamente);

  // If exercise completed, check for lives decrement
  if (data.estado === 'completado') {
    // Get the points from the exercise
    const exercise = db.prepare('SELECT puntos FROM Ejercicio WHERE id_ejercicio = ?').get(data.id_ejercicio);
    if (exercise) {
      // Check if score is perfect
      const isPerfect = data.puntaje_obtenido === exercise.puntos;
      if (!isPerfect) {
        // Decrement lives
        const currentLives = db.prepare('SELECT vidas FROM Estudiante WHERE id_estudiante = ?').get(data.id_estudiante).vidas;
        const newLives = Math.max(0, currentLives - 1);
        db.prepare('UPDATE Estudiante SET vidas = ? WHERE id_estudiante = ?').run(newLives, data.id_estudiante);
        if (newLives === 0) {
          // Set block time
          db.prepare('UPDATE Estudiante SET fecha_bloqueo_vidas = ? WHERE id_estudiante = ?').run(new Date().toISOString(), data.id_estudiante);
        }
      }

      // Update points and level if scored points
      if (data.puntaje_obtenido > 0) {
        // Add points to student's total
        db.prepare('UPDATE Estudiante SET puntos_totales = puntos_totales + ? WHERE id_estudiante = ?').run(exercise.puntos, data.id_estudiante);

        // Check if student levels up (every 100 points)
        const studentAfter = db.prepare('SELECT puntos_totales, nivel_actual FROM Estudiante WHERE id_estudiante = ?').get(data.id_estudiante);
        if (studentAfter.puntos_totales >= 100) {
          const newLevel = studentAfter.nivel_actual + 1;
          const remainingPoints = studentAfter.puntos_totales - 100;
          db.prepare('UPDATE Estudiante SET nivel_actual = ?, puntos_totales = ? WHERE id_estudiante = ?').run(newLevel, remainingPoints, data.id_estudiante);
        }
      }
    }
  }

  return result;
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

  // Insert sample courses (INSERT OR IGNORE ensures they exist with specific IDs)
  db.prepare(`
    INSERT OR IGNORE INTO Curso (id_curso, titulo, descripcion, imagen_curso, banner, nivel_dificultad, duracion)
    VALUES (1, ?, ?, ?, ?, ?, ?)
  `).run('Energías Renovables', 'Explora soluciones y aprende cómo las energías renovables cambiarán el futuro. Solar, eólica y tecnologías innovadoras.', '/images/logoenergia.png', '/images/energias.jpg', 'Intermedio','10 horas');

  db.prepare(`
    INSERT OR IGNORE INTO Curso (id_curso, titulo, descripcion, imagen_curso, banner, nivel_dificultad, duracion)
    VALUES (2, ?, ?, ?, ?, ?, ?)
  `).run('Pseudo-código', 'Vuélvete un experto en el arte de la creación de algoritmos y pensamiento lógico.', '/images/icono_pseudocodigo.png', '/images/pseudo_banner.jpg', 'Principiante', '14 Horas');

  db.prepare(`
    INSERT OR IGNORE INTO Curso (id_curso, titulo, descripcion, imagen_curso, banner, nivel_dificultad, duracion)
    VALUES (3, ?, ?, ?, ?, ?, ?)
  `).run('Introducción a Circuitos', 'Aprende los fundamentos de los circuitos eléctricos, componentes y leyes básicas.', '/images/circuito.png', '/images/circuitos.jpg', 'Principiante', '20 Horas');

  // Check if modules for course 1 exist
  const modules1 = db.prepare('SELECT COUNT(*) as count FROM Modulo WHERE id_curso = 1').get();
  if (modules1.count === 0) {
    // Insert modules, lessons, exercises for course 1
    db.prepare(`
      INSERT INTO Modulo (id_curso, titulo_modulo, descripcion_modulo, orden)
      VALUES (?, ?, ?, ?)
    `).run(1, 'Introducción a Energías Renovables', 'Conceptos básicos', 1);

    db.prepare(`
      INSERT INTO Leccion (id_modulo, titulo_leccion, contenido, orden)
      VALUES (?, ?, ?, ?)
    `).run(1, '¿Qué son las energías renovables?', 'Contenido sobre energías renovables...', 1);

    // Insert combined exercise with all questions
    const questions = [
      {
        question: "¿Cuál es una energía renovable?",
        options: ["A) Solar", "B) Nuclear", "C) Fósil", "D) Eólica"],
        explanation: "A) → Correcta: La energía solar es renovable ya que proviene del sol."
      },
      {
        question: "¿Cuál es el principal componente que mide la eficiencia de un panel solar?",
        options: ["A) Temperatura ambiente", "B) Velocidad del viento", "C) Cantidad de radiación recibida", "D) Nivel de ruido"],
        explanation: "A) afecta pero no determina la eficiencia.\nB) no influye directamente.\nC) → Correcta: la eficiencia depende de cuánta radiación el panel convierte en electricidad.\nD) no tiene relación."
      },
      {
        question: "¿Cuál es la función principal de un aerogenerador?",
        options: ["A) Almacenar electricidad", "B) Convertir energía mecánica en electricidad", "C) Producir calor", "D) Transportar energía"],
        explanation: "A) esa es función de baterías.\nB) → Correcta: convierte energía del viento → giro → electricidad.\nC) no produce calor.\nD) no transporta energía, solo la genera."
      }
    ];
    // Check if exercise already exists and update it
    const existingExercise = db.prepare('SELECT id_ejercicio FROM Ejercicio WHERE id_leccion = 1 AND orden = 1').get();
    if (existingExercise) {
      db.prepare(`
        UPDATE Ejercicio
        SET pregunta = ?, tipo = ?, respuesta_correcta = ?, puntos = ?
        WHERE id_ejercicio = ?
      `).run(JSON.stringify(questions), 'opcion_multiple', JSON.stringify(['A', 'C', 'B']), 30, existingExercise.id_ejercicio);
    } else {
      db.prepare(`
        INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(1, JSON.stringify(questions), 'opcion_multiple', JSON.stringify(['A', 'C', 'B']), 30, 1);
    }
  }

  // Check if pseudocode module exists
  const pseudocodeModules = db.prepare('SELECT COUNT(*) as count FROM Modulo WHERE id_curso = 2').get();
  if (pseudocodeModules.count === 0) {
    // Add module, lesson, and exercises for pseudocode course (id_curso=2)
    const moduleResult = db.prepare(`
      INSERT INTO Modulo (id_curso, titulo_modulo, descripcion_modulo, orden)
      VALUES (?, ?, ?, ?)
    `).run(2, 'Estructuras Básicas', 'Introducción a las estructuras fundamentales del pseudocódigo', 1);

    const moduleId = moduleResult.lastInsertRowid;

    const lessonResult = db.prepare(`
      INSERT INTO Leccion (id_modulo, titulo_leccion, contenido, orden)
      VALUES (?, ?, ?, ?)
    `).run(moduleId, 'Términos y Definiciones', 'Aprende los términos básicos del pseudocódigo', 1);

    const lessonId = lessonResult.lastInsertRowid;

    const terms = ["Algoritmo", "Variable", "Ciclo", "Condicional", "Función"];
    const definitions = [
      "Secuencia de pasos para resolver un problema.",
      "Espacio en memoria para almacenar datos.",
      "Estructura que repite instrucciones.",
      "Estructura que ejecuta código basado en condición.",
      "Bloque de código reutilizable."
    ];
    const correctMatches = {
      "Algoritmo": "Secuencia de pasos para resolver un problema.",
      "Variable": "Espacio en memoria para almacenar datos.",
      "Ciclo": "Estructura que repite instrucciones.",
      "Condicional": "Estructura que ejecuta código basado en condición.",
      "Función": "Bloque de código reutilizable."
    };

    db.prepare(`
      INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(lessonId, JSON.stringify({ terms, definitions }), 'empareja', JSON.stringify(correctMatches), 20, 1);

    // Add word search exercise
    const words = ["ALGORITMO", "VARIABLE", "CICLO", "CONDICIONAL", "FUNCION", "PSEUDOCODIGO", "ENTRADA", "SALIDA", "PROCESO", "SI", "SINO", "PARA", "MIENTRAS", "REPETIR", "HASTA"];
    db.prepare(`
      INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(lessonId, JSON.stringify({ words, gridSize: 15 }), 'sopa_de_letras', JSON.stringify(words), 30, 2);
  } else {
    // Module exists, check if word search exists
    const wordSearchExists = db.prepare(`
      SELECT COUNT(*) as count FROM Ejercicio e
      JOIN Leccion l ON e.id_leccion = l.id_leccion
      JOIN Modulo m ON l.id_modulo = m.id_modulo
      WHERE m.id_curso = 2 AND e.tipo = 'sopa_de_letras'
    `).get();
    if (wordSearchExists.count === 0) {
      // Find the lesson ID for pseudocode
      const lesson = db.prepare(`
        SELECT l.id_leccion FROM Leccion l
        JOIN Modulo m ON l.id_modulo = m.id_modulo
        WHERE m.id_curso = 2 AND m.titulo_modulo = 'Estructuras Básicas'
        AND l.titulo_leccion = 'Términos y Definiciones'
      `).get();
      if (lesson) {
        // Add word search exercise
        const words = ["ALGORITMO", "VARIABLE", "CICLO", "CONDICIONAL", "FUNCION", "PSEUDOCODIGO", "ENTRADA", "SALIDA", "PROCESO", "SI", "SINO", "PARA", "MIENTRAS", "REPETIR", "HASTA"];
        db.prepare(`
          INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(lesson.id_leccion, JSON.stringify({ words, gridSize: 15 }), 'sopa_de_letras', JSON.stringify(words), 30, 2);
      }
    }
  }

  // Check if circuits course modules exist
  const circuitsModules = db.prepare('SELECT COUNT(*) as count FROM Modulo WHERE id_curso = 3').get();
  if (circuitsModules.count === 0) {
    // Add modules, lessons, and exercises for circuits course (id_curso=3)
    const module1Result = db.prepare(`
      INSERT INTO Modulo (id_curso, titulo_modulo, descripcion_modulo, orden)
      VALUES (?, ?, ?, ?)
    `).run(3, 'Componentes Básicos', 'Conoce los componentes fundamentales de los circuitos eléctricos', 1);

    const module1Id = module1Result.lastInsertRowid;

    const lesson1Result = db.prepare(`
      INSERT INTO Leccion (id_modulo, titulo_leccion, contenido, orden)
      VALUES (?, ?, ?, ?)
    `).run(module1Id, 'Símbolos y Componentes', 'Aprende los símbolos y funciones de los componentes básicos', 1);

    const lesson1Id = lesson1Result.lastInsertRowid;

    // Matching exercise for components
    const terms = ["Resistor", "Capacitor", "Inductor", "Batería", "Interruptor"];
    const definitions = [
      "Componente que limita el flujo de corriente.",
      "Componente que almacena carga eléctrica.",
      "Componente que almacena energía en campo magnético.",
      "Fuente de energía eléctrica.",
      "Dispositivo que abre o cierra el circuito."
    ];
    const correctMatches = {
      "Resistor": "Componente que limita el flujo de corriente.",
      "Capacitor": "Componente que almacena carga eléctrica.",
      "Inductor": "Componente que almacena energía en campo magnético.",
      "Batería": "Fuente de energía eléctrica.",
      "Interruptor": "Dispositivo que abre o cierra el circuito."
    };

    db.prepare(`
      INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(lesson1Id, JSON.stringify({ terms, definitions }), 'empareja', JSON.stringify(correctMatches), 20, 1);

    // Word search for circuit terms
    const words = ["RESISTOR", "CAPACITOR", "INDUCTOR", "BATERIA", "INTERRUPTOR", "VOLTAJE", "CORRIENTE", "RESISTENCIA"];
    db.prepare(`
      INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(lesson1Id, JSON.stringify({ words, gridSize: 12 }), 'sopa_de_letras', JSON.stringify(words), 25, 2);

    // Add second module
    const module2Result = db.prepare(`
      INSERT INTO Modulo (id_curso, titulo_modulo, descripcion_modulo, orden)
      VALUES (?, ?, ?, ?)
    `).run(3, 'Leyes de Circuitos', 'Estudia las leyes fundamentales que rigen el comportamiento de los circuitos', 2);

    const module2Id = module2Result.lastInsertRowid;

    const lesson2Result = db.prepare(`
      INSERT INTO Leccion (id_modulo, titulo_leccion, contenido, orden)
      VALUES (?, ?, ?, ?)
    `).run(module2Id, 'Ley de Ohm y Leyes de Kirchhoff', 'Comprende las leyes básicas de los circuitos eléctricos', 1);

    const lesson2Id = lesson2Result.lastInsertRowid;

    // Matching exercise for laws
    const terms2 = ["Ley de Ohm", "Ley de Kirchhoff de Corrientes", "Ley de Kirchhoff de Voltajes"];
    const definitions2 = [
      "V = I × R: El voltaje es igual a la corriente por la resistencia.",
      "La suma de corrientes que entran a un nodo es igual a la suma de corrientes que salen.",
      "La suma de voltajes en un lazo cerrado es cero."
    ];
    const correctMatches2 = {
      "Ley de Ohm": "V = I × R: El voltaje es igual a la corriente por la resistencia.",
      "Ley de Kirchhoff de Corrientes": "La suma de corrientes que entran a un nodo es igual a la suma de corrientes que salen.",
      "Ley de Kirchhoff de Voltajes": "La suma de voltajes en un lazo cerrado es cero."
    };

    db.prepare(`
      INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(lesson2Id, JSON.stringify({ terms: terms2, definitions: definitions2 }), 'empareja', JSON.stringify(correctMatches2), 20, 1);

    // Add third module: Ejercicios
    const module3Result = db.prepare(`
      INSERT INTO Modulo (id_curso, titulo_modulo, descripcion_modulo, orden)
      VALUES (?, ?, ?, ?)
    `).run(3, 'Ejercicios', 'Practica con ejercicios interactivos de circuitos', 3);

    const module3Id = module3Result.lastInsertRowid;

    const lesson3Result = db.prepare(`
      INSERT INTO Leccion (id_modulo, titulo_leccion, contenido, orden)
      VALUES (?, ?, ?, ?)
    `).run(module3Id, 'Ejercicios Prácticos', 'Pon a prueba tus conocimientos con crucigramas y preguntas', 1);

    const lesson3Id = lesson3Result.lastInsertRowid;

    // Multiple choice exercise
    const multipleChoiceData = [
      {
        question: "¿Qué pasa en un circuito abierto?",
        options: ["A) El LED enciende", "B) La corriente fluye parcialmente", "C) No fluye corriente", "D) Aumenta el voltaje"],
        correct: "C"
      },
      {
        question: "El voltaje es…",
        options: ["A) El flujo de electrones", "B) La presión que impulsa la corriente", "C) La oposición al paso de corriente", "D) La carga del circuito"],
        correct: "B"
      },
      {
        question: "Conectar el LED al revés provoca:",
        options: ["A) Se quema", "B) Parpadea", "C) No enciende", "D) Aumenta la resistencia"],
        correct: "C"
      },
      {
        question: "Un cortocircuito ocurre cuando…",
        options: ["A) El LED recibe menos voltaje", "B) La corriente pasa por la carga", "C) El positivo y el negativo se conectan sin carga", "D) El interruptor está cerrado"],
        correct: "C"
      },
      {
        question: "¿Por qué se usa una resistencia?",
        options: ["A) Para aumentar el voltaje", "B) Para proteger componentes delicados", "C) Para cerrar un circuito", "D) Para invertir polaridades"],
        correct: "B"
      }
    ];

    const mcCorrectAnswers = ["C", "B", "C", "C", "B"];

    db.prepare(`
      INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(lesson3Id, JSON.stringify(multipleChoiceData), 'opcion_multiple', JSON.stringify(mcCorrectAnswers), 25, 2);
  } else {
    // Modules exist, check if we need to update the circuit exercise
    const lesson = db.prepare(`
      SELECT l.id_leccion FROM Leccion l
      JOIN Modulo m ON l.id_modulo = m.id_modulo
      WHERE m.id_curso = 3 AND m.titulo_modulo = 'Ejercicios'
      AND l.titulo_leccion = 'Ejercicios Prácticos'
    `).get();

    if (lesson) {
      // Crossword Exercise
      const circuitData = {
        diagram: [
          "     [BATERIA]     ",
          "        |         ",
          "        |         ",
          "     [RESISTOR]   ",
          "        |         ",
          "        |         ",
          "     [LED]        ",
          "        |         ",
          "        |         ",
          "   [INTERRUPTOR]  "
        ],
        placeholders: ["[BATERIA]", "[RESISTOR]", "[LED]", "[INTERRUPTOR]"],
        hints: [
          "BATERIA - Fuente de energía eléctrica",
          "RESISTOR - Limita el flujo de corriente",
          "LED - Diodo emisor de luz",
          "INTERRUPTOR - Abre o cierra el circuito"
        ]
      };

      const correctAnswers = ["BATERIA", "RESISTOR", "LED", "INTERRUPTOR"];

      // Check if circuit diagram exercise already exists and update it
      const existingCircuitExercise = db.prepare(`
        SELECT id_ejercicio FROM Ejercicio
        WHERE id_leccion = ? AND orden = 1
      `).get(lesson.id_leccion);

      if (existingCircuitExercise) {
        // Update existing exercise
        db.prepare(`
          UPDATE Ejercicio
          SET pregunta = ?, tipo = ?, respuesta_correcta = ?, puntos = ?
          WHERE id_ejercicio = ?
        `).run(JSON.stringify(circuitData), 'crucigrama', JSON.stringify(correctAnswers), 30, existingCircuitExercise.id_ejercicio);
      } else {
        // Insert new exercise
        db.prepare(`
          INSERT INTO Ejercicio (id_leccion, pregunta, tipo, respuesta_correcta, puntos, orden)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(lesson.id_leccion, JSON.stringify(circuitData), 'crucigrama', JSON.stringify(correctAnswers), 30, 1);
      }
    }
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

function checkAndUpdateLives(studentId) {
  const db = getDB();
  const student = db.prepare('SELECT vidas, fecha_bloqueo_vidas FROM Estudiante WHERE id_estudiante = ?').get(studentId);
  if (student && student.vidas === 0 && student.fecha_bloqueo_vidas) {
    const blockTime = new Date(student.fecha_bloqueo_vidas);
    const now = new Date();
    const oneHour = 60 * 60 * 1000; // 1 hour in ms
    if (now - blockTime >= oneHour) {
      // Renew one life
      db.prepare('UPDATE Estudiante SET vidas = 1, fecha_bloqueo_vidas = NULL WHERE id_estudiante = ?').run(studentId);
      return true; // Updated
    }
  }
  return false; // Not updated
}

module.exports = { getDB, initSchema, seedData, getStudents, getStudent, getCourses, getModules, getLessons, getExercises, getProgress, getCoursesInProgress, addStudent, updateProgress, createChat, getChatsForStudent, deleteChat, addMessage, getMessagesForChat, updateChatTitle, checkAndUpdateLives };
