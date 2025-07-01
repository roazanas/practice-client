const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendLog: (level, message) => ipcRenderer.send('log-message', { level, message }),
  
  websocketSend: (data) => ipcRenderer.invoke('websocket-send', data),
  websocketStatus: () => ipcRenderer.invoke('websocket-status'),
  
  // Подписка на события WebSocket
  onWebSocketConnected: (callback) => ipcRenderer.on('websocket-connected', callback),
  onWebSocketDisconnected: (callback) => ipcRenderer.on('websocket-disconnected', callback),
  onWebSocketError: (callback) => ipcRenderer.on('websocket-error', callback),
  onAuthResponse: (callback) => ipcRenderer.on('auth-response', callback),
  onWebSocketMessage: (callback) => ipcRenderer.on('websocket-message', callback),
  
  // Методы для отписки
  removeWebSocketListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});