const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getComputerName: () => ipcRenderer.invoke('get-computer-name'),
  getOsInfo: () => ipcRenderer.invoke('get-os-info'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  log: (level, message) => ipcRenderer.invoke('log', level, message),
  sendLog: (level, message) => ipcRenderer.send('log-message', { level, message })
});

// module.exports = {
//   contextBridge
// };
