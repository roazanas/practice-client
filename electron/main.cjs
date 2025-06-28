const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const os = require('os');
const WebSocket = require('ws');
const { Console } = require('console');

// Сервер где хранятся релизы
const SERVER_URL = 'http://localhost:8000';

 // Папка updates на сервере
const UPDATE_SERVER_URL = `${SERVER_URL}/updates`;

const WS_URL = 'ws://localhost:8000/ws';

const COMPUTER_NAME = os.hostname();
const APP_VERSION = require('../package.json').version;
const OS_INFO = `${os.type()} ${os.release()} ${os.arch()}`;

let reconnectInterval = null;
let ws = null;

// Определяем isDev - проверяем, находимся ли мы в режиме разработки
const isDev = !app.isPackaged;

if (isDev) {
  const feedUrl = getPlatformUpdateUrl(UPDATE_SERVER_URL);
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: feedUrl 
  });
}


// Логирование
class Logger {
  static async log(level, message) {
    const logEntry = {
      computer_name: COMPUTER_NAME,
      app_version: APP_VERSION,
      os_info: OS_INFO,
      log_level: level,
      message: message
    };

    // Локальное логирование
    console.log(`[${level}] ${message}`);
    
    // Отправка на сервер
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'log',
          data: logEntry
        }));
      } catch (err) {
        console.error('Failed to send log over WebSocket:', err.message);
      }
    } else {
      console.warn('WebSocket not connected. Log not sent to server.');
    }

    // Отправка через WebSocket если подключен
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'log',
        data: logEntry
      }));
    }
  }

  static info(message) { this.log('INFO', message); }
  static warn(message) { this.log('WARN', message); }
  static error(message) { this.log('ERROR', message); }
}

// Управление статусом обновления
class UpdateStatusManager {
  static async updateStatus(status, progress = 0, targetVersion = null) {
    const statusData = {
      computer_name: COMPUTER_NAME,
      current_version: APP_VERSION,
      target_version: targetVersion || APP_VERSION,
      status: status,
      progress: progress
    };

    // try {
    //   await axios.post(`${SERVER_URL}/api/update-status`, statusData);
    // } catch (error) {
    //   Logger.error(`Failed to update status: ${error.message}`);
    // }

    // Отправка через WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'update_status',
        data: statusData
      }));
    }
  }
}

function getPlatformUpdateUrl(baseUrl) {
  switch (process.platform) {
    case 'win32':
      return `${baseUrl}/win`;
    case 'linux':
      return `${baseUrl}/linux`;
    default:
      return baseUrl;
  }
}

function connectWebSocket() {
  try {
    ws = new WebSocket(`${WS_URL}/client/${COMPUTER_NAME}`);
    
    ws.on('open', () => {
      Logger.info('WebSocket connected to server');

      // Если удалось подключиться, то прекращаем переподключение
      clearInterval(reconnectInterval);
      
      // Поддерживаем соединение с сервером, отправляя heartbeat каждые 30 сек
      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, 30 * 1000);
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'force_update':
            Logger.info('Received force update command from server');
            await checkForUpdates();
            break;
          case 'heartbeat_ack':
            // Heartbeat 
            break;
          default:
            Logger.info(`Received unknown message type: ${message.type}`);
        }
      } catch (error) {
        Logger.error(`Error processing WebSocket message: ${error.message}`);
      }
    });

    ws.on('close', () => {
      Logger.warn('WebSocket connection closed, attempting to reconnect...');
      scheduleReconnect();
    });

    ws.on('error', (error) => {
      Logger.error(`WebSocket error: ${error.message}`);
      scheduleReconnect();
    });
  } catch (error) {
    Logger.error(`Failed to connect WebSocket: ${error.message}`);
    scheduleReconnect();
  }
}

// Вызывается в случае, если не удаётся подключиться к WebSocket
function scheduleReconnect() {
  if (reconnectInterval) return;
  
  reconnectInterval = setInterval(() => {
    Logger.info('Attempting to reconnect WebSocket...');
    connectWebSocket();
  }, 10 * 1000);
}

// События автообновления
autoUpdater.on('checking-for-update', async () => {
  Logger.info('Checking for updates...');
  await UpdateStatusManager.updateStatus('checking');
});

autoUpdater.on('update-available', async (info) => {
  Logger.info(`Update available: ${info.version}`);
  await UpdateStatusManager.updateStatus('downloading', 0, info.version);
  
  // Показать уведомление пользователю
  if (Notification.isSupported()) {
    new Notification({
      title: 'Обновление доступно',
      body: `Загружается версия ${info.version}...`
    }).show();
  }
});

autoUpdater.on('update-not-available', async (info) => {
  Logger.info('No updates available');
  await UpdateStatusManager.updateStatus('up_to_date');
});

autoUpdater.on('error', async (err) => {
  Logger.error(`Auto-updater error: ${err.message}`);
  await UpdateStatusManager.updateStatus('error');
});

autoUpdater.on('download-progress', async (progressObj) => {
  const percent = Math.round(progressObj.percent);
  Logger.info(`Download progress: ${percent}% (${progressObj.transferred}/${progressObj.total})`);
  await UpdateStatusManager.updateStatus('downloading', percent);
});

autoUpdater.on('update-downloaded', async (info) => {
  Logger.info(`Update downloaded: ${info.version}`);
  await UpdateStatusManager.updateStatus('installing', 100, info.version);
  
  // Показать диалог пользователю
  const response = await dialog.showMessageBox({
    type: 'info',
    title: 'Обновление загружено',
    message: `Версия ${info.version} готова к установке. Перезапустить приложение сейчас?`,
    buttons: ['Перезапустить', 'Позже'],
    defaultId: 0
  });

  if (response.response === 0) {
    Logger.info('User chose to restart and install update');
    autoUpdater.quitAndInstall();
  } else {
    Logger.info('User chose to install update later');
  }
});

// Проверка обновлений
async function checkForUpdates() {
  try {
    if (isDev) {
      Logger.info('Development mode - skipping update check');
      return;
    }
    
    await autoUpdater.checkForUpdatesAndNotify();
  } catch (error) {
    Logger.error(`Failed to check for updates: ${error.message}`);
  }
}

// Окно
//
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  Logger.info(`Application started - ${APP_VERSION} on ${OS_INFO}`);
}

// IPC handlers
ipcMain.handle('get-app-version', () => APP_VERSION);
ipcMain.handle('get-computer-name', () => COMPUTER_NAME);
ipcMain.handle('get-os-info', () => OS_INFO);

ipcMain.handle('save-auth', (event, authData) => {
  AuthCache.save(authData);
});

ipcMain.handle('load-auth', () => {
  return AuthCache.load();
});

ipcMain.handle('clear-auth', () => {
  AuthCache.clear();
});

ipcMain.handle('check-updates', async () => {
  await checkForUpdates();
});

ipcMain.handle('log', async (event, level, message) => {
  await Logger.log(level, message);
});

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
  
  if (ws) {
    ws.close();
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
});