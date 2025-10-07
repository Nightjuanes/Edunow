const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listItems: () => ipcRenderer.invoke('items:list'),
  addItem: (data) => ipcRenderer.invoke('items:add', data),
  deleteItem: (id) => ipcRenderer.invoke('items:delete', id),
});
