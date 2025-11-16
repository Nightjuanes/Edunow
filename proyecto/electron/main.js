// proyecto/electron/main.js
const path = require('path');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

// --- Base de datos ---
const {
  getDB,
  initSchema,
  seedData,
  getStudents,
  getStudent,
  getCourses,
  getModules,
  getLessons,
  getExercises,
  getProgress,
  getCoursesInProgress,
  addStudent,
  updateProgress,
  createChat,
  getChatsForStudent,
  deleteChat,
  addMessage,
  getMessagesForChat,
  updateChatTitle,
  checkAndUpdateLives,
  getStudentStats,
  getStudentAchievements
} = require('./db');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.MODEL || 'gemma:2b';

let win;

// --- Crea la ventana principal ---
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // ⚙️ Si estás en desarrollo, usa el server de React
  win.loadURL('http://localhost:5173');

  // ⚙️ Si ya compilaste el front, carga el index.html
  // win.loadFile(path.join(__dirname, '../react-app/dist/index.html'));
}

// --- Cuando Electron está listo ---
app.whenReady().then(() => {
  // Inicializar la base de datos
  const db = getDB();
  initSchema(db);
  seedData();
  console.log('✅ Base de datos creada o actualizada correctamente.');

  // Crear ventana
  createWindow();

  // --- IPC database handlers ---
  ipcMain.handle('db:getStudents', () => getStudents());
  ipcMain.handle('db:getStudent', (event, studentId) => getStudent(studentId));
  ipcMain.handle('db:getCourses', () => getCourses());
  ipcMain.handle('db:getModules', (event, courseId) => getModules(courseId));
  ipcMain.handle('db:getLessons', (event, moduleId) => getLessons(moduleId));
  ipcMain.handle('db:getExercises', (event, lessonId) => getExercises(lessonId));
  ipcMain.handle('db:getProgress', (event, studentId) => getProgress(studentId));
  ipcMain.handle('db:getCoursesInProgress', (event, studentId) => getCoursesInProgress(studentId));
  ipcMain.handle('db:addStudent', (event, data) => addStudent(data));
  ipcMain.handle('db:updateProgress', (event, data) => updateProgress(data));
  ipcMain.handle('db:createChat', (event, studentId, title) => createChat(studentId, title));
  ipcMain.handle('db:getChatsForStudent', (event, studentId) => getChatsForStudent(studentId));
  ipcMain.handle('db:deleteChat', (event, chatId) => deleteChat(chatId));
  ipcMain.handle('db:addMessage', (event, chatId, role, content) => addMessage(chatId, role, content));
  ipcMain.handle('db:getMessagesForChat', (event, chatId) => getMessagesForChat(chatId));
  ipcMain.handle('db:updateChatTitle', (event, chatId, title) => updateChatTitle(chatId, title));
  ipcMain.handle('db:checkAndUpdateLives', (event, studentId) => checkAndUpdateLives(studentId));
  ipcMain.handle('db:getStudentStats', (event, studentId) => getStudentStats(studentId));
  ipcMain.handle('db:getStudentAchievements', (event, studentId) => getStudentAchievements(studentId));
});

// Cierra correctamente
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- Chat con Ollama ---
const activeControllers = new Map();

ipcMain.on('chat:stream', async (event, { id, messages }) => {
  const controller = new AbortController();
  activeControllers.set(id, controller);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, stream: true }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      const txt = await res.text().catch(() => 'Error desconocido');
      event.sender.send(`chat:done:${id}`, { error: txt });
      activeControllers.delete(id);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const json = JSON.parse(line);
          const delta = json?.message?.content || '';
          if (delta) {
            event.sender.send(`chat:chunk:${id}`, delta);
          }
        } catch (_) {}
      }
    }

    event.sender.send(`chat:done:${id}`, { ok: true });
  } catch (err) {
    event.sender.send(`chat:done:${id}`, { error: String(err.message || err) });
  } finally {
    activeControllers.delete(id);
  }
});

ipcMain.on('chat:cancel', (event, { id }) => {
  const ctl = activeControllers.get(id);
  if (ctl) {
    ctl.abort();
    activeControllers.delete(id);
  }
});
