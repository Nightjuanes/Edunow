// proyecto/electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.MODEL || 'gemma:2b';

// Si tu versión de Electron/Node no trae fetch global, instala node-fetch y usa:
// const fetch = require('node-fetch');

let win;
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

  // DEV: carga tu React dev server
  // win.loadURL('http://localhost:5173');
  // PROD: carga el index.html generado
  // win.loadFile(path.join(__dirname, '../dist/index.html'));

  // Ajusta esta línea según tu flujo. Si usas Vite en react-app:
  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// --- IPC streaming a Ollama ---
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
