PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courses(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tecaher_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    descrip TEXT,
    lev TEXT,
    content_html TEXT,
    video_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime ('now')),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(tecaher_id);

CREATE TABLE IF NOT EXISTS enrollments (
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    status_ TEXT NOT NULL DEFAULT 'active' -- completed, dropped
    enrolled_at TEXT NOT NULL DEFAULT (datetime('now')), 
    PRIMARY KEY (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0 -- 0 es no completada y 1 es completada
    update_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id, lesson_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);