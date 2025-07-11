const { app, BrowserWindow, autoUpdater, ipcMain } = require('electron');
const path = require('path');

const constants = require('./constants.cjs');
const Logger = require('./logger.cjs');
const { UpdateStatusManager, checkForUpdates } = require('./updater.cjs');
const { connectWebSocket } = require('./websocket.cjs');
const { version } = require('os');
const { disconnect } = require('./websocket.cjs');
require('./ipc.cjs');

ipcMain.on('log-message', (event, { level, message }) => {
  if (level === 'INFO') Logger.info(message);
  else if (level === 'WARN') Logger.warn(message);
  else if (level === 'ERROR') Logger.error(message);
});

function getPlatformUpdateUrl(baseUrl) {
  switch (process.platform) {
    case 'win32':
      return `${baseUrl}/win/`;
    case 'linux':
      return `${baseUrl}/linux/`;
    default:
      return baseUrl;
  }
}

const feedUrl = getPlatformUpdateUrl(constants.UPDATE_SERVER_URL);
autoUpdater.setFeedURL({
  provider: 'generic',
  url: feedUrl
});

// Окно
//
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    autoHideMenuBar: true,
  });

  if (constants.isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  Logger.info(`Application started - ${constants.APP_VERSION} on ${constants.OS_INFO}`);
}

// Инициализация приложения
app.whenReady().then(async () => {
  createWindow();

  connectWebSocket();

  // Регистрируем приложение в системе
  await UpdateStatusManager.updateStatus('running');

  // Проверяем обновления через 5 секунд после запуска, чтобы всё подгрузилось
  setTimeout(checkForUpdates, 5000);

  // Периодическая проверка обновлений (каждый час)
  setInterval(checkForUpdates, 60 * 60 * 1000);
});

app.on('window-all-closed', async () => {
  await UpdateStatusManager.updateStatus('stopped');

  if (app.ws) {
    app.ws.close();
  }

  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Обработка выхода
app.on('before-quit', async () => {
  await Logger.info('Application shutting down');
  await UpdateStatusManager.updateStatus('stopped');
  
  // Закрываем WebSocket соединение
  disconnect();
});