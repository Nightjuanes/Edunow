// proyecto/electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('edunow', {
  chatStream: (messages, id = Date.now().toString()) => {
    ipcRenderer.send('chat:stream', { id, messages });

    return {
      onChunk(cb) {
        const ch = (_e, delta) => cb(delta);
        ipcRenderer.on(`chat:chunk:${id}`, ch);
        return () => ipcRenderer.removeListener(`chat:chunk:${id}`, ch);
      },
      onDone(cb) {
        const dn = (_e, payload) => cb(payload);
        ipcRenderer.once(`chat:done:${id}`, dn);
      },
      cancel() {
        ipcRenderer.send('chat:cancel', { id });
      }
    };
  }
});
