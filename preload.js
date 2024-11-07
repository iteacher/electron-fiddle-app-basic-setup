const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
    sendMessage: (message) => ipcRenderer.send('message', message),
    receiveMessage: (callback) => ipcRenderer.on('message', callback)
});
