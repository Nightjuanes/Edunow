const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getDB, initSchema } = require('./db');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '../public/index.html'));
}

app.whenReady().then(() => {
  const db = getDB();
  initSchema(db);

  // IPC: Listar todos
  ipcMain.handle('items:list', () => {
    return db.prepare('SELECT * FROM items ORDER BY id DESC').all();
  });

  // IPC: Agregar
  ipcMain.handle('items:add', (_evt, { title, notes }) => {
    const stmt = db.prepare('INSERT INTO items (title, notes) VALUES (?, ?)');
    const res = stmt.run(title, notes ?? null);
    return { id: res.lastInsertRowid };
  });

  // IPC: Eliminar
  ipcMain.handle('items:delete', (_evt, id) => {
    db.prepare('DELETE FROM items WHERE id = ?').run(id);
    return { ok: true };
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
