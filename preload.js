const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendTerminalInput: (command) => ipcRenderer.send('terminal-input', command),
    onTerminalOutput: (callback) => ipcRenderer.on('terminal-output', (_event, data) => callback(data)),
    runPython: (code) => ipcRenderer.send('run-python', code)
});
